import { open, opendir, realpath, stat } from "node:fs/promises";
import { constants } from "node:fs";
import type { Dir } from "node:fs";
import path from "node:path";

const DEFAULT_MAX_ENTRIES = 200;
const MAX_ENTRIES = 1_000;
const DEFAULT_MAX_BYTES = 64 * 1024;
const MAX_BYTES = 1024 * 1024;

const blockedFileNames = new Set([
  "credentials",
  "credentials.json",
  "id_rsa",
  "id_ed25519",
  "service-account.json",
]);
const blockedExtensions = new Set([".key", ".pem", ".p12", ".pfx"]);

export async function resolveReadableWorkspacePath(
  workspaceRoot: string,
  relativePath: string,
): Promise<string> {
  if (
    typeof relativePath !== "string" ||
    relativePath.includes("\0") ||
    path.isAbsolute(relativePath) ||
    path.posix.isAbsolute(relativePath) ||
    path.win32.isAbsolute(relativePath)
  ) {
    throw new Error("Workspace paths must be relative");
  }

  const pathSegments = relativePath.split(/[\\/]+/).filter(Boolean);
  if (pathSegments.includes("..")) {
    throw new Error("Workspace path traversal is not allowed");
  }
  if (isBlockedPath(relativePath)) {
    throw new Error("Workspace path is blocked");
  }

  const canonicalRoot = await resolveRealpath(workspaceRoot, "Workspace root is not readable");
  const candidate = path.resolve(canonicalRoot, relativePath || ".");
  if (!isContained(canonicalRoot, candidate)) {
    throw new Error("Workspace path traversal is not allowed");
  }

  const canonicalCandidate = await resolveRealpath(
    candidate,
    "Workspace path is not readable",
  );
  if (!isContained(canonicalRoot, canonicalCandidate)) {
    throw new Error("Workspace path resolves outside the workspace");
  }
  if (isBlockedPath(path.relative(canonicalRoot, canonicalCandidate))) {
    throw new Error("Workspace path is blocked");
  }

  return canonicalCandidate;
}

export async function listWorkspaceFiles(input: {
  path?: string;
  maxEntries?: number;
}): Promise<{ files: string[]; truncated: boolean }> {
  const requestedPath = input.path ?? ".";
  const maxEntries = boundedLimit(
    input.maxEntries,
    DEFAULT_MAX_ENTRIES,
    MAX_ENTRIES,
    "maxEntries",
  );
  const resolvedPath = await resolveReadableWorkspacePath(process.cwd(), requestedPath);
  const workspaceRoot = await resolveRealpath(
    process.cwd(),
    "Workspace root is not readable",
  );
  if (maxEntries === 0) {
    return { files: [], truncated: true };
  }

  try {
    const files: string[] = [];
    const directory = await openDirectoryAtUse(resolvedPath, workspaceRoot);
    if (!directory) {
      const file = await openFileAtUse(resolvedPath, workspaceRoot);
      try {
        return {
          files: [workspaceRelativePath(workspaceRoot, resolvedPath)],
          truncated: false,
        };
      } finally {
        await file.close();
      }
    }

    try {
      const truncated = await visitDirectory(
        directory,
        resolvedPath,
        workspaceRoot,
        files,
        maxEntries,
      );
      return { files, truncated };
    } finally {
      await directory.close();
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Workspace path is not a readable directory"
    ) {
      throw error;
    }
    throw new Error("Workspace listing failed");
  }
}

export async function readWorkspaceFile(input: {
  path: string;
  maxBytes?: number;
}): Promise<{ path: string; content: string; truncated: boolean }> {
  const maxBytes = boundedLimit(
    input.maxBytes,
    DEFAULT_MAX_BYTES,
    MAX_BYTES,
    "maxBytes",
  );
  const resolvedPath = await resolveReadableWorkspacePath(process.cwd(), input.path);
  const workspaceRoot = await resolveRealpath(
    process.cwd(),
    "Workspace root is not readable",
  );

  let file;
  try {
    file = await openFileAtUse(resolvedPath, workspaceRoot);
  } catch {
    throw new Error("Workspace file is not readable");
  }
  try {
    const buffer = Buffer.alloc(maxBytes + 1);
    const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
    return {
      path: workspaceRelativePath(workspaceRoot, resolvedPath),
      content: buffer.subarray(0, Math.min(bytesRead, maxBytes)).toString("utf8"),
      truncated: bytesRead > maxBytes,
    };
  } catch {
    throw new Error("Workspace file is not readable");
  } finally {
    await file.close();
  }
}

