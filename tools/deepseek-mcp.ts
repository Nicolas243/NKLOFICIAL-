import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { DeepSeekMcpConfig } from "./deepseek-mcp-config.js";
import { loadDeepSeekMcpConfig } from "./deepseek-mcp-config.js";
import {
  runDeepSeekTask,
  redactResult,
  type DeepSeekTaskResult,
  type WorkerDependencies,
} from "./deepseek-mcp-worker.js";
import {
  listRouterModels,
  type DirectWorkerConfig,
  type DirectWorkerDependencies,
  type RouterModelsResult,
} from "./nkl-openai-worker.js";
import {
  loadNklRouterConfig,
  type NklRole,
  type NklRouterConfig,
} from "./nkl-router-config.js";
import {
  runNklRoleTask,
  type NklRoleResult,
  type RouterRunnerDependencies,
} from "./nkl-router-runner.js";
import {
  orchestrateNklTask,
  type NklOrchestrationResult,
  type OrchestratorDependencies,
} from "./nkl-subagent-orchestrator.js";

const nklRoleSchema = z.enum(["orchestrator", "worker", "reviewer"]);
const deepSeekModeSchema = z.enum(["single", "orchestrated"]);
const optionalModelSchema = z.string().trim().min(1).optional();

export const delegateToDeepSeekInputSchema = z.object({
  task: z.string().trim().min(1, "task must not be empty"),
  mode: deepSeekModeSchema.optional(),
  role: nklRoleSchema.optional(),
  model: optionalModelSchema,
});

export const askNklWorkerInputSchema = z.object({
  task: z.string().trim().min(1, "task must not be empty"),
  role: nklRoleSchema.optional(),
  model: optionalModelSchema,
});

export function resolveDefaultWorkspaceRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

export interface DeepSeekToolHandlerOptions extends WorkerDependencies {
  config?: DeepSeekMcpConfig;
  nklConfig?: NklRouterConfig;
  fetchImpl?: typeof fetch;
  runDirectTask?: (
    task: string,
    config: DirectWorkerConfig,
    deps?: DirectWorkerDependencies,
  ) => Promise<DeepSeekTaskResult>;
  listModels?: (
    config: Pick<DirectWorkerConfig, "baseUrl" | "apiKey">,
    fetchImpl?: typeof fetch,
  ) => Promise<RouterModelsResult>;
  runTask?: (
    task: string,
    deps?: WorkerDependencies,
  ) => Promise<DeepSeekTaskResult>;
  runRole?: (
    role: NklRole,
    prompt: string,
    deps?: RouterRunnerDependencies,
  ) => Promise<NklRoleResult>;
  runOrchestrator?: (
    task: string,
    deps: OrchestratorDependencies,
  ) => Promise<NklOrchestrationResult>;
}

export function createDeepSeekToolHandler(
  options: DeepSeekToolHandlerOptions,
): (input: {
  task: string;
  mode?: "single" | "orchestrated";
  role?: NklRole;
  model?: string;
}) => Promise<CallToolResult> {
  const runTask = options.runTask ?? runDeepSeekTask;
  const runRole = options.runRole ?? runNklRoleTask;
  let queue = Promise.resolve();

  return async (input) => {
    const parsed = delegateToDeepSeekInputSchema.parse(input);
    const previous = queue;
    let release!: () => void;
    queue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      if (options.nklConfig) {
        const secrets = [
          options.nklConfig.router.apiKey,
          ...(options.config?.apiKey ? [options.config.apiKey] : []),
        ];
        if (parsed.mode === "single" || parsed.model) {
          const result = await runRole(parsed.role ?? "worker", parsed.task, {
            config: options.nklConfig,
            ...(parsed.model ? { modelOverride: parsed.model } : {}),
            deadlineMs: options.deadlineMs,
            fetchImpl: options.fetchImpl,
            runDirectTask: options.runDirectTask,
          });
          return roleResultToCallToolResult(redactRoleResult(result, secrets));
        }
        const runOrchestrator =
          options.runOrchestrator ?? orchestrateNklTask;
        const result = await runOrchestrator(parsed.task, {
          config: options.nklConfig,
          deadlineMs: options.deadlineMs,
          fetchImpl: options.fetchImpl,
          runDirectTask: options.runDirectTask,
        });
        return orchestrationToCallToolResult(
          redactOrchestration(result, secrets),
        );
      }
      if (options.config) {
        const result = await runTask(parsed.task, {
          config: options.config,
          deadlineMs: options.deadlineMs,
          createSession: options.createSession,
        });
        return resultToCallToolResult(
          redactResult(result, options.config.apiKey),
        );
      }
      throw new Error("Missing MCP worker configuration");
    } finally {
      release();
    }
  };
}

