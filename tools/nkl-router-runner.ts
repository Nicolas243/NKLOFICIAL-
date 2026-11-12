import type { DeepSeekMcpConfig } from "./deepseek-mcp-config.js";
import {
  runDeepSeekTask,
  type DeepSeekTaskResult,
  type WorkerSession,
  type WorkerSessionOptions,
} from "./deepseek-mcp-worker.js";
import type { NklRole, NklRouterConfig } from "./nkl-router-config.js";
import { loadNklRouterConfig } from "./nkl-router-config.js";

const MAX_ROLE_PROMPT_CHARS = 12_000;
const MAX_ROLE_TEXT_CHARS = 6_000;
const MAX_EVIDENCE_ITEMS = 12;

export interface NklEvidence {
  path: string;
  lines?: string;
  note: string;
}

export interface NklRoleResult {
  role: NklRole;
  status: "completed" | "failed" | "aborted" | "fallback";
  text: string;
  evidence: NklEvidence[];
  uncertainty?: string;
  usage?: Record<string, unknown>;
}

export interface RouterRunnerDependencies {
  config?: NklRouterConfig;
  deadlineMs?: number;
  createSession?: (
    options: WorkerSessionOptions,
    task: string,
  ) => Promise<WorkerSession> | WorkerSession;
}

export async function runNklRoleTask(
  role: NklRole,
  prompt: string,
  deps: RouterRunnerDependencies = {},
): Promise<NklRoleResult> {
  const config =
    deps.config ?? loadNklRouterConfig(process.env, process.cwd());
  const boundedPrompt = boundText(prompt, MAX_ROLE_PROMPT_CHARS);
  const roleConfig: DeepSeekMcpConfig = {
    workspaceRoot: config.cline.workspaceRoot,
    providerId: config.router.providerId,
    modelId: config.router.models[role],
    apiKey: config.router.apiKey,
    baseUrl: config.router.baseUrl,
  };
  const result = await runDeepSeekTask(boundedPrompt, {
    config: roleConfig,
    deadlineMs: deps.deadlineMs,
    createSession: deps.createSession,
  });

  return normalizeRoleResult(role, result, config.router.apiKey);
}

function normalizeRoleResult(
  role: NklRole,
  result: DeepSeekTaskResult,
  apiKey: string,
): NklRoleResult {
  const safeText = sanitizeText(result.text, apiKey);
  const evidence = extractEvidence(result.text, apiKey);
  return {
    role,
    status: result.status,
    text: safeText,
    evidence,
    ...(result.status === "failed"
      ? { uncertainty: "The provider did not return a usable result." }
      : result.status === "aborted"
        ? { uncertainty: "The role exceeded its deadline." }
        : {}),
    ...(result.usage ? { usage: sanitizeUsage(result.usage, apiKey) } : {}),
  };
}

function extractEvidence(text: string, apiKey: string): NklEvidence[] {
  const evidence: NklEvidence[] = [];
  const seen = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(
      /^\s*EVIDENCE:\s*([^|]+?)(?::(\d+(?:-\d+)?))?\s*\|\s*(.+?)\s*$/,
    );
    if (!match) {
      continue;
    }
    const relativePath = sanitizeText(match[1], apiKey).trim();
    const lines = match[2]?.trim();
    const note = sanitizeText(match[3], apiKey).trim();
    if (!relativePath || !note || isBlockedPath(relativePath)) {
      continue;
    }
    const key = `${relativePath}\0${lines ?? ""}\0${note}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    evidence.push({
      path: relativePath,
      ...(lines ? { lines } : {}),
      note,
    });
    if (evidence.length === MAX_EVIDENCE_ITEMS) {
      break;
    }
  }
  return evidence;
}

function sanitizeText(text: string, apiKey: string): string {
  const safeLines = text
    .split(/\r?\n/)
    .filter((line) => !containsBlockedPath(line))
    .map((line) => redactSecrets(line, apiKey));
  return boundText(safeLines.join("\n").trim(), MAX_ROLE_TEXT_CHARS);
}

function sanitizeUsage(
  usage: Record<string, unknown>,
  apiKey: string,
): Record<string, unknown> {
  const serialized = redactSecrets(JSON.stringify(usage), apiKey);
  try {
    return JSON.parse(serialized) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function redactSecrets(value: string, apiKey: string): string {
  let redacted = value.replaceAll(apiKey, "[redacted]");
  redacted = redacted.replace(
    /\b(?:sk|rk|key|token|secret)[-_][A-Za-z0-9._-]{8,}\b/gi,
    "[redacted]",
  );
  return redacted.replace(/\bBearer\s+[A-Za-z0-9._~-]+\b/gi, "Bearer [redacted]");
}

function containsBlockedPath(value: string): boolean {
  return /(?:^|[\\/.\s])(?:\.env(?:\.[\w.-]+)?|\.git(?:[\\/.\s]|$)|node_modules(?:[\\/.\s]|$)|\.next(?:[\\/.\s]|$)|supabase[\\/]+\.temp(?:[\\/.\s]|$)|(?:credentials(?:\.json)?|id_rsa|id_ed25519|service-account\.json)|[^\s\\/]+(?:\.key|\.pem|\.p12|\.pfx))(?:$|[\\/.\s:])/i.test(
    value,
  );
}

function isBlockedPath(value: string): boolean {
  return containsBlockedPath(value);
}

function boundText(value: string, maximum: number): string {
  return value.length <= maximum ? value : `${value.slice(0, maximum)}…`;
}
