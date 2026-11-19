import assert from "node:assert/strict";
import { test } from "node:test";

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
  askNklWorkerInputSchema,
  createDeepSeekMcpServer,
  createDeepSeekToolHandler,
  delegateToDeepSeekInputSchema,
  formatStartupError,
  hasNklRouterConfiguration,
} from "./deepseek-mcp.js";
import {
  CURRENT_CLINE_TOOL_IDS,
  runDeepSeekTask,
  type WorkerSessionOptions,
} from "./deepseek-mcp-worker.js";
import type { NklRouterConfig } from "./nkl-router-config.js";
import type { NklOrchestrationResult } from "./nkl-subagent-orchestrator.js";

const secret = "test-api-key-that-must-never-leak";
const config = {
  workspaceRoot: "C:\\workspace\\portal-nkl",
  providerId: "openai-compatible",
  modelId: "deepseek-test",
  apiKey: secret,
  baseUrl: "https://provider.invalid/v1",
};

const nklConfig: NklRouterConfig = {
  workspaceRoot: "C:\\workspace\\portal-nkl",
  router: {
    providerId: "openai-compatible",
    baseUrl: "https://router.invalid/v1",
    apiKey: "router-secret",
    models: {
      orchestrator: "NKL-ORQUESTRADOR",
      worker: "NKL-OPERARIOS",
      reviewer: "NKL-REVISOR",
    },
    maxWorkers: 3,
    reviewerRequired: true,
    retryLimit: 1,
  },
};

test("delegate_to_deepseek and ask_nkl_worker require a non-empty task", () => {
  assert.throws(() => delegateToDeepSeekInputSchema.parse({ task: "" }));
  assert.throws(() => delegateToDeepSeekInputSchema.parse({ task: "   " }));
  assert.deepEqual(
    delegateToDeepSeekInputSchema.parse({
      task: "inspect the repository",
      mode: "single",
      role: "worker",
      model: "NKL-CUSTOM",
    }),
    {
      task: "inspect the repository",
      mode: "single",
      role: "worker",
      model: "NKL-CUSTOM",
    },
  );

  assert.throws(() => askNklWorkerInputSchema.parse({ task: "" }));
  assert.deepEqual(
    askNklWorkerInputSchema.parse({ task: "check file", model: "NKL-FAST" }),
    { task: "check file", model: "NKL-FAST" },
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
          mode: string;
          maxIterations: number;
          enableTools: boolean;
          enableSpawnAgent: boolean;
          enableAgentTeams: boolean;
          disableMcpSettingsTools: boolean;
          toolPolicies: Record<string, { enabled: boolean }>;
        };
        localRuntime: {
          extraTools: Array<{ name: string }>;
          configExtensions: unknown[];
        };
        plugins: Record<string, { enabled: boolean }>;
        mode: string;
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
  assert.equal(startInput.config.mode, "plan");
  assert.equal(startInput.config.maxIterations, 12);
  assert.equal(startInput.config.enableTools, true);
  assert.equal(startInput.config.enableSpawnAgent, false);
  assert.equal(startInput.config.enableAgentTeams, false);
  assert.equal(startInput.config.disableMcpSettingsTools, true);
  assert.deepEqual(startInput.localRuntime.configExtensions, []);
  assert.deepEqual(startInput.plugins, { "*": { enabled: false } });
  assert.equal(startInput.mode, "subagent");
  assert.equal(startInput.config.toolPolicies.fetch_web_content.enabled, false);
  assert.equal(startInput.config.toolPolicies.ask_question.enabled, false);
  assert.equal(startInput.config.toolPolicies.tasks.enabled, false);
  assert.equal(startInput.config.toolPolicies.spawn_agent.enabled, false);
  assert.equal(startInput.config.toolPolicies.team_status.enabled, false);
  assert.deepEqual(
    startInput.localRuntime.extraTools.map((tool) => tool.name),
    ["list_workspace_files", "read_workspace_file", "search_workspace"],
  );
});

