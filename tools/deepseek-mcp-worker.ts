import type { AgentTool, AgentResult } from "@cline/sdk";
import type { DeepSeekMcpConfig } from "./deepseek-mcp-config.js";
import { loadDeepSeekMcpConfig } from "./deepseek-mcp-config.js";
import {
  listWorkspaceFiles,
  readWorkspaceFile,
  searchWorkspaceFiles,
} from "./deepseek-mcp-files.js";

export interface DeepSeekTaskResult {
  status: "completed" | "failed" | "aborted";
  text: string;
  finishReason?: string;
  usage?: Record<string, unknown>;
}

export interface WorkerSessionOptions {
  backendMode: "local";
  cwd: string;
  workspaceRoot: string;
  providerId: string;
  modelId: string;
  apiKey: string;
  baseUrl?: string;
  systemPrompt: string;
  mode: "plan";
  maxIterations: number;
  enableTools: true;
  enableSpawnAgent: false;
  enableAgentTeams: false;
  disableMcpSettingsTools: true;
  plugins: { "*": { enabled: false } };
  configExtensions: [];
  extraTools: AgentTool[];
  toolPolicies: Record<string, { enabled: false }>;
}

export interface WorkerSession {
  run(): Promise<DeepSeekTaskResult | AgentResult>;
  abort?(): Promise<void> | void;
  dispose(): Promise<void> | void;
}

interface WorkerCore {
  start(input: unknown): Promise<{
    sessionId: string;
    result?: AgentResult;
  }>;
  subscribe(
    listener: (event: WorkerCoreEvent) => void,
  ): () => void;
  abort(sessionId: string): Promise<void>;
  dispose(): Promise<void>;
}

interface WorkerCoreEvent {
  type: "agent_event" | "ended";
  payload: {
    sessionId: string;
    event?: {
      type: "done" | "error";
      reason?: string;
      text?: string;
      usage?: Record<string, unknown>;
      error?: unknown;
      recoverable?: boolean;
    };
    reason?: string;
  };
}

export interface WorkerDependencies {
  config?: DeepSeekMcpConfig;
  deadlineMs?: number;
  createSession?: (
    options: WorkerSessionOptions,
    task: string,
  ) => Promise<WorkerSession> | WorkerSession;
  createCore?: (options: {
    backendMode: "local";
    clientName: string;
  }) => Promise<WorkerCore>;
}

const DEFAULT_DEADLINE_MS = 120_000;
export const CURRENT_CLINE_TOOL_IDS = [
  "read_files",
  "search_codebase",
  "run_commands",
  "fetch_web_content",
  "apply_patch",
  "editor",
  "skills",
  "ask_question",
  "submit_and_exit",
  "tasks",
  "spawn_agent",
  "team_spawn_teammate",
  "team_shutdown_teammate",
  "team_status",
  "team_task",
  "team_run_task",
  "team_cancel_run",
  "team_list_runs",
  "team_await_runs",
  "team_send_message",
  "team_broadcast",
  "team_read_mailbox",
  "team_mission_log",
  "team_cleanup",
  "team_create_outcome",
  "team_attach_outcome_fragment",
  "team_review_outcome_fragment",
  "team_finalize_outcome",
  "team_list_outcomes",
] as const;

const SAFE_SYSTEM_PROMPT =
  "You are a read-only repository analysis worker. Use only search_workspace, list_workspace_files, " +
  "and line-bounded read_workspace_file (with startLine/endLine) to inspect relevant files efficiently. " +
  "Stay concise and cite findings as: EVIDENCE: path:start-end | brief note. " +
  "Never request secrets, edit files, run commands, access the network, or delegate to another agent.";

export async function runDeepSeekTask(
  task: string,
  deps: WorkerDependencies = {},
): Promise<DeepSeekTaskResult> {
  const config =
    deps.config ??
    loadDeepSeekMcpConfig(process.env, process.cwd());
  const createSession =
    deps.createSession ??
    ((options: WorkerSessionOptions, prompt: string) =>
      createClineSession(options, prompt, deps.createCore));
  const options = createWorkerOptions(config);
  let session: WorkerSession;
  try {
    session = await createSession(options, task);
  } catch (error) {
    reportWorkerDiagnostic(error, config.apiKey);
    return {
      status: "failed",
      text: "DeepSeek task failed",
      finishReason: "error",
    };
  }
  const deadlineMs = deps.deadlineMs ?? DEFAULT_DEADLINE_MS;
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const runOutcome = Promise.resolve()
      .then(() => session.run())
      .then(
        (result) => ({ kind: "run" as const, result }),
        (error) => ({ kind: "error" as const, error }),
      );
    const timeoutOutcome = new Promise<{ kind: "timeout" }>((resolve) => {
      timer = setTimeout(() => resolve({ kind: "timeout" }), deadlineMs);
    });
    const outcome = await Promise.race([runOutcome, timeoutOutcome]);

    if (outcome.kind === "timeout") {
      try {
        await session.abort?.();
      } catch {
        // The timeout result remains safe even when the SDK abort reports an error.
      }
      return {
        status: "aborted",
        text: "DeepSeek task timed out",
        finishReason: "aborted",
      };
    }

    if (outcome.kind === "error") {
      throw outcome.error;
    }

    return redactResult(normalizeResult(outcome.result), config.apiKey);
  } catch (error) {
    reportWorkerDiagnostic(error, config.apiKey);
    return {
      status: "failed",
      text: "DeepSeek task failed",
      finishReason: "error",
    };
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
    try {
      await session.dispose();
    } catch {
      // Disposal failures must not replace the task result or expose provider details.
    }
  }
}

