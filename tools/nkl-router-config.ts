import { realpathSync, statSync } from "node:fs";
import type { DeepSeekMcpConfig } from "./deepseek-mcp-config.js";

export type NklRole = "orchestrator" | "worker" | "reviewer";

export interface NklRouterConfig {
  workspaceRoot: string;
  cline?: DeepSeekMcpConfig;
  router: {
    providerId: string;
    baseUrl: string;
    apiKey: string;
    models: Record<NklRole, string>;
    maxWorkers: 1 | 2 | 3;
    reviewerRequired: true;
    retryLimit: 0 | 1;
  };
}

export function loadNklRouterConfig(
  env: NodeJS.ProcessEnv,
  workspaceRoot: string,
): NklRouterConfig {
  let canonicalWorkspaceRoot: string;
  try {
    canonicalWorkspaceRoot = realpathSync(workspaceRoot);
    if (!statSync(canonicalWorkspaceRoot).isDirectory()) {
      throw new Error("not a directory");
    }
  } catch {
    throw configurationError("workspace root is not readable");
  }

  const apiKey = requiredValue(env.NINE_ROUTER_API_KEY, "NINE_ROUTER_API_KEY");
  const baseUrl = requiredValue(
    env.NINE_ROUTER_BASE_URL,
    "NINE_ROUTER_BASE_URL",
  );
  const allAlias = env.NINE_ROUTER_ALL_ALIAS?.trim() || "Alll";
  if (allAlias !== "Alll") {
    throw configurationError(
      "NINE_ROUTER_ALL_ALIAS must be the literal alias Alll",
    );
  }

  const maxWorkers = boundedRangeValue<1 | 2 | 3>(
    env.NINE_ROUTER_MAX_WORKERS,
    "NINE_ROUTER_MAX_WORKERS",
    1,
    3,
    3,
  );
  const retryLimit = boundedRangeValue<0 | 1>(
    env.NINE_ROUTER_RETRY_LIMIT,
    "NINE_ROUTER_RETRY_LIMIT",
    0,
    1,
    1,
  );

  return {
    workspaceRoot: canonicalWorkspaceRoot,
    router: {
      providerId:
        env.NINE_ROUTER_PROVIDER_ID?.trim() ||
        "openai-compatible",
      baseUrl,
      apiKey,
      models: {
        orchestrator: modelValue(
          env.NINE_ROUTER_ORCHESTRATOR_MODEL?.trim() ||
            env.NINE_ROUTER_ORQUESTRADOR_MODEL?.trim(),
          "NINE_ROUTER_ORCHESTRATOR_MODEL",
          "NKL-ORQUESTRADOR",
        ),
        worker: modelValue(
          env.NINE_ROUTER_WORKER_MODEL,
          "NINE_ROUTER_WORKER_MODEL",
          "NKL-OPERARIOS",
        ),
        reviewer: modelValue(
          env.NINE_ROUTER_REVIEWER_MODEL,
          "NINE_ROUTER_REVIEWER_MODEL",
          "NKL-REVISOR",
        ),
      },
      maxWorkers,
      reviewerRequired: true,
      retryLimit,
    },
  };
}

export function redactNklConfigError(error: unknown): Error {
  const message = error instanceof Error ? error.message : "";
  const variable = message.match(
    /\b(?:CLINE_API_KEY|CLINE_MODEL_ID|CLINE_BASE_URL|NINE_ROUTER_[A-Z_]+)\b/,
  )?.[0];
  if (variable) {
    return configurationError(`set ${variable} in .env.local`);
  }
  return configurationError("check the local Cline and 9router variables");
}

function requiredValue(value: string | undefined, name: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw configurationError(`set ${name} in .env.local`);
  }
  return trimmed;
}

function modelValue(
  value: string | undefined,
  name: string,
  fallback: string,
): string {
  const trimmed = value?.trim() || fallback;
  if (!trimmed) {
    throw configurationError(`set ${name} in .env.local`);
  }
  return trimmed;
}

function boundedRangeValue<T extends number>(
  value: string | undefined,
  name: string,
  min: number,
  max: number,
  fallback: T,
): T {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }
  const trimmed = value.trim();
  const parsed = Number(trimmed);
  if (!/^\d+$/.test(trimmed) || !Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw configurationError(`${name} must be between ${min} and ${max}`);
  }
  return parsed as T;
}

function configurationError(message: string): Error {
  return new Error(`NKL router configuration error: ${message}`);
}
