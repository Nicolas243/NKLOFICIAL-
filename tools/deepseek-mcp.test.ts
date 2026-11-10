import assert from "node:assert/strict";
import { test } from "node:test";

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
  createDeepSeekToolHandler,
  delegateToDeepSeekInputSchema,
  formatStartupError,
} from "./deepseek-mcp.js";
import {
  CURRENT_CLINE_TOOL_IDS,
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

test("startup errors are classified without exposing raw provider details", () => {
  assert.equal(
    formatStartupError(new Error("Missing required CLINE_MODEL_ID")),
    "DeepSeek MCP configuration error: set CLINE_MODEL_ID in .env.local\n",
  );
  assert.equal(
    formatStartupError(new Error(`provider failed with ${secret}`)),
    "DeepSeek MCP startup error: local runtime initialization failed\n",
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
  let abortFinished = false;
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
          await new Promise((resolve) => setTimeout(resolve, 15));
          aborted = true;
          abortFinished = true;
        },
        async dispose() {
          assert.equal(abortFinished, true);
          disposed = true;
        },
      }),
    },
  );

  assert.equal(result.status, "aborted");
  assert.equal(aborted, true);
  assert.equal(disposed, true);
});

test("timeout waits for abort before disposing when run resolves during abort", async () => {
  const events: string[] = [];
  let resolveRun!: (result: { status: "completed"; text: string }) => void;
  const result = await runDeepSeekTask("wait forever", {
    config,
    deadlineMs: 10,
    createSession: async () => ({
      run() {
        return new Promise<{ status: "completed"; text: string }>((resolve) => {
          resolveRun = resolve;
        });
      },
      abort() {
        events.push("abort-start");
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            events.push("run-resolved");
            resolveRun({ status: "completed", text: "late" });
            setTimeout(() => {
              events.push("abort-settled");
              resolve();
            }, 10);
          }, 0);
        });
      },
      dispose() {
        events.push("dispose");
      },
    }),
  });

  assert.equal(result.status, "aborted");
  assert.deepEqual(events, [
    "abort-start",
    "run-resolved",
    "abort-settled",
    "dispose",
  ]);
});

test("ClineCore lifecycle waits for the asynchronous agent completion event", async () => {
  let listener:
    | ((event: {
        type: "agent_event";
        payload: {
          sessionId: string;
          event: {
            type: "done";
            reason: "completed";
            text: string;
            usage: Record<string, unknown>;
          };
        };
      }) => void)
    | undefined;
  let disposed = false;
  let startInput:
    | {
        config: {
          enableTools: boolean;
          enableSpawnAgent: boolean;
          enableAgentTeams: boolean;
          enableEditing: boolean;
          enableCommands: boolean;
          enableWeb: boolean;
          enableSkills: boolean;
          enableMcp: boolean;
          disableMcpSettingsTools: boolean;
          toolPolicies: Record<string, { enabled: boolean }>;
        };
        localRuntime: { extraTools: unknown[] };
      }
    | undefined;
  const result = await runDeepSeekTask("inspect the repository", {
    config,
    createCore: async () => ({
      subscribe(nextListener) {
        listener = nextListener as typeof listener;
        return () => {};
      },
      async start(input) {
        startInput = input as NonNullable<typeof startInput>;
        setTimeout(() => {
          listener?.({
            type: "agent_event",
            payload: {
              sessionId: "session-1",
              event: {
                type: "done",
                reason: "completed",
                text: "async completion",
                usage: { outputTokens: 7 },
              },
            },
          });
        }, 5);
        return { sessionId: "session-1" };
      },
      async abort() {},
      async dispose() {
        disposed = true;
      },
    }),
  });

  assert.deepEqual(result, {
    status: "completed",
    text: "async completion",
    finishReason: "completed",
    usage: { outputTokens: 7 },
  });

  assert.equal(disposed, true);
  assert.ok(startInput);
  assert.equal(startInput.config.enableTools, true);
  assert.equal(startInput.config.enableSpawnAgent, false);
  assert.equal(startInput.config.enableAgentTeams, false);
  assert.equal(startInput.config.enableEditing, false);
  assert.equal(startInput.config.enableCommands, false);
  assert.equal(startInput.config.enableWeb, false);
  assert.equal(startInput.config.enableSkills, false);
  assert.equal(startInput.config.enableMcp, false);
  assert.equal(startInput.config.disableMcpSettingsTools, true);
  assert.equal(startInput.config.toolPolicies.fetch_web_content.enabled, false);
  assert.equal(startInput.config.toolPolicies.ask_question.enabled, false);
  assert.equal(startInput.config.toolPolicies.tasks.enabled, false);
  assert.equal(startInput.config.toolPolicies.spawn_agent.enabled, false);
  assert.equal(startInput.config.toolPolicies.team_status.enabled, false);
  assert.equal(startInput.localRuntime.extraTools.length, 2);
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
  assert.equal(options?.enableEditing, false);
  assert.equal(options?.enableCommands, false);
  assert.equal(options?.enableWeb, false);
  assert.equal(options?.enableSkills, false);
  assert.equal(options?.enableMcp, false);
  assert.deepEqual(options?.extraTools.map((tool) => tool.name), [
    "list_workspace_files",
    "read_workspace_file",
  ]);
  assert.equal(options?.disableMcpSettingsTools, true);
  assert.equal(options?.toolPolicies.editor?.enabled, false);
  assert.equal(options?.toolPolicies.run_commands?.enabled, false);
  assert.equal(options?.toolPolicies.skills?.enabled, false);
  assert.equal(options?.toolPolicies.team_status?.enabled, false);
  assert.deepEqual(
    Object.keys(options?.toolPolicies ?? {}).sort(),
    [...CURRENT_CLINE_TOOL_IDS].sort(),
  );
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
