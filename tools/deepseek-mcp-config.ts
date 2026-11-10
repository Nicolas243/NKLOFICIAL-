import { realpathSync, statSync } from "node:fs";

export interface DeepSeekMcpConfig {
  workspaceRoot: string;
  providerId: string;
  modelId: string;
  apiKey: string;
  baseUrl?: string;
}

export function loadDeepSeekMcpConfig(
  env: NodeJS.ProcessEnv,
  workspaceRoot: string,
): DeepSeekMcpConfig {
  const apiKey = env.CLINE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing required CLINE_API_KEY");
  }

  const modelId = env.CLINE_MODEL_ID?.trim();
  if (!modelId) {
    throw new Error("Missing required CLINE_MODEL_ID");
  }

  const providerId = env.CLINE_PROVIDER_ID?.trim() || "openai-compatible";
  const baseUrl = env.CLINE_BASE_URL?.trim() || undefined;
  if (providerId === "openai-compatible" && !baseUrl) {
    throw new Error("Missing required CLINE_BASE_URL for openai-compatible provider");
  }

  let canonicalWorkspaceRoot: string;
  try {
    canonicalWorkspaceRoot = realpathSync(workspaceRoot);
    if (!statSync(canonicalWorkspaceRoot).isDirectory()) {
      throw new Error("not a directory");
    }
  } catch {
    throw new Error("Workspace root is not readable");
  }

  return {
    workspaceRoot: canonicalWorkspaceRoot,
    providerId,
    modelId,
    apiKey,
    ...(baseUrl ? { baseUrl } : {}),
  };
}