export function roleResultToCallToolResult(
  result: NklRoleResult,
): CallToolResult {
  return {
    content: [{ type: "text", text: result.text }],
    structuredContent: { ...result },
    ...(result.status === "completed" ? {} : { isError: true }),
  };
}

export function orchestrationToCallToolResult(
  result: NklOrchestrationResult,
): CallToolResult {
  return {
    content: [{ type: "text", text: result.text }],
    structuredContent: { ...result },
    ...(result.status === "completed" ? {} : { isError: true }),
  };
}

export function resultToCallToolResult(
  result: DeepSeekTaskResult,
): CallToolResult {
  return {
    content: [{ type: "text", text: result.text }],
    structuredContent: { ...result },
    ...(result.status === "completed" ? {} : { isError: true }),
  };
}

export function formatStartupError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message === "Missing required CLINE_API_KEY") {
    return "DeepSeek MCP configuration error: set CLINE_API_KEY in .env.local\n";
  }
  if (message === "Missing required CLINE_MODEL_ID") {
    return "DeepSeek MCP configuration error: set CLINE_MODEL_ID in .env.local\n";
  }
  if (message === "Missing required CLINE_BASE_URL for openai-compatible provider") {
    return "DeepSeek MCP configuration error: set CLINE_BASE_URL in .env.local\n";
  }
  if (
    message === "Workspace root is not readable" ||
    message === "NKL router configuration error: workspace root is not readable"
  ) {
    return "DeepSeek MCP configuration error: the fixed workspace is not readable\n";
  }
  if (message.startsWith("NKL router configuration error:")) {
    const variable = message.match(
      /\b(?:CLINE_API_KEY|CLINE_MODEL_ID|CLINE_BASE_URL|NINE_ROUTER_[A-Z_]+)\b/,
    )?.[0];
    return `DeepSeek MCP configuration error: set ${variable ?? "the required local variables"} in .env.local\n`;
  }
  return "DeepSeek MCP startup error: local runtime initialization failed\n";
}

export function hasNklRouterConfiguration(
  env: NodeJS.ProcessEnv,
): boolean {
  return [
    "NINE_ROUTER_PROVIDER_ID",
    "NINE_ROUTER_BASE_URL",
    "NINE_ROUTER_API_KEY",
    "NINE_ROUTER_ORCHESTRATOR_MODEL",
    "NINE_ROUTER_ORQUESTRADOR_MODEL",
    "NINE_ROUTER_WORKER_MODEL",
    "NINE_ROUTER_REVIEWER_MODEL",
    "NINE_ROUTER_ALL_ALIAS",
    "NINE_ROUTER_MAX_WORKERS",
    "NINE_ROUTER_RETRY_LIMIT",
  ].some((name) => Boolean(env[name]?.trim()));
}

