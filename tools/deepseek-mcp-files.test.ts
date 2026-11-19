import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  mkdir,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { after, before, test } from "node:test";

import { loadDeepSeekMcpConfig } from "./deepseek-mcp-config";
import {
  listWorkspaceFiles,
  readWorkspaceFile,
  resolveReadableWorkspacePath,
  searchWorkspaceFiles,
} from "./deepseek-mcp-files";

const fixtureRoot = path.join(
  process.cwd(),
  `.deepseek-mcp-test-workspace-${process.pid}`,
);
const outsideRoot = path.join(
  process.cwd(),
  `.deepseek-mcp-test-outside-${process.pid}`,
);
const fixtureRelativeRoot = path.basename(fixtureRoot);
let symlinkAvailable = false;
let symlinkEscapePath = "escape.txt";

before(async () => {
  await Promise.all([
    rm(fixtureRoot, { recursive: true, force: true }),
    rm(outsideRoot, { recursive: true, force: true }),
  ]);
  await Promise.all([
    mkdir(path.join(fixtureRoot, "src"), { recursive: true }),
    mkdir(path.join(fixtureRoot, ".git"), { recursive: true }),
    mkdir(path.join(fixtureRoot, "node_modules"), { recursive: true }),
    mkdir(path.join(fixtureRoot, ".next"), { recursive: true }),
    mkdir(path.join(fixtureRoot, "supabase", ".temp"), {
      recursive: true,
    }),
    mkdir(outsideRoot, { recursive: true }),
  ]);
  await Promise.all([
    writeFile(path.join(fixtureRoot, "src", "source.ts"), "export const value = 1;\n"),
    writeFile(path.join(fixtureRoot, "src", "second.ts"), "export const second = 2;\n"),
    writeFile(path.join(fixtureRoot, "src", "third.ts"), "export const third = 3;\n"),
    writeFile(path.join(fixtureRoot, "src", "large.txt"), "0123456789"),
    writeFile(
      path.join(fixtureRoot, "src", "multiline.ts"),
      "line one ALPHA\nline two alpha\nline three beta\nline four ALPHA",
    ),
    writeFile(
      path.join(fixtureRoot, "src", "binary.bin"),
      Buffer.from([0x41, 0x00, 0x42, 0x41, 0x4c, 0x50, 0x48, 0x41]),
    ),
    writeFile(path.join(fixtureRoot, ".env.local"), "CLINE_API_KEY=not-a-real-secret\n"),
    writeFile(path.join(fixtureRoot, ".git", "config"), "ignored"),
    writeFile(path.join(fixtureRoot, "node_modules", "package.json"), "ignored"),
    writeFile(path.join(fixtureRoot, ".next", "build-manifest.json"), "ignored"),
    writeFile(path.join(fixtureRoot, "supabase", ".temp", "state.json"), "ignored"),
    writeFile(path.join(outsideRoot, "outside.txt"), "outside"),
  ]);

  try {
    await symlink(
      path.join(outsideRoot, "outside.txt"),
      path.join(fixtureRoot, symlinkEscapePath),
    );
    symlinkAvailable = true;
  } catch {
    symlinkEscapePath = "escape-directory";
    try {
      await symlink(
        outsideRoot,
        path.join(fixtureRoot, symlinkEscapePath),
        "junction",
      );
      symlinkAvailable = true;
    } catch {
      symlinkAvailable = false;
    }
  }
});

after(async () => {
  await Promise.all([
    rm(fixtureRoot, { recursive: true, force: true }),
    rm(outsideRoot, { recursive: true, force: true }),
  ]);
});

test("loads valid Cline variables and defaults the provider", async () => {
  const apiKey = `unit-only-${randomUUID()}`;
  const config = loadDeepSeekMcpConfig(
    cLineEnv({
      CLINE_API_KEY: apiKey,
      CLINE_MODEL_ID: "deepseek-test-model",
      CLINE_BASE_URL: "https://example.invalid/v1",
    }),
    fixtureRoot,
  );

  assert.equal(config.workspaceRoot, await realpath(fixtureRoot));
  assert.equal(config.providerId, "openai-compatible");
  assert.equal(config.modelId, "deepseek-test-model");
  assert.equal(config.apiKey, apiKey);
  assert.equal(config.baseUrl, "https://example.invalid/v1");
});