function boundedLimit(
  value: number | undefined,
  fallback: number,
  maximum: number,
  name: string,
): number {
  if (value === undefined) {
    return fallback;
  }
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return Math.min(value, maximum);
}

async function resolveRealpath(target: string, message: string): Promise<string> {
  try {
    return await realpath(target);
  } catch {
    throw new Error(message);
  }
}

function isContained(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function isBlockedPath(relativePath: string): boolean {
  const segments = relativePath
    .split(/[\\/]+/)
    .filter(Boolean)
    .map((segment) => segment.toLowerCase());

  return segments.some((segment, index) => {
    if (
      segment.startsWith(".env") ||
      segment === ".git" ||
      segment === ".next" ||
      segment === "node_modules" ||
      blockedFileNames.has(segment) ||
      blockedExtensions.has(path.extname(segment))
    ) {
      return true;
    }
    return segment === "supabase" && segments[index + 1] === ".temp";
  });
}

function workspaceRelativePath(root: string, target: string): string {
  return path.relative(root, target).split(path.sep).join("/");
}

async function openFileAtUse(
  target: string,
  workspaceRoot: string,
) {
  const noFollow = (constants as { O_NOFOLLOW?: number }).O_NOFOLLOW ?? 0;
  const file = await open(target, constants.O_RDONLY | noFollow);
  try {
    const openedInfo = await file.stat();
    const currentTarget = await validateCurrentTarget(
      target,
      workspaceRoot,
      "Workspace file is not readable",
    );
    const currentInfo = await stat(currentTarget);
    if (!openedInfo.isFile() || !sameFile(openedInfo, currentInfo)) {
      throw new Error("Workspace file changed while opening");
    }
    return file;
  } catch (error) {
    await file.close();
    throw error;
  }
}

async function openDirectoryAtUse(
  target: string,
  workspaceRoot: string,
): Promise<Dir | undefined> {
  let directory: Dir;
  try {
    directory = await opendir(target);
  } catch (error) {
    if (isNotDirectoryError(error)) {
      return undefined;
    }
    throw error;
  }

  try {
    await validateCurrentTarget(
      target,
      workspaceRoot,
      "Workspace path is not a readable directory",
    );
    return directory;
  } catch (error) {
    await directory.close();
    throw error;
  }
}

async function visitDirectory(
  directory: Dir,
  directoryPath: string,
  workspaceRoot: string,
  files: string[],
  maxEntries: number,
): Promise<boolean> {
  while (true) {
    const entry = await directory.read();
    if (!entry) {
      return false;
    }
    if (files.length >= maxEntries) {
      return true;
    }

    const entryPath = path.join(directoryPath, entry.name);
    const relativeEntryPath = path.relative(workspaceRoot, entryPath);
    if (isBlockedPath(relativeEntryPath) || entry.isSymbolicLink()) {
      continue;
    }

    // Node's Dir does not expose a descriptor identity; validate every entry
    // against a newly opened handle before returning or descending.
    if (entry.isDirectory()) {
      let childDirectory: Dir | undefined;
      try {
        childDirectory = await openDirectoryAtUse(entryPath, workspaceRoot);
      } catch {
        continue;
      }
      if (childDirectory) {
        try {
          if (
            await visitDirectory(
              childDirectory,
              entryPath,
              workspaceRoot,
              files,
              maxEntries,
            )
          ) {
            return true;
          }
        } finally {
          await childDirectory.close();
        }
      }
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }

    let file;
    try {
      file = await openFileAtUse(entryPath, workspaceRoot);
    } catch {
      continue;
    }
    await file.close();
    files.push(workspaceRelativePath(workspaceRoot, entryPath));
    if (files.length >= maxEntries) {
      return true;
    }
  }
}

async function validateCurrentTarget(
  target: string,
  workspaceRoot: string,
  errorMessage: string,
): Promise<string> {
  let currentTarget: string;
  try {
    currentTarget = await realpath(target);
  } catch {
    throw new Error(errorMessage);
  }
  if (
    !isContained(workspaceRoot, currentTarget) ||
    isBlockedPath(path.relative(workspaceRoot, currentTarget))
  ) {
    throw new Error("Workspace path resolves outside the workspace");
  }
  return currentTarget;
}

function sameFile(
  left: { dev: number; ino: number },
  right: { dev: number; ino: number },
): boolean {
  return left.dev === right.dev && left.ino === right.ino;
}

function isNotDirectoryError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOTDIR"
  );
}