export function createWorkerOptions(
  config: DeepSeekMcpConfig,
): WorkerSessionOptions {
  const extraTools = createSafeTools(config.workspaceRoot);
  const toolPolicies = Object.fromEntries(
    CURRENT_CLINE_TOOL_IDS.map((name) => [name, { enabled: false as const }]),
  );

  return {
    backendMode: "local",
    cwd: config.workspaceRoot,
    workspaceRoot: config.workspaceRoot,
    providerId: config.providerId,
    modelId: config.modelId,
    apiKey: config.apiKey,
    ...(config.baseUrl ? { baseUrl: config.baseUrl } : {}),
    systemPrompt: SAFE_SYSTEM_PROMPT,
    mode: "plan",
    maxIterations: 12,
    enableTools: true,
    enableSpawnAgent: false,
    enableAgentTeams: false,
    disableMcpSettingsTools: true,
    plugins: { "*": { enabled: false } },
    configExtensions: [],
    extraTools,
    toolPolicies,
  };
}

async function createClineSession(
  options: WorkerSessionOptions,
  task: string,
  createCore: WorkerDependencies["createCore"] = createRealCore,
): Promise<WorkerSession> {
  const core = await createCore({
    clientName: "portal-nkl-deepseek-mcp",
    backendMode: options.backendMode,
  });
  let startedSessionId: string | undefined;
  const pendingEvents = new Map<string, DeepSeekTaskResult>();
  let resolveCompletion!: (result: DeepSeekTaskResult) => void;
  const completion = new Promise<DeepSeekTaskResult>((resolve) => {
    resolveCompletion = resolve;
  });
  const unsubscribe = core.subscribe((event) => {
    if (event.type === "agent_event" && event.payload.event) {
      const { sessionId, event: agentEvent } = event.payload;
      const result = agentEventToResult(agentEvent);
      if (result) {
        if (sessionId === startedSessionId) {
          resolveCompletion(result);
        } else {
          pendingEvents.set(sessionId, result);
        }
      }
    } else if (event.type === "ended" && event.payload.sessionId === startedSessionId) {
      resolveCompletion({
        status: event.payload.reason === "aborted" ? "aborted" : "failed",
        text:
          event.payload.reason === "aborted"
            ? "DeepSeek task aborted"
            : "DeepSeek task failed",
        finishReason: event.payload.reason,
      });
    }
  });

  try {
    const started = await core.start({
      config: {
        providerId: options.providerId,
        modelId: options.modelId,
        apiKey: options.apiKey,
        ...(options.baseUrl ? { baseUrl: options.baseUrl } : {}),
        cwd: options.cwd,
        workspaceRoot: options.workspaceRoot,
        systemPrompt: options.systemPrompt,
        mode: options.mode,
        maxIterations: options.maxIterations,
        enableTools: options.enableTools,
        enableSpawnAgent: options.enableSpawnAgent,
        enableAgentTeams: options.enableAgentTeams,
        disableMcpSettingsTools: options.disableMcpSettingsTools,
        toolPolicies: options.toolPolicies,
        checkpoint: { enabled: false },
      },
      localRuntime: {
        extraTools: options.extraTools,
        configExtensions: options.configExtensions,
      },
      plugins: options.plugins,
      toolPolicies: options.toolPolicies,
      prompt: task,
      interactive: false,
      source: "app",
      mode: "subagent",
    });
    startedSessionId = started.sessionId;
    const pending = pendingEvents.get(startedSessionId);
    if (pending) {
      pendingEvents.delete(startedSessionId);
      resolveCompletion(pending);
    }

    return {
      async run() {
        return started.result
          ? normalizeResult(started.result)
          : completion;
      },
      async abort() {
        await core.abort(started.sessionId);
      },
      async dispose() {
        unsubscribe();
        await core.dispose();
      },
    };
  } catch (error) {
    unsubscribe();
    await core.dispose().catch(() => undefined);
    throw error;
  }
}

