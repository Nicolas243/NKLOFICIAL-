import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { after, before, test } from "node:test";

import {
  listRouterModels,
  normalizeChatCompletionsUrl,
  normalizeModelsUrl,
  runDirectOpenAiTask,
} from "./nkl-openai-worker.js";

const fixtureRoot = path.join(
  process.cwd(),
  `.nkl-openai-worker-test-${process.pid}`,
);
const apiKey = "9router-unit-secret-key";
const baseUrl = "http://127.0.0.1:20128/v1";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function readHeaders(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) {
    return {};
  }
  const normalized = new Headers(headers);
  const out: Record<string, string> = {};
  normalized.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

before(async () => {
  await rm(fixtureRoot, { recursive: true, force: true });
  await mkdir(path.join(fixtureRoot, "src"), { recursive: true });
  await Promise.all([
    writeFile(
      path.join(fixtureRoot, "src", "sample.ts"),
      "export const alpha = 1;\nexport const targetLine = 42;\nexport const omega = 3;\n",
    ),
    writeFile(
      path.join(fixtureRoot, ".env.local"),
      "NINE_ROUTER_API_KEY=must-never-leak\n",
    ),
  ]);
});

after(async () => {
  await rm(fixtureRoot, { recursive: true, force: true });
});

test("normalizes chat completions and models URLs", () => {
  assert.equal(
    normalizeChatCompletionsUrl("http://127.0.0.1:20128/v1/"),
    "http://127.0.0.1:20128/v1/chat/completions",
  );
  assert.equal(
    normalizeChatCompletionsUrl("http://127.0.0.1:20128/v1/chat/completions"),
    "http://127.0.0.1:20128/v1/chat/completions",
  );
  assert.equal(
    normalizeModelsUrl("http://127.0.0.1:20128/v1"),
    "http://127.0.0.1:20128/v1/models",
  );
  assert.equal(
    normalizeModelsUrl("http://127.0.0.1:20128/v1/chat/completions"),
    "http://127.0.0.1:20128/v1/models",
  );
});

test("handles single-turn completion, Bearer auth header, and usage aggregation", async () => {
  let seenUrl = "";
  let seenAuth = "";
  let seenModel = "";

  const fetchImpl: typeof fetch = async (input, init) => {
    seenUrl = String(input);
    const headers = readHeaders(init?.headers);
    seenAuth = headers.authorization ?? "";
    const body = JSON.parse(String(init?.body ?? "{}")) as { model: string };
    seenModel = body.model;
    return jsonResponse({
      choices: [
        {
          finish_reason: "stop",
          message: {
            content: "Done inspecting.",
          },
        },
      ],
      usage: {
        prompt_tokens: 15,
        completion_tokens: 5,
        total_tokens: 20,
      },
    });
  };

  const result = await runDirectOpenAiTask(
    "hello",
    {
      workspaceRoot: fixtureRoot,
      baseUrl,
      apiKey,
      modelId: "NKL-OPERARIOS",
    },
    { fetchImpl },
  );

  assert.equal(seenUrl, "http://127.0.0.1:20128/v1/chat/completions");
  assert.equal(seenAuth, `Bearer ${apiKey}`);
  assert.equal(seenModel, "NKL-OPERARIOS");
  assert.deepEqual(result, {
    status: "completed",
    text: "Done inspecting.",
    finishReason: "stop",
    usage: {
      promptTokens: 15,
      completionTokens: 5,
      totalTokens: 20,
    },
  });
});

