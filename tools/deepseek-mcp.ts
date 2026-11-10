import { pathToFileURL } from "node:url";
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

export const delegateToDeepSeekInputSchema = z.object({
  task: z.string().trim().min(1, "task must not be empty"),
});

export interface DeepSeekToolHandlerOptions extends WorkerDependencies {
  config: DeepSeekMcpConfig;
  runTask?: (
    task: string,
    deps?: WorkerDependencies,
  ) => Promise<DeepSeekTaskResult>;
}

export function createDeepSeekToolHandler(
  options: DeepSeekToolHandlerOptions,
): (input: { task: string }) => Promise<CallToolResult> {
  const runTask = options.runTask ?? runDeepSeekTask;
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
      const result = await runTask(parsed.task, {
        config: options.config,
        deadlineMs: options.deadlineMs,
        createSession: options.createSession,
      });
      return resultToCallToolResult(redactResult(result, options.config.apiKey));
    } finally {
      release();
    }
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

export function createDeepSeekMcpServer(
  options: DeepSeekToolHandlerOptions,
): McpServer {
  const server = new McpServer({
    name: "portal-nkl-deepseek",
    version: "0.1.0",
  });
  const handler = createDeepSeekToolHandler(options);

  server.registerTool(
    "delegate_to_deepseek",
    {
      title: "Delegate to DeepSeek",
      description:
        "Run one read-only repository analysis task in the fixed local workspace.",
      inputSchema: {
        task: z.string().trim().min(1, "task must not be empty"),
      },
    },
    handler,
  );
  return server;
}

export async function main(): Promise<void> {
  const config = loadDeepSeekMcpConfig(process.env, process.cwd());
  const server = createDeepSeekMcpServer({ config });
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function isEntrypoint(): boolean {
  const entrypoint = process.argv[1];
  return Boolean(entrypoint && import.meta.url === pathToFileURL(entrypoint).href);
}

if (isEntrypoint()) {
  main().catch(() => {
    process.stderr.write("DeepSeek MCP worker failed to start\n");
    process.exitCode = 1;
  });
}
