import assert from "node:assert/strict";
import { test } from "node:test";

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
  createDeepSeekToolHandler,
  delegateToDeepSeekInputSchema,
} from "./deepseek-mcp.js";
import {
  runDeepSeekTask,
  type WorkerSessionOptions,
} from "./deepseek-mcp-worker.js";

const secret = "test-api-key-that-must-never-leak";
const config = {
  workspaceRoot: "C:\\workspace\\portal-nkl",
  providerId: "openai-compatible",
  modelId: "deepseek-test",
  apiKey: secret,
  baseUrl: "https://provider.invalid/v1",
};

test("delegate_to_deepseek requires a non-empty task", () => {
  assert.throws(() => delegateToDeepSeekInputSchema.parse({ task: "" }));
  assert.throws(() => delegateToDeepSeekInputSchema.parse({ task: "   " }));
  assert.deepEqual(
    delegateToDeepSeekInputSchema.parse({ task: "inspect the repository" }),
    { task: "inspect the repository" },
  );
});

test("successful worker results map text, status, and usage", async () => {
  const result = await runDeepSeekTask("inspect package scripts", {
    config,
    createSession: async () => ({
      async run() {
        return {
          status: "completed",
          text: "The scripts are read-only.",
          finishReason: "stop",
          usage: { inputTokens: 10, outputTokens: 4 },
        };
      },
      async dispose() {},
    }),
  });

  assert.deepEqual(result, {
    status: "completed",
    text: "The scripts are read-only.",
    finishReason: "stop",
    usage: { inputTokens: 10, outputTokens: 4 },
  });
});

test("provider failures return a structured failed result and dispose", async () => {
  let disposed = false;
  const result = await runDeepSeekTask("inspect the repository", {
    config,
    createSession: async () => ({
      async run() {
        throw new Error("provider unavailable");
      },
      async dispose() {
        disposed = true;
      },
    }),
  });

  assert.equal(result.status, "failed");
  assert.equal(result.text, "DeepSeek task failed");
  assert.equal(disposed, true);
  assert.equal(JSON.stringify(result).includes(secret), false);
});

test("deadline aborts the session and disposes it", async () => {
  let aborted = false;
  let disposed = false;
  const result = await runDeepSeekTask(
    "wait forever",
    {
      config,
      deadlineMs: 10,
      createSession: async () => ({
        async run() {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return { status: "completed", text: "late" };
        },
        async abort() {
          aborted = true;
        },
        async dispose() {
          disposed = true;
        },
      }),
    },
  );

  assert.equal(result.status, "aborted");
  assert.equal(aborted, true);
  assert.equal(disposed, true);
});

test("worker uses a fixed local read-only Cline configuration", async () => {
  let options: WorkerSessionOptions | undefined;
  await runDeepSeekTask("list files", {
    config,
    createSession: async (sessionOptions) => {
      options = sessionOptions;
      return {
        async run() {
          return { status: "completed", text: "ok" };
        },
        async dispose() {},
      };
    },
  });

  assert.equal(options?.backendMode, "local");
  assert.equal(options?.cwd, config.workspaceRoot);
  assert.equal(options?.enableSpawnAgent, false);
  assert.equal(options?.enableAgentTeams, false);
  assert.deepEqual(options?.extraTools.map((tool) => tool.name), [
    "list_workspace_files",
    "read_workspace_file",
  ]);
  assert.equal(options?.enableEditing, false);
  assert.equal(options?.enableCommands, false);
  assert.equal(options?.enableWeb, false);
  assert.equal(options?.enableSkills, false);
  assert.equal(options?.enableMcp, false);
  assert.equal(options?.disableMcpSettingsTools, true);
  assert.equal(options?.toolPolicies.editor?.enabled, false);
  assert.equal(options?.toolPolicies.run_commands?.enabled, false);
  assert.equal(options?.toolPolicies.skills?.enabled, false);
  assert.equal(options?.toolPolicies.team?.enabled, false);
});

test("MCP handler returns structured success and error results without secrets", async () => {
  const successHandler = createDeepSeekToolHandler({
    config,
    runTask: async () => ({
      status: "completed",
      text: "safe result",
      finishReason: "stop",
      usage: { outputTokens: 2 },
    }),
  });
  const success = (await successHandler({ task: "inspect" })) as CallToolResult;
  assert.deepEqual(success.content, [{ type: "text", text: "safe result" }]);
  assert.deepEqual(success.structuredContent, {
    status: "completed",
    text: "safe result",
    finishReason: "stop",
    usage: { outputTokens: 2 },
  });
  assert.equal(JSON.stringify(success).includes(secret), false);

  const failureHandler = createDeepSeekToolHandler({
    config,
    runTask: async () => ({
      status: "failed",
      text: "DeepSeek task failed",
    }),
  });
  const failure = (await failureHandler({ task: "inspect" })) as CallToolResult;
  assert.equal(failure.isError, true);
  assert.equal(failure.structuredContent?.status, "failed");
  assert.equal(JSON.stringify(failure).includes(secret), false);

  const secretHandler = createDeepSeekToolHandler({
    config,
    runTask: async () => ({
      status: "completed",
      text: `provider accidentally echoed ${secret}`,
    }),
  });
  const redacted = await secretHandler({ task: "inspect" });
  assert.equal(JSON.stringify(redacted).includes(secret), false);
});