test("ClineCore ignores recoverable error events and completes on done", async () => {
  let listener:
    | ((event: {
        type: "agent_event";
        payload: {
          sessionId: string;
          event: {
            type: "done" | "error";
            reason?: string;
            text?: string;
            recoverable?: boolean;
          };
        };
      }) => void)
    | undefined;

  const result = await runDeepSeekTask("recover and complete", {
    config,
    createCore: async () => ({
      subscribe(nextListener) {
        listener = nextListener as typeof listener;
        return () => {};
      },
      async start() {
        setTimeout(() => {
          listener?.({
            type: "agent_event",
            payload: {
              sessionId: "session-rec",
              event: {
                type: "error",
                recoverable: true,
              },
            },
          });
          listener?.({
            type: "agent_event",
            payload: {
              sessionId: "session-rec",
              event: {
                type: "done",
                reason: "completed",
                text: "recovered cleanly",
              },
            },
          });
        }, 5);
        return { sessionId: "session-rec" };
      },
      async abort() {},
      async dispose() {},
    }),
  });

  assert.equal(result.status, "completed");
  assert.equal(result.text, "recovered cleanly");
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
  assert.equal(options?.mode, "plan");
  assert.equal(options?.maxIterations, 12);
  assert.equal(options?.enableSpawnAgent, false);
  assert.equal(options?.enableAgentTeams, false);
  assert.deepEqual(options?.plugins, { "*": { enabled: false } });
  assert.deepEqual(options?.configExtensions, []);
  assert.deepEqual(options?.extraTools.map((tool) => tool.name), [
    "list_workspace_files",
    "read_workspace_file",
    "search_workspace",
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

test("combined MCP handler routes tasks to the NKL orchestrator", async () => {
  let receivedTask = "";
  const orchestration: NklOrchestrationResult = {
    status: "completed",
    text: "compact combined result",
    plan: "inspect the repository",
    workers: [],
    review: {
      role: "reviewer",
      status: "completed",
      text: "review passed",
      evidence: [],
    },
    fallbackUsed: false,
  };
  const handler = createDeepSeekToolHandler({
    config,
    nklConfig,
    runOrchestrator: async (task) => {
      receivedTask = task;
      return orchestration;
    },
  });

  const result = await handler({ task: "inspect the repository" });

  assert.equal(receivedTask, "inspect the repository");
  assert.deepEqual(result.structuredContent, orchestration);
  assert.deepEqual(result.content, [
    { type: "text", text: "compact combined result" },
  ]);
  assert.equal(result.isError, undefined);
});

test("combined MCP handler marks mandatory reviewer failures as MCP errors", async () => {
  const handler = createDeepSeekToolHandler({
    config,
    nklConfig,
    runOrchestrator: async () => ({
      status: "incomplete",
      text: "review unavailable",
      plan: "inspect",
      workers: [],
      review: {
        role: "reviewer",
        status: "failed",
        text: "review failed",
        evidence: [],
      },
      fallbackUsed: false,
    }),
  });

  const result = await handler({ task: "inspect" });

  assert.equal(result.isError, true);
  assert.equal(result.structuredContent?.status, "incomplete");
});

test("combined handler serializes requests and startup detects partial router configuration", async () => {
  const order: string[] = [];
  const handler = createDeepSeekToolHandler({
    config,
    nklConfig,
    runOrchestrator: async (task) => {
      order.push(`start:${task}`);
      await new Promise((resolve) => setTimeout(resolve, 5));
      order.push(`end:${task}`);
      return {
        status: "completed",
        text: task,
        plan: task,
        workers: [],
        review: {
          role: "reviewer",
          status: "completed",
          text: "ok",
          evidence: [],
        },
        fallbackUsed: false,
      };
    },
  });

  await Promise.all([handler({ task: "one" }), handler({ task: "two" })]);
  assert.deepEqual(order, ["start:one", "end:one", "start:two", "end:two"]);
  assert.equal(
    hasNklRouterConfiguration({
      NODE_ENV: "test",
      NINE_ROUTER_API_KEY: "present",
    }),
    true,
  );
  assert.equal(
    hasNklRouterConfiguration({ NODE_ENV: "test", CLINE_API_KEY: "present" }),
    false,
  );
  assert.equal(
    hasNklRouterConfiguration({
      NODE_ENV: "test",
      NINE_ROUTER_ORCHESTRATOR_MODEL: "NKL-ORQUESTRADOR",
    }),
    true,
  );

  const pureRouterServer = createDeepSeekMcpServer({
    nklConfig,
    listModels: async () => ({
      status: "completed",
      models: ["NKL-OPERARIOS", "NKL-ORQUESTRADOR"],
    }),
  });
  assert.ok(pureRouterServer);
});

test("single-worker mode and model override run pure 9router without Cline or orchestration", async () => {
  let orchestratorCalled = false;
  let capturedRole: string | undefined;
  let capturedPrompt: string | undefined;
  let capturedModelOverride: string | undefined;

  const handler = createDeepSeekToolHandler({
    nklConfig,
    runOrchestrator: async () => {
      orchestratorCalled = true;
      throw new Error("orchestrator must not run in single mode");
    },
    runRole: async (role, prompt, deps) => {
      capturedRole = role;
      capturedPrompt = prompt;
      capturedModelOverride = deps?.modelOverride;
      return {
        role,
        status: "completed",
        text: `finding with ${nklConfig.router.apiKey}`,
        evidence: [
          {
            path: "src/app/page.tsx",
            lines: "1-10",
            note: `secret=${nklConfig.router.apiKey}`,
          },
        ],
      };
    },
  });

  const result = await handler({
    task: "check home page",
    mode: "single",
    role: "worker",
  });

  assert.equal(orchestratorCalled, false);
  assert.equal(capturedRole, "worker");
  assert.equal(capturedPrompt, "check home page");
  assert.equal(capturedModelOverride, undefined);
  assert.equal(result.isError, undefined);
  assert.equal(JSON.stringify(result).includes(nklConfig.router.apiKey), false);

  await handler({
    task: "use custom combo",
    model: "NKL-CUSTOM",
  });
  assert.equal(orchestratorCalled, false);
  assert.equal(capturedModelOverride, "NKL-CUSTOM");

  const failedHandler = createDeepSeekToolHandler({
    nklConfig,
    runRole: async (role) => ({
      role,
      status: "failed",
      text: "9router task failed",
      evidence: [],
    }),
  });
  const failedResult = await failedHandler({
    task: "check home page",
    mode: "single",
  });
  assert.equal(failedResult.isError, true);
});
