import assert from "node:assert/strict";
import { test } from "node:test";

import {
  runNklRoleTask,
  type NklRoleResult,
} from "./nkl-router-runner.js";
import type { NklRouterConfig } from "./nkl-router-config.js";
import type { WorkerSessionOptions } from "./deepseek-mcp-worker.js";

const secret = "router-test-secret";
const config: NklRouterConfig = {
  cline: {
    workspaceRoot: "C:\\workspace\\portal-nkl",
    providerId: "openai-compatible",
    modelId: "cline-coordinator",
    apiKey: "cline-secret",
    baseUrl: "https://cline.invalid/v1",
  },
  router: {
    providerId: "openai-compatible",
    baseUrl: "https://router.invalid/v1",
    apiKey: secret,
    models: {
      orchestrator: "NKL-ORQUESTRADOR",
      worker: "NKL-OPERARIOS",
      reviewer: "NKL-REVISOR",
    },
    maxWorkers: 3,
    reviewerRequired: true,
    retryLimit: 1,
  },
};

test("role runner uses the configured alias and fixed read-only workspace", async () => {
  let options: WorkerSessionOptions | undefined;
  const result = await runNklRoleTask("reviewer", "review the compact plan", {
    config,
    createSession: async (sessionOptions) => {
      options = sessionOptions;
      return {
        async run() {
          return {
            status: "completed",
            text: "The plan is consistent.",
            finishReason: "stop",
          };
        },
        async dispose() {},
      };
    },
  });

  assert.equal(result.status, "completed");
  assert.equal(result.role, "reviewer");
  assert.equal(options?.modelId, "NKL-REVISOR");
  assert.equal(options?.workspaceRoot, config.cline.workspaceRoot);
  assert.equal(options?.cwd, config.cline.workspaceRoot);
  assert.equal(options?.enableSpawnAgent, false);
  assert.equal(options?.enableAgentTeams, false);
  assert.equal(options?.enableEditing, false);
  assert.equal(options?.enableCommands, false);
  assert.equal(options?.enableWeb, false);
  assert.equal(options?.enableSkills, false);
  assert.equal(options?.enableMcp, false);
});

test("role runner bounds and deduplicates evidence while redacting secrets and blocked paths", async () => {
  const result = await runNklRoleTask("worker", "inspect the repository", {
    config,
    createSession: async () => ({
      async run() {
        return {
          status: "completed",
          text:
            `secret=${secret}\n` +
            "EVIDENCE: src/auth.ts:10-12 | validates the input\n" +
            "EVIDENCE: src/auth.ts:10-12 | validates the input\n" +
            "EVIDENCE: .env.local:1 | must not be shared\n" +
            "EVIDENCE: src/app.ts:4 | renders the page",
          finishReason: "stop",
        };
      },
      async dispose() {},
    }),
  });

  assert.equal(result.status, "completed");
  assert.equal(result.text.includes(secret), false);
  assert.equal(result.text.includes(".env.local"), false);
  assert.deepEqual(result.evidence, [
    {
      path: "src/auth.ts",
      lines: "10-12",
      note: "validates the input",
    },
    {
      path: "src/app.ts",
      lines: "4",
      note: "renders the page",
    },
  ]);
});

test("role runner exposes provider failures as failed results without a success fallback", async () => {
  const result: NklRoleResult = await runNklRoleTask(
    "worker",
    "inspect the repository",
    {
      config,
      createSession: async () => ({
        async run() {
          throw new Error(`provider failed with ${secret}`);
        },
        async dispose() {},
      }),
    },
  );

  assert.deepEqual(result, {
    role: "worker",
    status: "failed",
    text: "DeepSeek task failed",
    evidence: [],
    uncertainty: "The provider did not return a usable result.",
  });
  assert.equal(JSON.stringify(result).includes(secret), false);
});
