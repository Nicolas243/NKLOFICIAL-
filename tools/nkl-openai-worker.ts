import {
  listWorkspaceFiles,
  readWorkspaceFile,
  searchWorkspaceFiles,
} from "./deepseek-mcp-files.js";
import { redactResult, type DeepSeekTaskResult } from "./deepseek-mcp-worker.js";

const DEFAULT_DEADLINE_MS = 120_000;
const DEFAULT_MAX_ITERATIONS = 12;
const MODELS_TIMEOUT_MS = 10_000;
const MAX_TOOL_OUTPUT_CHARS = 24_000;

const READ_ONLY_SYSTEM_PROMPT =
  "Read-only repository worker. Use search_workspace, list_workspace_files, and line-bounded " +
  "read_workspace_file (startLine/endLine). Be concise. Cite findings as: " +
  "EVIDENCE: path:start-end | note. Never ask for secrets, edits, commands, or web access.";

export interface DirectWorkerConfig {
  workspaceRoot: string;
  baseUrl: string;
  apiKey: string;
  modelId: string;
}

export interface DirectWorkerDependencies {
  deadlineMs?: number;
  maxIterations?: number;
  fetchImpl?: typeof fetch;
}

export interface RouterModelsResult {
  status: "completed" | "failed";
  models: string[];
  error?: string;
}

interface OpenAiToolCall {
  id: string;
  type?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
}

type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: OpenAiToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

interface OpenAiChatResponse {
  choices?: Array<{
    finish_reason?: string | null;
    message?: {
      content?: unknown;
      reasoning_content?: unknown;
      tool_calls?: OpenAiToolCall[];
    };
  }>;
  usage?: {
    prompt_tokens?: unknown;
    completion_tokens?: unknown;
    total_tokens?: unknown;
    input_tokens?: unknown;
    output_tokens?: unknown;
  };
}

const OPENAI_TOOLS = [
  {
    type: "function",
    function: {
      name: "search_workspace",
      description:
        "Search allowed UTF-8 text files in the fixed workspace for a literal query string.",
      parameters: {
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
    },
  },
  {
    type: "function",
    function: {
      name: "list_workspace_files",
      description: "List allowed files in the fixed workspace.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          maxEntries: { type: "integer", minimum: 0 },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_workspace_file",
      description:
        "Read an allowed UTF-8 file (optionally bounded by startLine and endLine) from the fixed workspace.",
      parameters: {
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
    },
  },
] as const;

export function normalizeChatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions")
    ? trimmed
    : `${trimmed}/chat/completions`;
}

export function normalizeModelsUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  if (trimmed.endsWith("/models")) {
    return trimmed;
  }
  if (trimmed.endsWith("/chat/completions")) {
    return `${trimmed.slice(0, -"/chat/completions".length)}/models`;
  }
  return `${trimmed}/models`;
}