test("reports missing required Cline variables explicitly", () => {
  assert.throws(
    () =>
      loadDeepSeekMcpConfig(
        cLineEnv({ CLINE_MODEL_ID: "deepseek-test-model" }),
        fixtureRoot,
      ),
    /CLINE_API_KEY/,
  );
  assert.throws(
    () =>
      loadDeepSeekMcpConfig(
        cLineEnv({ CLINE_API_KEY: "unit-only-key" }),
        fixtureRoot,
      ),
    /CLINE_MODEL_ID/,
  );
});

test("does not expose the API key in configuration errors", () => {
  const apiKey = `unit-only-${randomUUID()}`;

  assert.throws(
    () =>
      loadDeepSeekMcpConfig(
        cLineEnv({
          CLINE_API_KEY: apiKey,
          CLINE_MODEL_ID: "deepseek-test-model",
        }),
        path.join(fixtureRoot, "missing-root"),
      ),
    (error: unknown) => {
      assert.equal(error instanceof Error, true);
      assert.equal((error as Error).message.includes(apiKey), false);
      return true;
    },
  );
});

test("lists and reads a relative source path", async () => {
  const listed = await listWorkspaceFiles({
    path: path.join(fixtureRelativeRoot, "src"),
  });
  assert.equal(listed.truncated, false);
  assert.equal(
    listed.files.includes(
      path
        .join(fixtureRelativeRoot, "src", "source.ts")
        .split(path.sep)
        .join("/"),
    ),
    true,
  );

  const explicitRootListed = await listWorkspaceFiles({ path: "src" }, fixtureRoot);
  assert.equal(explicitRootListed.files.includes("src/source.ts"), true);

  const result = await readWorkspaceFile({
    path: path.join(fixtureRelativeRoot, "src", "source.ts"),
  });
  assert.equal(
    result.path,
    path.join(fixtureRelativeRoot, "src", "source.ts").split(path.sep).join("/"),
  );
  assert.equal(result.content, "export const value = 1;\n");
  assert.equal(result.truncated, false);
});

test("rejects absolute paths and traversal", async () => {
  await assert.rejects(
    resolveReadableWorkspacePath(
      fixtureRoot,
      path.join(fixtureRoot, "src", "source.ts"),
    ),
    /relative/,
  );
  await assert.rejects(
    resolveReadableWorkspacePath(fixtureRoot, "../outside.txt"),
    /traversal/,
  );
});

test("rejects symlink escapes", async (t) => {
  if (!symlinkAvailable) {
    t.skip("symbolic links are unavailable in this environment");
    return;
  }

  await assert.rejects(
    resolveReadableWorkspacePath(fixtureRoot, symlinkEscapePath),
    /workspace/,
  );
});

test("does not list entries exposed through a symlinked directory", async (t) => {
  if (!symlinkAvailable) {
    t.skip("symbolic links are unavailable in this environment");
    return;
  }

  const listed = await listWorkspaceFiles({ path: fixtureRelativeRoot });
  assert.equal(
    listed.files.some((file) => file.includes("outside.txt")),
    false,
  );
});

test("rejects sensitive workspace paths", async () => {
  for (const blockedPath of [
    path.join(fixtureRelativeRoot, ".env.local"),
    path.join(fixtureRelativeRoot, ".git", "config"),
    path.join(fixtureRelativeRoot, "node_modules", "package.json"),
    path.join(fixtureRelativeRoot, ".next", "build-manifest.json"),
    path.join(fixtureRelativeRoot, "supabase", ".temp", "state.json"),
  ]) {
    await assert.rejects(
      resolveReadableWorkspacePath(fixtureRoot, blockedPath),
      /blocked/,
    );
  }
});

