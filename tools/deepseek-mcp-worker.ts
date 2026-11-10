import type { AgentTool, AgentResult } from "@cline/sdk";
import type { DeepSeekMcpConfig } from "./deepseek-mcp-config.js";
import { loadDeepSeekMcpConfig } from "./deepseek-mcp-config.js";
import { listWorkspaceFiles, readWorkspaceFile } from "./deepseek-mcp-files.js";

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
  enableTools: true;
  enableSpawnAgent: false;
  enableAgentTeams: false;
  disableMcpSettingsTools: true;
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
  "You are a read-only repository analysis worker. Use only the supplied workspace readers. " +
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
  } catch {
    return {
      status: "failed",
      text: "DeepSeek task failed",
      finishReason: "error",
    };
  }
  const deadlineMs = deps.deadlineMs ?? DEFAULT_DEADLINE_MS;
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const result = await Promise.race([
      session.run(),
      new Promise<DeepSeekTaskResult>((resolve) => {
        timer = setTimeout(() => {
          void (async () => {
            try {
              await session.abort?.();
            } catch {
              // The timeout result remains safe even when the SDK abort reports an error.
            }
            resolve({
              status: "aborted",
              text: "DeepSeek task timed out",
              finishReason: "aborted",
            });
          })();
        }, deadlineMs);
      }),
    ]);

    return redactResult(normalizeResult(result), config.apiKey);
  } catch {
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
  const extraTools = createSafeTools();
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
    enableTools: true,
    enableSpawnAgent: false,
    enableAgentTeams: false,
    disableMcpSettingsTools: true,
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
        enableTools: options.enableTools,
        enableSpawnAgent: options.enableSpawnAgent,
        enableAgentTeams: options.enableAgentTeams,
        disableMcpSettingsTools: options.disableMcpSettingsTools,
        toolPolicies: options.toolPolicies,
        checkpoint: { enabled: false },
      },
      localRuntime: {
        extraTools: options.extraTools,
      },
      toolPolicies: options.toolPolicies,
      prompt: task,
      interactive: false,
      source: "app",
      mode: "plan",
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
    return {
      status: "failed",
      text: "DeepSeek task failed",
      finishReason: "error",
    };
  }
  return undefined;
}

function createSafeTools(): AgentTool[] {
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
        return listWorkspaceFiles(input as { path?: string; maxEntries?: number });
      },
    },
    {
      name: "read_workspace_file",
      description: "Read an allowed UTF-8 file from the fixed workspace.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string" },
          maxBytes: { type: "integer", minimum: 0 },
        },
        required: ["path"],
        additionalProperties: false,
      },
      async execute(input) {
        return readWorkspaceFile(input as { path: string; maxBytes?: number });
      },
    },
  ];
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
