import { lstat, open, opendir, realpath, stat } from "node:fs/promises";
import { constants } from "node:fs";
import type { Dir } from "node:fs";
import type { FileHandle } from "node:fs/promises";
import path from "node:path";

const DEFAULT_MAX_ENTRIES = 200;
const MAX_ENTRIES = 1_000;
const DEFAULT_MAX_BYTES = 64 * 1024;
const MAX_BYTES = 1024 * 1024;
const DEFAULT_MAX_MATCHES = 50;
const MAX_MATCHES = 200;
const SEARCH_MAX_FILE_BYTES = 512 * 1024;
const MAX_MATCH_TEXT_CHARS = 240;
const HANDLE_BACKED_DIRECTORY_LISTING_ERROR =
  "Workspace directory listing requires a handle-backed directory API";

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

export async function listWorkspaceFiles(
  input: {
    path?: string;
    maxEntries?: number;
  },
  workspaceRootInput: string = process.cwd(),
): Promise<{ files: string[]; truncated: boolean }> {
  const requestedPath = input.path ?? ".";
  const maxEntries = boundedLimit(
    input.maxEntries,
    DEFAULT_MAX_ENTRIES,
    MAX_ENTRIES,
    "maxEntries",
  );
  const resolvedPath = await resolveReadableWorkspacePath(
    workspaceRootInput,
    requestedPath,
  );
  const workspaceRoot = await resolveRealpath(
    workspaceRootInput,
    "Workspace root is not readable",
  );
  if (maxEntries === 0) {
    return { files: [], truncated: true };
  }

  try {
    if (!usesHandleBackedDirectoryListing()) {
      const targetStat = await lstat(resolvedPath);
      if (targetStat.isSymbolicLink()) {
        throw new Error("Workspace path is not a readable directory");
      }
      const canonicalTarget = await validateCurrentTarget(
        resolvedPath,
        workspaceRoot,
        "Workspace path is not a readable directory",
      );
      if (targetStat.isFile()) {
        const file = await openFileAtUse(canonicalTarget, workspaceRoot);
        try {
          return {
            files: [workspaceRelativePath(workspaceRoot, canonicalTarget)],
            truncated: false,
          };
        } finally {
          await file.close();
        }
      }
      if (!targetStat.isDirectory()) {
        throw new Error("Workspace path is not a readable directory");
      }

      const files: string[] = [];
      const visited = new Set<string>();
      const truncated = await visitDirectoryWin32(
        canonicalTarget,
        workspaceRoot,
        files,
        maxEntries,
        visited,
      );
      return { files, truncated };
    }

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
        workspaceRoot,
        files,
        maxEntries,
      );
      return { files, truncated };
    } finally {
      await closeDirectory(directory);
    }
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Workspace path is not a readable directory" ||
        error.message === HANDLE_BACKED_DIRECTORY_LISTING_ERROR)
    ) {
      throw error;
    }
    throw new Error("Workspace listing failed");
  }
}

export async function readWorkspaceFile(
  input: {
    path: string;
    maxBytes?: number;
    startLine?: number;
    endLine?: number;
  },
  workspaceRootInput: string = process.cwd(),
): Promise<{
  path: string;
  content: string;
  truncated: boolean;
  startLine?: number;
  endLine?: number;
  totalLines?: number;
}> {
  const maxBytes = boundedLimit(
    input.maxBytes,
    DEFAULT_MAX_BYTES,
    MAX_BYTES,
    "maxBytes",
  );
  const hasLineRange =
    input.startLine !== undefined || input.endLine !== undefined;
  const startLine = positiveLineNumber(input.startLine, "startLine");
  const endLine = positiveLineNumber(input.endLine, "endLine");
  const effectiveStart = startLine ?? 1;
  if (endLine !== undefined && endLine < effectiveStart) {
    throw new Error("endLine must be greater than or equal to startLine");
  }

  const resolvedPath = await resolveReadableWorkspacePath(
    workspaceRootInput,
    input.path,
  );
  const workspaceRoot = await resolveRealpath(
    workspaceRootInput,
    "Workspace root is not readable",
  );

  let file;
  try {
    file = await openFileAtUse(resolvedPath, workspaceRoot);
  } catch {
    throw new Error("Workspace file is not readable");
  }
  try {
    const relativePath = workspaceRelativePath(workspaceRoot, resolvedPath);
    if (!hasLineRange) {
      const buffer = Buffer.alloc(maxBytes + 1);
      const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
      return {
        path: relativePath,
        content: buffer.subarray(0, Math.min(bytesRead, maxBytes)).toString("utf8"),
        truncated: bytesRead > maxBytes,
      };
    }

    const buffer = Buffer.alloc(MAX_BYTES + 1);
    const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
    const fileTruncated = bytesRead > MAX_BYTES;
    const rawText = buffer
      .subarray(0, Math.min(bytesRead, MAX_BYTES))
      .toString("utf8");
    const lines = bytesRead === 0 ? [] : rawText.split(/\r?\n/);
    const totalLines = lines.length;
    const effectiveEnd = Math.min(endLine ?? totalLines, totalLines);
    const sliced =
      effectiveStart <= totalLines
        ? lines.slice(effectiveStart - 1, effectiveEnd)
        : [];
    const actualEnd = sliced.length > 0 ? effectiveStart + sliced.length - 1 : 0;
    const joined = sliced.join("\n");
    const { content, exceeded: byteTruncated } = sliceUtf8ToMaxBytes(
      joined,
      maxBytes,
    );

    return {
      path: relativePath,
      content,
      truncated: fileTruncated || byteTruncated,
      startLine: effectiveStart,
      endLine: actualEnd,
      totalLines,
    };
  } catch {
    throw new Error("Workspace file is not readable");
  } finally {
    await file.close();
  }
}