test("sets truncated when directory and file limits are reached", async () => {
  const empty = await listWorkspaceFiles({
    path: path.join(fixtureRelativeRoot, "src"),
    maxEntries: 0,
  });
  assert.deepEqual(empty, { files: [], truncated: true });

  const listed = await listWorkspaceFiles({
    path: path.join(fixtureRelativeRoot, "src"),
    maxEntries: 1,
  });
  assert.equal(listed.files.length, 1);
  assert.equal(listed.truncated, true);

  const result = await readWorkspaceFile({
    path: path.join(fixtureRelativeRoot, "src", "large.txt"),
    maxBytes: 5,
  });
  assert.equal(result.content, "01234");
  assert.equal(result.truncated, true);
});

test("lists files safely when running on win32", async () => {
  await withPlatform("win32", async () => {
    const listed = await listWorkspaceFiles({ path: "." }, fixtureRoot);
    assert.equal(listed.files.includes("src/source.ts"), true);
    assert.equal(
      listed.files.some(
        (file) =>
          file.includes(".env") ||
          file.includes(".git") ||
          file.includes("node_modules") ||
          file.includes(".next") ||
          file.includes("outside.txt"),
      ),
      false,
    );
  });
});

test("reads a bounded line range with metadata and validates bounds", async () => {
  const ranged = await readWorkspaceFile(
    {
      path: "src/multiline.ts",
      startLine: 2,
      endLine: 3,
    },
    fixtureRoot,
  );
  assert.deepEqual(ranged, {
    path: "src/multiline.ts",
    content: "line two alpha\nline three beta",
    truncated: false,
    startLine: 2,
    endLine: 3,
    totalLines: 4,
  });

  const byteCapped = await readWorkspaceFile(
    {
      path: "src/multiline.ts",
      startLine: 1,
      endLine: 4,
      maxBytes: 14,
    },
    fixtureRoot,
  );
  assert.equal(byteCapped.content, "line one ALPHA");
  assert.equal(byteCapped.truncated, true);
  assert.equal(byteCapped.totalLines, 4);

  await assert.rejects(
    readWorkspaceFile({ path: "src/multiline.ts", startLine: 0 }, fixtureRoot),
    /positive integer/,
  );
  await assert.rejects(
    readWorkspaceFile(
      { path: "src/multiline.ts", startLine: 3, endLine: 2 },
      fixtureRoot,
    ),
    /endLine must be greater than or equal to startLine/,
  );
});

test("searches UTF-8 workspace files while excluding blocked and binary files", async () => {
  const insensitive = await searchWorkspaceFiles(
    { query: "ALPHA" },
    fixtureRoot,
  );
  assert.equal(insensitive.truncated, false);
  assert.deepEqual(insensitive.matches, [
    { path: "src/multiline.ts", line: 1, text: "line one ALPHA" },
    { path: "src/multiline.ts", line: 2, text: "line two alpha" },
    { path: "src/multiline.ts", line: 4, text: "line four ALPHA" },
  ]);

  const sensitive = await searchWorkspaceFiles(
    { query: "ALPHA", caseSensitive: true },
    fixtureRoot,
  );
  assert.deepEqual(sensitive.matches, [
    { path: "src/multiline.ts", line: 1, text: "line one ALPHA" },
    { path: "src/multiline.ts", line: 4, text: "line four ALPHA" },
  ]);

  const capped = await searchWorkspaceFiles(
    { query: "ALPHA", maxMatches: 2 },
    fixtureRoot,
  );
  assert.equal(capped.matches.length, 2);
  assert.equal(capped.truncated, true);

  const blockedSearch = await searchWorkspaceFiles(
    { query: "not-a-real-secret" },
    fixtureRoot,
  );
  assert.deepEqual(blockedSearch.matches, []);
});

function cLineEnv(values: Record<string, string>): NodeJS.ProcessEnv {
  return values as NodeJS.ProcessEnv;
}

async function withPlatform(
  platform: NodeJS.Platform,
  callback: () => Promise<void>,
): Promise<void> {
  const originalPlatform = process.platform;
  Object.defineProperty(process, "platform", {
    configurable: true,
    value: platform,
  });
  try {
    await callback();
  } finally {
    Object.defineProperty(process, "platform", {
      configurable: true,
      value: originalPlatform,
    });
  }
}