export async function runDirectOpenAiTask(
  task: string,
  config: DirectWorkerConfig,
  deps: DirectWorkerDependencies = {},
): Promise<DeepSeekTaskResult> {
  const deadlineMs = deps.deadlineMs ?? DEFAULT_DEADLINE_MS;
  const maxIterations = Math.max(1, deps.maxIterations ?? DEFAULT_MAX_ITERATIONS);
  const fetchImpl = deps.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), deadlineMs);

  const messages: ChatMessage[] = [
    { role: "system", content: READ_ONLY_SYSTEM_PROMPT },
    { role: "user", content: task },
  ];
  const usageTotals = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };
  let hasUsage = false;
  let madeToolCalls = false;

  try {
    const endpoint = normalizeChatCompletionsUrl(config.baseUrl);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (config.apiKey.trim()) {
      headers.Authorization = `Bearer ${config.apiKey.trim()}`;
    }

    for (let iteration = 0; iteration < maxIterations; iteration += 1) {
      const includeTools = iteration < maxIterations - 1;
      if (!includeTools && madeToolCalls) {
        messages.push({
          role: "user",
          content: "Summarize your findings now without further tool calls.",
        });
      }

      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: config.modelId,
          messages,
          temperature: 0.1,
          ...(includeTools
            ? { tools: OPENAI_TOOLS, tool_choice: "auto" }
            : {}),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        process.stderr.write(`[portal-nkl-9router] HTTP ${response.status}\n`);
        return {
          status: "failed",
          text: `9router task failed (HTTP ${response.status})`,
          finishReason: "error",
        };
      }

      const payload = (await response.json()) as OpenAiChatResponse;
      if (payload.usage && typeof payload.usage === "object") {
        const prompt = numericToken(
          payload.usage.prompt_tokens ?? payload.usage.input_tokens,
        );
        const completion = numericToken(
          payload.usage.completion_tokens ?? payload.usage.output_tokens,
        );
        const total = numericToken(payload.usage.total_tokens);
        if (prompt !== undefined || completion !== undefined || total !== undefined) {
          hasUsage = true;
          usageTotals.promptTokens += prompt ?? 0;
          usageTotals.completionTokens += completion ?? 0;
          usageTotals.totalTokens +=
            total ?? (prompt ?? 0) + (completion ?? 0);
        }
      }

      const choice = payload.choices?.[0];
      const message = choice?.message;
      const toolCalls = Array.isArray(message?.tool_calls)
        ? message.tool_calls
        : [];

      if (toolCalls.length > 0 && includeTools) {
        madeToolCalls = true;
        messages.push({
          role: "assistant",
          content:
            typeof message?.content === "string" ? message.content : null,
          tool_calls: toolCalls,
        });

        for (const toolCall of toolCalls) {
          const toolResult = await executeSafeToolCall(
            toolCall,
            config.workspaceRoot,
            config.apiKey,
          );
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id || "tool_call",
            content: serializeToolResult(toolResult),
          });
        }
        continue;
      }

      const rawText = extractAssistantText(message);
      const safeText = redactTextSecrets(rawText, config.apiKey);
      const result: DeepSeekTaskResult = {
        status: "completed",
        text: safeText,
        finishReason: choice?.finish_reason ?? "stop",
        ...(hasUsage ? { usage: usageTotals } : {}),
      };
      return redactResult(result, config.apiKey);
    }

    return {
      status: "failed",
      text: "9router task failed",
      finishReason: "error",
      ...(hasUsage ? { usage: usageTotals } : {}),
    };
  } catch (error) {
    if (
      controller.signal.aborted ||
      (error instanceof Error && error.name === "AbortError")
    ) {
      return {
        status: "aborted",
        text: "9router task timed out",
        finishReason: "aborted",
      };
    }
    reportDirectWorkerError(error, config.apiKey);
    return {
      status: "failed",
      text: "9router task failed",
      finishReason: "error",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function listRouterModels(
  config: Pick<DirectWorkerConfig, "baseUrl" | "apiKey">,
  fetchImpl: typeof fetch = fetch,
): Promise<RouterModelsResult> {
  try {
    const headers: Record<string, string> = {};
    if (config.apiKey.trim()) {
      headers.Authorization = `Bearer ${config.apiKey.trim()}`;
    }

    const response = await fetchImpl(normalizeModelsUrl(config.baseUrl), {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(MODELS_TIMEOUT_MS),
    });
    if (!response.ok) {
      return {
        status: "failed",
        models: [],
        error: `9router /models failed (HTTP ${response.status})`,
      };
    }

    const payload = (await response.json()) as {
      data?: Array<{ id?: unknown }>;
      models?: Array<{ id?: unknown; name?: unknown }>;
    };
    const rawIds: string[] = [];
    if (Array.isArray(payload.data)) {
      for (const item of payload.data) {
        if (typeof item?.id === "string" && item.id.trim()) {
          rawIds.push(item.id.trim());
        }
      }
    }
    if (Array.isArray(payload.models)) {
      for (const item of payload.models) {
        const candidate =
          typeof item?.id === "string"
            ? item.id.trim()
            : typeof item?.name === "string"
              ? item.name.trim()
              : "";
        if (candidate) {
          rawIds.push(candidate);
        }
      }
    }

    const unique = [...new Set(rawIds)];
    unique.sort((left, right) => {
      const leftNkl = /^nkl/i.test(left);
      const rightNkl = /^nkl/i.test(right);
      if (leftNkl !== rightNkl) {
        return leftNkl ? -1 : 1;
      }
      return left.localeCompare(right);
    });

    return { status: "completed", models: unique };
  } catch (error) {
    const label = safeErrorLabel(error, config.apiKey);
    return {
      status: "failed",
      models: [],
      error: `Failed to query 9router /models (${label})`,
    };
  }
}

async function executeSafeToolCall(
  toolCall: OpenAiToolCall,
  workspaceRoot: string,
  apiKey: string,
): Promise<unknown> {
  const toolName = toolCall.function?.name?.trim() ?? "";
  let args: Record<string, unknown>;
  try {
    args = parseToolArguments(toolCall.function?.arguments);
  } catch {
    return { error: "Invalid tool arguments" };
  }

  try {
    switch (toolName) {
      case "search_workspace":
        return await searchWorkspaceFiles(
          args as {
            query: string;
            path?: string;
            maxMatches?: number;
            caseSensitive?: boolean;
          },
          workspaceRoot,
        );
      case "list_workspace_files":
        return await listWorkspaceFiles(
          args as { path?: string; maxEntries?: number },
          workspaceRoot,
        );
      case "read_workspace_file":
        return await readWorkspaceFile(
          args as {
            path: string;
            maxBytes?: number;
            startLine?: number;
            endLine?: number;
          },
          workspaceRoot,
        );
      default:
        return { error: "Tool not allowed" };
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Tool execution failed";
    return { error: redactTextSecrets(message, apiKey) };
  }
}

function parseToolArguments(raw: string | undefined): Record<string, unknown> {
  if (!raw || !raw.trim()) {
    return {};
  }
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Arguments must be a JSON object");
  }
  return parsed as Record<string, unknown>;
}

function serializeToolResult(result: unknown): string {
  const json = JSON.stringify(result);
  if (json.length <= MAX_TOOL_OUTPUT_CHARS) {
    return json;
  }
  const suffix = "…";
  return `${json.slice(0, MAX_TOOL_OUTPUT_CHARS - suffix.length)}${suffix}`;
}

function extractAssistantText(
  message:
    | {
        content?: unknown;
        reasoning_content?: unknown;
      }
    | undefined,
): string {
  if (!message) {
    return "";
  }
  if (typeof message.content === "string") {
    return message.content;
  }
  if (Array.isArray(message.content)) {
    const parts: string[] = [];
    for (const item of message.content) {
      if (
        item &&
        typeof item === "object" &&
        "type" in item &&
        (item as { type?: unknown }).type === "text" &&
        "text" in item &&
        typeof (item as { text?: unknown }).text === "string"
      ) {
        parts.push((item as { text: string }).text);
      }
    }
    return parts.join("");
  }
  if (typeof message.reasoning_content === "string") {
    return message.reasoning_content;
  }
  return "";
}

function numericToken(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function reportDirectWorkerError(error: unknown, apiKey: string): void {
  const label = safeErrorLabel(error, apiKey);
  process.stderr.write(`[portal-nkl-9router] worker error: ${label}\n`);
}

function safeErrorLabel(error: unknown, apiKey: string): string {
  const errName = error instanceof Error ? error.name : "Error";
  const errCode =
    error instanceof Error &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
      ? (error as { code: string }).code
      : undefined;
  const raw = errCode ? `${errName} (${errCode})` : errName;
  return redactTextSecrets(raw, apiKey);
}

function redactTextSecrets(value: string, apiKey: string): string {
  let redacted = apiKey ? value.replaceAll(apiKey, "[redacted]") : value;
  redacted = redacted.replace(
    /\b(?:sk|rk|key|token|secret)[-_][A-Za-z0-9._-]{8,}\b/gi,
    "[redacted]",
  );
  return redacted.replace(/\bBearer\s+[A-Za-z0-9._~-]+\b/gi, "Bearer [redacted]");
}