export interface WorkspaceSearchMatch {
  path: string;
  line: number;
  text: string;
}

export async function searchWorkspaceFiles(
  input: {
    query: string;
    path?: string;
    maxMatches?: number;
    caseSensitive?: boolean;
  },
  workspaceRootInput: string = process.cwd(),
): Promise<{ matches: WorkspaceSearchMatch[]; truncated: boolean }> {
  if (typeof input.query !== "string" || input.query.trim().length === 0) {
    throw new Error("query must be a non-empty string");
  }

  const maxMatches = boundedLimit(
    input.maxMatches,
    DEFAULT_MAX_MATCHES,
    MAX_MATCHES,
    "maxMatches",
  );
  if (maxMatches === 0) {
    return { matches: [], truncated: true };
  }

  const listed = await listWorkspaceFiles(
    { path: input.path ?? ".", maxEntries: MAX_ENTRIES },
    workspaceRootInput,
  );
  const workspaceRoot = await resolveRealpath(
    workspaceRootInput,
    "Workspace root is not readable",
  );
  const caseSensitive = input.caseSensitive === true;
  const needle = caseSensitive ? input.query : input.query.toLowerCase();
  const matches: WorkspaceSearchMatch[] = [];
  const buffer = Buffer.alloc(SEARCH_MAX_FILE_BYTES);
  let matchTruncated = false;

  for (const relativeFilePath of listed.files) {
    let resolvedFilePath: string;
    try {
      resolvedFilePath = await resolveReadableWorkspacePath(
        workspaceRoot,
        relativeFilePath,
      );
    } catch {
      continue;
    }

    let file;
    try {
      file = await openFileAtUse(resolvedFilePath, workspaceRoot);
    } catch {
      continue;
    }

    try {
      const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
      const fileBytes = buffer.subarray(0, bytesRead);
      if (fileBytes.includes(0)) {
        continue;
      }

      const lines = fileBytes.toString("utf8").split(/\r?\n/);
      for (let index = 0; index < lines.length; index += 1) {
        const lineText = lines[index] ?? "";
        const haystack = caseSensitive ? lineText : lineText.toLowerCase();
        if (!haystack.includes(needle)) {
          continue;
        }
        if (matches.length >= maxMatches) {
          matchTruncated = true;
          break;
        }
        matches.push({
          path: relativeFilePath,
          line: index + 1,
          text: lineText.trim().slice(0, MAX_MATCH_TEXT_CHARS),
        });
      }
    } catch {
      continue;
    } finally {
      await file.close();
    }

    if (matchTruncated) {
      break;
    }
  }

  return {
    matches,
    truncated: matchTruncated || listed.truncated,
  };
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

interface SecureDirectory {
  directory: Dir;
  anchor: FileHandle;
  path: string;
}

async function openDirectoryAtUse(
  target: string,
  workspaceRoot: string,
): Promise<SecureDirectory | undefined> {
  const noFollow = (constants as { O_NOFOLLOW?: number }).O_NOFOLLOW ?? 0;
  const directoryOnly = (constants as { O_DIRECTORY?: number }).O_DIRECTORY ?? 0;
  let anchor: FileHandle;
  try {
    anchor = await open(target, constants.O_RDONLY | noFollow | directoryOnly);
  } catch (error) {
    if (isNotDirectoryError(error)) {
      return undefined;
    }
    throw error;
  }

  try {
    const anchorInfo = await anchor.stat();
    const currentTarget = await validateCurrentTarget(
      target,
      workspaceRoot,
      "Workspace path is not a readable directory",
    );
    const currentInfo = await stat(currentTarget);
    if (!anchorInfo.isDirectory() || !sameFile(anchorInfo, currentInfo)) {
      throw new Error("Workspace directory changed while opening");
    }

    const directory = await openDirectoryCursor(anchor);
    try {
      await assertDirectoryAnchor(
        { directory, anchor, path: target },
        workspaceRoot,
      );
      return { directory, anchor, path: target };
    } catch (error) {
      await directory.close();
      throw error;
    }
  } catch (error) {
    await anchor.close();
    if (isNotDirectoryError(error)) {
      return undefined;
    }
    throw error;
  }
}

async function openDirectoryCursor(
  anchor: FileHandle,
): Promise<Dir> {
  const handlePath = directoryHandlePath(anchor);
  if (!handlePath) {
    throw new Error(HANDLE_BACKED_DIRECTORY_LISTING_ERROR);
  }
  return opendir(handlePath, { bufferSize: 1 });
}

function usesHandleBackedDirectoryListing(): boolean {
  return (
    process.platform === "linux" ||
    process.platform === "darwin" ||
    process.platform.endsWith("bsd")
  );
}

function positiveLineNumber(
  value: number | undefined,
  name: string,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function sliceUtf8ToMaxBytes(
  value: string,
  maxBytes: number,
): { content: string; exceeded: boolean } {
  const buffer = Buffer.from(value, "utf8");
  if (buffer.byteLength <= maxBytes) {
    return { content: value, exceeded: false };
  }
  let end = maxBytes;
  while (end > 0 && (buffer[end]! & 0xc0) === 0x80) {
    end -= 1;
  }
  return {
    content: buffer.subarray(0, end).toString("utf8"),
    exceeded: true,
  };
}

async function visitDirectoryWin32(
  dirPath: string,
  workspaceRoot: string,
  files: string[],
  maxEntries: number,
  visited: Set<string>,
): Promise<boolean> {
  const canonicalDir = await validateCurrentTarget(
    dirPath,
    workspaceRoot,
    "Workspace directory is not readable",
  );
  if (visited.has(canonicalDir)) {
    return false;
  }
  visited.add(canonicalDir);

  const directory = await opendir(canonicalDir, { bufferSize: 16 });
  try {
    while (true) {
      if (files.length >= maxEntries) {
        return true;
      }
      const entry = await directory.read();
      if (!entry) {
        return false;
      }
      await validateCurrentTarget(
        canonicalDir,
        workspaceRoot,
        "Workspace directory is no longer readable",
      );

      const entryPath = path.join(canonicalDir, entry.name);
      const relativeEntryPath = path.relative(workspaceRoot, entryPath);
      if (isBlockedPath(relativeEntryPath) || entry.isSymbolicLink()) {
        continue;
      }

      let entryStat;
      let canonicalEntry: string;
      try {
        entryStat = await lstat(entryPath);
        if (entryStat.isSymbolicLink()) {
          continue;
        }
        canonicalEntry = await validateCurrentTarget(
          entryPath,
          workspaceRoot,
          "Workspace path is not readable",
        );
      } catch {
        continue;
      }

      if (entryStat.isDirectory()) {
        const truncated = await visitDirectoryWin32(
          canonicalEntry,
          workspaceRoot,
          files,
          maxEntries,
          visited,
        );
        if (truncated) {
          return true;
        }
        continue;
      }

      if (!entryStat.isFile()) {
        continue;
      }

      let file;
      try {
        file = await openFileAtUse(canonicalEntry, workspaceRoot);
      } catch {
        continue;
      }
      await file.close();
      files.push(workspaceRelativePath(workspaceRoot, canonicalEntry));
      if (files.length >= maxEntries) {
        return true;
      }
    }
  } finally {
    await directory.close();
  }
}

function directoryHandlePath(anchor: FileHandle): string | undefined {
  if (process.platform === "linux") {
    return `/proc/self/fd/${anchor.fd}`;
  }
  if (process.platform === "darwin" || process.platform.endsWith("bsd")) {
    return `/dev/fd/${anchor.fd}`;
  }
  return undefined;
}

async function closeDirectory(directory: SecureDirectory): Promise<void> {
  await directory.directory.close();
  await directory.anchor.close();
}

async function assertDirectoryAnchor(
  directory: SecureDirectory,
  workspaceRoot: string,
): Promise<void> {
  const anchorInfo = await directory.anchor.stat();
  const currentTarget = await validateCurrentTarget(
    directory.path,
    workspaceRoot,
    "Workspace directory is no longer readable",
  );
  const currentInfo = await stat(currentTarget);
  if (!anchorInfo.isDirectory() || !sameFile(anchorInfo, currentInfo)) {
    throw new Error("Workspace directory changed while reading");
  }
}

async function visitDirectory(
  directory: SecureDirectory,
  workspaceRoot: string,
  files: string[],
  maxEntries: number,
): Promise<boolean> {
  while (true) {
    await assertDirectoryAnchor(directory, workspaceRoot);
    const entry = await directory.directory.read();
    if (!entry) {
      return false;
    }
    await assertDirectoryAnchor(
      directory,
      workspaceRoot,
    );
    if (files.length >= maxEntries) {
      return true;
    }

    const entryPath = path.join(directory.path, entry.name);
    const relativeEntryPath = path.relative(workspaceRoot, entryPath);
    if (isBlockedPath(relativeEntryPath) || entry.isSymbolicLink()) {
      continue;
    }

    // Node's Dir does not expose a descriptor identity; validate every entry
    // against a newly opened handle before returning or descending.
    if (entry.isDirectory()) {
      let childDirectory: SecureDirectory | undefined;
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
              workspaceRoot,
              files,
              maxEntries,
            )
          ) {
            return true;
          }
        } finally {
          await closeDirectory(childDirectory);
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
