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
      path.join(fixtureRelativeRoot, "src", "source.ts").split(path.sep).join("/"),
    ),
    true,
  );

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

function cLineEnv(values: Record<string, string>): NodeJS.ProcessEnv {
  return values as NodeJS.ProcessEnv;
}
