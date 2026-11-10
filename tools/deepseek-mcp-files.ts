import {
  access,
  open,
  readdir,
  realpath,
  stat,
} from "node:fs/promises";
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

  try {
    const pathInfo = await stat(resolvedPath);
    const files: string[] = [];
    let truncated = false;

    if (pathInfo.isFile()) {
      if (maxEntries === 0) {
        return { files, truncated: true };
      }
      return {
        files: [workspaceRelativePath(workspaceRoot, resolvedPath)],
        truncated: false,
      };
    }
    if (!pathInfo.isDirectory()) {
      throw new Error("Workspace path is not a readable directory");
    }

    const visit = async (directory: string): Promise<void> => {
      const entries = (await readdir(directory, { withFileTypes: true })).sort(
        (left, right) => left.name.localeCompare(right.name),
      );

      for (const entry of entries) {
        const entryPath = path.join(directory, entry.name);
        const relativeEntryPath = path.relative(workspaceRoot, entryPath);
        if (isBlockedPath(relativeEntryPath) || entry.isSymbolicLink()) {
          continue;
        }

        if (entry.isDirectory()) {
          await visit(entryPath);
          if (truncated) {
            return;
          }
          continue;
        }
        if (!entry.isFile()) {
          continue;
        }
        if (files.length >= maxEntries) {
          truncated = true;
          return;
        }

        files.push(workspaceRelativePath(workspaceRoot, entryPath));
      }
    };

    await visit(resolvedPath);
    return { files, truncated };
  } catch (error) {
    if (error instanceof Error && error.message === "Workspace path is not a readable directory") {
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

  let pathInfo;
  try {
    pathInfo = await stat(resolvedPath);
  } catch {
    throw new Error("Workspace file is not readable");
  }
  if (!pathInfo.isFile()) {
    throw new Error("Workspace path is not a file");
  }

  const file = await open(resolvedPath, "r").catch(() => {
    throw new Error("Workspace file is not readable");
  });
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
    await access(target);
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