export function createDeepSeekMcpServer(
  options: DeepSeekToolHandlerOptions,
): McpServer {
  const server = new McpServer({
    name: "portal-nkl-deepseek",
    version: "0.1.0",
  });
  const handler = createDeepSeekToolHandler(options);

  server.registerTool(
    "ask_nkl_worker",
    {
      title: "Ask NKL Worker",
      description:
        "Run ONE lightweight read-only repository analysis call directly against 9router (defaults to NKL-OPERARIOS, or pass any NKL* combo via model) to save tokens.",
      inputSchema: {
        task: z.string().trim().min(1, "task must not be empty"),
        role: nklRoleSchema.optional(),
        model: optionalModelSchema,
      },
    },
    async (input) =>
      handler({
        task: input.task,
        mode: "single",
        role: input.role ?? "worker",
        ...(input.model ? { model: input.model } : {}),
      }),
  );

  server.registerTool(
    "list_nkl_models",
    {
      title: "List NKL Models",
      description:
        "List available models and NKL* combos configured in the local 9router server.",
      inputSchema: {},
    },
    async () => {
      if (!options.nklConfig) {
        return {
          content: [{ type: "text", text: "9router is not configured" }],
          structuredContent: {
            status: "failed",
            models: [],
            error: "9router is not configured",
          },
          isError: true,
        };
      }
      const listModels = options.listModels ?? listRouterModels;
      const result = await listModels(
        {
          baseUrl: options.nklConfig.router.baseUrl,
          apiKey: options.nklConfig.router.apiKey,
        },
        options.fetchImpl,
      );
      const safeError = result.error
        ? redactSecrets(result.error, [
            options.nklConfig.router.apiKey,
            ...(options.config?.apiKey ? [options.config.apiKey] : []),
          ])
        : undefined;
      const safeResult: RouterModelsResult = {
        status: result.status,
        models: result.models,
        ...(safeError ? { error: safeError } : {}),
      };
      const text =
        safeResult.status === "completed"
          ? safeResult.models.length > 0
            ? safeResult.models.join("\n")
            : "No models returned by 9router"
          : safeResult.error ?? "Failed to list 9router models";
      return {
        content: [{ type: "text", text }],
        structuredContent: { ...safeResult },
        ...(safeResult.status === "completed" ? {} : { isError: true }),
      };
    },
  );

  server.registerTool(
    "delegate_to_deepseek",
    {
      title: "Delegate to DeepSeek",
      description:
        "Run read-only repository analysis in the fixed local workspace (orchestrated when 9router is configured, or single-call when mode is 'single' or model is set).",
      inputSchema: {
        task: z.string().trim().min(1, "task must not be empty"),
        mode: deepSeekModeSchema.optional(),
        role: nklRoleSchema.optional(),
        model: optionalModelSchema,
      },
    },
    handler,
  );
  return server;
}

export async function main(): Promise<void> {
  const workspaceRoot = resolveDefaultWorkspaceRoot();
  dotenv.config({
    path: path.join(workspaceRoot, ".env.local"),
    quiet: true,
  });
  const serverOptions: DeepSeekToolHandlerOptions = hasNklRouterConfiguration(
    process.env,
  )
    ? { nklConfig: loadNklRouterConfig(process.env, workspaceRoot) }
    : { config: loadDeepSeekMcpConfig(process.env, workspaceRoot) };
  const server = createDeepSeekMcpServer(serverOptions);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function redactSecrets(value: string, secrets: string[]): string {
  let result = value;
  for (const secret of secrets) {
    if (secret) {
      result = result.replaceAll(secret, "[redacted]");
    }
  }
  return result;
}

function redactRoleResult(
  result: NklRoleResult,
  secrets: string[],
): NklRoleResult {
  const redact = (value: string) => redactSecrets(value, secrets);
  return {
    ...result,
    text: redact(result.text),
    ...(result.uncertainty ? { uncertainty: redact(result.uncertainty) } : {}),
    evidence: result.evidence.map((item) => ({
      ...item,
      note: redact(item.note),
    })),
  };
}

function redactOrchestration(
  result: NklOrchestrationResult,
  secrets: string[],
): NklOrchestrationResult {
  const redact = (value: string) => redactSecrets(value, secrets);
  return {
    ...result,
    text: redact(result.text),
    plan: redact(result.plan),
    workers: result.workers.map((worker) => redactRoleResult(worker, secrets)),
    review: redactRoleResult(result.review, secrets),
  };
}

function isEntrypoint(): boolean {
  const entrypoint = process.argv[1];
  if (!entrypoint) {
    return false;
  }
  const selfPath = path.resolve(fileURLToPath(import.meta.url));
  const entryPath = path.resolve(entrypoint);
  return process.platform === "win32"
    ? selfPath.toLowerCase() === entryPath.toLowerCase()
    : selfPath === entryPath;
}

if (isEntrypoint()) {
  main().catch((error: unknown) => {
    process.stderr.write(formatStartupError(error));
    process.exitCode = 1;
  });
}
