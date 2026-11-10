import type { DeepSeekMcpConfig } from "./deepseek-mcp-config.js";
import { loadDeepSeekMcpConfig } from "./deepseek-mcp-config.js";

export type NklRole = "orchestrator" | "worker" | "reviewer";

export interface NklRouterConfig {
  cline: DeepSeekMcpConfig;
  router: {
    providerId: string;
    baseUrl: string;
    apiKey: string;
    models: Record<NklRole, string>;
    maxWorkers: 3;
    reviewerRequired: true;
    retryLimit: 1;
  };
}

export function loadNklRouterConfig(
  env: NodeJS.ProcessEnv,
  workspaceRoot: string,
): NklRouterConfig {
  let cline: DeepSeekMcpConfig;
  try {
    cline = loadDeepSeekMcpConfig(env, workspaceRoot);
  } catch (error) {
    throw redactNklConfigError(error);
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

  const maxWorkers = boundedExactValue<3>(
    env.NINE_ROUTER_MAX_WORKERS,
    "NINE_ROUTER_MAX_WORKERS",
    3,
  );
  const retryLimit = boundedExactValue<1>(
    env.NINE_ROUTER_RETRY_LIMIT,
    "NINE_ROUTER_RETRY_LIMIT",
    1,
  );

  return {
    cline,
    router: {
      providerId:
        env.NINE_ROUTER_PROVIDER_ID?.trim() ||
        cline.providerId ||
        "openai-compatible",
      baseUrl,
      apiKey,
      models: {
        orchestrator: modelValue(
          env.NINE_ROUTER_ORCHESTRATOR_MODEL,
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

function boundedExactValue<T extends 3 | 1>(
  value: string | undefined,
  name: string,
  expected: T,
): T {
  if (value === undefined || value.trim() === "") {
    return expected;
  }
  if (!/^\d+$/.test(value.trim()) || Number(value) !== expected) {
    throw configurationError(`${name} must be ${expected}`);
  }
  return expected;
}

function configurationError(message: string): Error {
  return new Error(`NKL router configuration error: ${message}`);
}