test("executes multi-turn search_workspace and line-bounded read_workspace_file tool calls", async () => {
  let turn = 0;
  let capturedToolMessages: Array<{ role: string; content: string }> = [];

  const fetchImpl: typeof fetch = async (_input, init) => {
    turn += 1;
    const payload = JSON.parse(String(init?.body ?? "{}")) as {
      messages: Array<{ role: string; content: string }>;
    };

    if (turn === 1) {
      return jsonResponse({
        choices: [
          {
            finish_reason: "tool_calls",
            message: {
              content: null,
              tool_calls: [
                {
                  id: "call_1",
                  type: "function",
                  function: {
                    name: "search_workspace",
                    arguments: JSON.stringify({ query: "targetLine" }),
                  },
                },
              ],
            },
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      });
    }

    if (turn === 2) {
      return jsonResponse({
        choices: [
          {
            finish_reason: "tool_calls",
            message: {
              content: null,
              tool_calls: [
                {
                  id: "call_2",
                  type: "function",
                  function: {
                    name: "read_workspace_file",
                    arguments: JSON.stringify({
                      path: "src/sample.ts",
                      startLine: 2,
                      endLine: 2,
                    }),
                  },
                },
              ],
            },
          },
        ],
        usage: { prompt_tokens: 20, completion_tokens: 6, total_tokens: 26 },
      });
    }

    capturedToolMessages = payload.messages.filter((m) => m.role === "tool");
    return jsonResponse({
      choices: [
        {
          finish_reason: "stop",
          message: {
            content: "EVIDENCE: src/sample.ts:2-2 | targetLine = 42",
          },
        },
      ],
      usage: { prompt_tokens: 30, completion_tokens: 10, total_tokens: 40 },
    });
  };

  const result = await runDirectOpenAiTask(
    "find targetLine",
    {
      workspaceRoot: fixtureRoot,
      baseUrl,
      apiKey,
      modelId: "NKL-OPERARIOS",
    },
    { fetchImpl },
  );

  assert.equal(turn, 3);
  assert.equal(capturedToolMessages.length, 2);
  const searchOut = JSON.parse(capturedToolMessages[0]!.content) as {
    matches: Array<{ path: string; line: number }>;
  };
  assert.equal(searchOut.matches[0]?.path, "src/sample.ts");
  assert.equal(searchOut.matches[0]?.line, 2);

  const readOut = JSON.parse(capturedToolMessages[1]!.content) as {
    content: string;
    startLine: number;
    endLine: number;
  };
  assert.equal(readOut.content, "export const targetLine = 42;");
  assert.equal(readOut.startLine, 2);
  assert.equal(readOut.endLine, 2);

  assert.equal(result.status, "completed");
  assert.equal(result.text, "EVIDENCE: src/sample.ts:2-2 | targetLine = 42");
  assert.deepEqual(result.usage, {
    promptTokens: 60,
    completionTokens: 20,
    totalTokens: 80,
  });
});

test("rejects unknown tools, malformed JSON args, blocked paths, and redacts secrets", async () => {
  let turn = 0;
  let toolOutputs: string[] = [];

  const fetchImpl: typeof fetch = async (_input, init) => {
    turn += 1;
    const payload = JSON.parse(String(init?.body ?? "{}")) as {
      messages: Array<{ role: string; content: string }>;
    };

    if (turn === 1) {
      return jsonResponse({
        choices: [
          {
            finish_reason: "tool_calls",
            message: {
              content: null,
              tool_calls: [
                {
                  id: "call_unknown",
                  type: "function",
                  function: { name: "run_commands", arguments: "{}" },
                },
                {
                  id: "call_bad_json",
                  type: "function",
                  function: {
                    name: "list_workspace_files",
                    arguments: "{bad",
                  },
                },
                {
                  id: "call_blocked",
                  type: "function",
                  function: {
                    name: "read_workspace_file",
                    arguments: JSON.stringify({ path: ".env.local" }),
                  },
                },
              ],
            },
          },
        ],
      });
    }

    toolOutputs = payload.messages
      .filter((m) => m.role === "tool")
      .map((m) => m.content);
    return jsonResponse({
      choices: [
        {
          finish_reason: "stop",
          message: {
            content: `Finished cleanly despite ${apiKey}`,
          },
        },
      ],
    });
  };

  const result = await runDirectOpenAiTask(
    "test safety",
    {
      workspaceRoot: fixtureRoot,
      baseUrl,
      apiKey,
      modelId: "NKL-OPERARIOS",
    },
    { fetchImpl },
  );

  assert.equal(toolOutputs.length, 3);
  assert.deepEqual(JSON.parse(toolOutputs[0]!), { error: "Tool not allowed" });
  assert.deepEqual(JSON.parse(toolOutputs[1]!), {
    error: "Invalid tool arguments",
  });
  assert.match(JSON.parse(toolOutputs[2]!).error as string, /blocked/i);

  assert.equal(result.status, "completed");
  assert.equal(result.text.includes(apiKey), false);
  assert.equal(result.text.includes("[redacted]"), true);
});

test("handles HTTP 500 errors and deadline aborts cleanly", async () => {
  const errorResult = await runDirectOpenAiTask(
    "fail please",
    {
      workspaceRoot: fixtureRoot,
      baseUrl,
      apiKey,
      modelId: "NKL-OPERARIOS",
    },
    {
      fetchImpl: async () => jsonResponse({ error: "boom" }, 500),
    },
  );
  assert.equal(errorResult.status, "failed");
  assert.equal(errorResult.text, "9router task failed (HTTP 500)");

  const abortingFetch: typeof fetch = async (_input, init) =>
    new Promise<Response>((_resolve, reject) => {
      const rejectAbort = () => {
        const err = new Error("Aborted");
        err.name = "AbortError";
        reject(err);
      };
      if (init?.signal?.aborted) {
        rejectAbort();
        return;
      }
      init?.signal?.addEventListener("abort", rejectAbort, { once: true });
    });

  const abortedResult = await runDirectOpenAiTask(
    "hang please",
    {
      workspaceRoot: fixtureRoot,
      baseUrl,
      apiKey,
      modelId: "NKL-OPERARIOS",
    },
    { deadlineMs: 20, fetchImpl: abortingFetch },
  );
  assert.equal(abortedResult.status, "aborted");
  assert.equal(abortedResult.finishReason, "aborted");
});

test("listRouterModels sorts NKL* combos first and alphabetically", async () => {
  let seenUrl = "";
  let seenAuth = "";

  const fetchImpl: typeof fetch = async (input, init) => {
    seenUrl = String(input);
    seenAuth = readHeaders(init?.headers).authorization ?? "";
    return jsonResponse({
      data: [
        { id: "gpt-4o-mini" },
        { id: "NKL-REVISOR" },
        { id: "deepseek-chat" },
        { id: "nkl-fast" },
        { id: "NKL-OPERARIOS" },
        { id: "NKL-REVISOR" },
      ],
    });
  };

  const modelsResult = await listRouterModels({ baseUrl, apiKey }, fetchImpl);
  assert.equal(seenUrl, "http://127.0.0.1:20128/v1/models");
  assert.equal(seenAuth, `Bearer ${apiKey}`);
  assert.deepEqual(modelsResult, {
    status: "completed",
    models: [
      "nkl-fast",
      "NKL-OPERARIOS",
      "NKL-REVISOR",
      "deepseek-chat",
      "gpt-4o-mini",
    ],
  });
});
