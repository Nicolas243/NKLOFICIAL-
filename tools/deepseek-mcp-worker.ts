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
  enableEditing: false;
  enableCommands: false;
  enableWeb: false;
  enableSkills: false;
  enableMcp: false;
  disableMcpSettingsTools: true;
  extraTools: AgentTool[];
  toolPolicies: Record<string, { enabled: false }>;
}

export interface WorkerSession {
  run(): Promise<DeepSeekTaskResult | AgentResult>;
  abort?(): Promise<void> | void;
  dispose(): Promise<void> | void;
}

export interface WorkerDependencies {
  config?: DeepSeekMcpConfig;
  deadlineMs?: number;
  createSession?: (
    options: WorkerSessionOptions,
    task: string,
  ) => Promise<WorkerSession> | WorkerSession;
}

const DEFAULT_DEADLINE_MS = 120_000;
const DISABLED_BUILTIN_TOOLS = [
  "ask_followup_question",
  "read_file",
  "write_to_file",
  "apply_diff",
  "replace_in_file",
  "search_files",
  "list_files",
  "list_code_definition_names",
  "execute_command",
  "bash",
  "browser_action",
  "use_mcp",
  "access_mcp_resource",
  "use_mcp_tool",
  "use_skill",
  "new_task",
  "spawn_agent",
  "spawn_team",
  "manage_task",
  "editor",
  "run_commands",
  "search_codebase",
  "read_files",
  "web",
  "skills",
  "mcp",
  "spawn",
  "team",
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
  const createSession = deps.createSession ?? createClineSession;
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
          void Promise.resolve(session.abort?.()).catch(() => undefined);
          resolve({
            status: "aborted",
            text: "DeepSeek task timed out",
            finishReason: "aborted",
          });
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
    DISABLED_BUILTIN_TOOLS.map((name) => [name, { enabled: false as const }]),
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
    enableEditing: false,
    enableCommands: false,
    enableWeb: false,
    enableSkills: false,
    enableMcp: false,
    disableMcpSettingsTools: true,
    extraTools,
    toolPolicies,
  };
}

async function createClineSession(
  options: WorkerSessionOptions,
  task: string,
): Promise<WorkerSession> {
  const { ClineCore } = await import("@cline/sdk");
  const core = await ClineCore.create({
    clientName: "portal-nkl-deepseek-mcp",
    backendMode: options.backendMode,
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

    return {
      async run() {
        return started.result
          ? normalizeResult(started.result)
          : {
              status: "failed",
              text: "DeepSeek task failed",
              finishReason: "missing_result",
            };
      },
      async abort() {
        await core.abort(started.sessionId);
      },
      async dispose() {
        await core.dispose();
      },
    };
  } catch (error) {
    await core.dispose().catch(() => undefined);
    throw error;
  }
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