async function createRealCore(options: {
  backendMode: "local";
  clientName: string;
}): Promise<WorkerCore> {
  const { ClineCore } = await import("@cline/sdk");
  return (await ClineCore.create(options)) as unknown as WorkerCore;
}

function agentEventToResult(
  event: NonNullable<WorkerCoreEvent["payload"]["event"]>,
): DeepSeekTaskResult | undefined {
  if (event.type === "done") {
    const finishReason = event.reason ?? "completed";
    return {
      status:
        finishReason === "aborted"
          ? "aborted"
          : finishReason === "error" || finishReason === "mistake_limit"
            ? "failed"
            : "completed",
      text: event.text ?? "",
      finishReason,
      ...(event.usage ? { usage: event.usage } : {}),
    };
  }
  if (event.type === "error") {
    if (event.recoverable === true) {
      return undefined;
    }
    return {
      status: "failed",
      text: "DeepSeek task failed",
      finishReason: "error",
    };
  }
  return undefined;
}

function createSafeTools(workspaceRoot: string): AgentTool[] {
  return [
    {
      name: "list_workspace_files",
      description: "List allowed files in the fixed workspace.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string" },
          maxEntries: { type: "integer", minimum: 0 },
        },
        additionalProperties: false,
      },
      async execute(input) {
        return listWorkspaceFiles(
          input as { path?: string; maxEntries?: number },
          workspaceRoot,
        );
      },
    },
    {
      name: "read_workspace_file",
      description:
        "Read an allowed UTF-8 file (optionally bounded by startLine and endLine) from the fixed workspace.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string" },
          maxBytes: { type: "integer", minimum: 0 },
          startLine: { type: "integer", minimum: 1 },
          endLine: { type: "integer", minimum: 1 },
        },
        required: ["path"],
        additionalProperties: false,
      },
      async execute(input) {
        return readWorkspaceFile(
          input as {
            path: string;
            maxBytes?: number;
            startLine?: number;
            endLine?: number;
          },
          workspaceRoot,
        );
      },
    },
    {
      name: "search_workspace",
      description:
        "Search allowed UTF-8 text files in the fixed workspace for a literal query string.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", minLength: 1 },
          path: { type: "string" },
          maxMatches: { type: "integer", minimum: 0 },
          caseSensitive: { type: "boolean" },
        },
        required: ["query"],
        additionalProperties: false,
      },
      async execute(input) {
        return searchWorkspaceFiles(
          input as {
            query: string;
            path?: string;
            maxMatches?: number;
            caseSensitive?: boolean;
          },
          workspaceRoot,
        );
      },
    },
  ];
}

function reportWorkerDiagnostic(error: unknown, apiKey: string): void {
  const errName = error instanceof Error ? error.name : "Error";
  const errCode =
    error instanceof Error &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
      ? (error as { code: string }).code
      : undefined;
  const rawLabel = errCode ? `${errName} (${errCode})` : errName;
  const safeLabel = redactDiagnosticValue(rawLabel, apiKey);
  process.stderr.write(`[portal-nkl-deepseek] worker error: ${safeLabel}\n`);
}

function redactDiagnosticValue(value: string, apiKey: string): string {
  let redacted = apiKey ? value.replaceAll(apiKey, "[redacted]") : value;
  redacted = redacted.replace(
    /\b(?:sk|rk|key|token|secret)[-_][A-Za-z0-9._-]{8,}\b/gi,
    "[redacted]",
  );
  return redacted.replace(/\bBearer\s+[A-Za-z0-9._~-]+\b/gi, "Bearer [redacted]");
}

function normalizeResult(result: DeepSeekTaskResult | AgentResult): DeepSeekTaskResult {
  if ("status" in result && "text" in result) {
    return {
      status: result.status,
      text: result.text,
      ...(result.finishReason ? { finishReason: result.finishReason } : {}),
      ...(result.usage ? { usage: result.usage } : {}),
    };
  }

  const finishReason = String(result.finishReason);
  const status =
    finishReason === "aborted"
      ? "aborted"
      : finishReason === "error" || finishReason === "mistake_limit"
        ? "failed"
        : "completed";
  return {
    status,
    text: result.text,
    finishReason,
    usage: result.usage as unknown as Record<string, unknown>,
  };
}

export function redactResult(
  result: DeepSeekTaskResult,
  apiKey: string,
): DeepSeekTaskResult {
  const text = result.text.replaceAll(apiKey, "[redacted]");
  return text === result.text ? result : { ...result, text };
}
