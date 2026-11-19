import assert from "node:assert/strict";
import { test } from "node:test";

import {
  runNklRoleTask,
  type NklRoleResult,
} from "./nkl-router-runner.js";
import type { NklRouterConfig } from "./nkl-router-config.js";
import type { DirectWorkerConfig } from "./nkl-openai-worker.js";

const secret = "router-test-secret";
const config: NklRouterConfig = {
  workspaceRoot: "C:\\workspace\\portal-nkl",
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

test("role runner sends configured alias directly to 9router worker without Cline", async () => {
  let capturedConfig: DirectWorkerConfig | undefined;
  const result = await runNklRoleTask("reviewer", "review the compact plan", {
    config,
    runDirectTask: async (_prompt, directConfig) => {
      capturedConfig = directConfig;
      return {
        status: "completed",
        text: "The plan is consistent.",
        finishReason: "stop",
      };
    },
  });

  assert.equal(result.status, "completed");
  assert.equal(result.role, "reviewer");
  assert.equal(capturedConfig?.modelId, "NKL-REVISOR");
  assert.equal(capturedConfig?.workspaceRoot, config.workspaceRoot);
  assert.equal(capturedConfig?.baseUrl, config.router.baseUrl);
  assert.equal(capturedConfig?.apiKey, secret);
});

test("role runner honors modelOverride for custom NKL combos", async () => {
  let capturedModel: string | undefined;
  const result = await runNklRoleTask("worker", "inspect routes", {
    config,
    modelOverride: "NKL-FAST",
    runDirectTask: async (_prompt, directConfig) => {
      capturedModel = directConfig.modelId;
      return {
        status: "completed",
        text: "Done.",
        finishReason: "stop",
      };
    },
  });

  assert.equal(result.status, "completed");
  assert.equal(capturedModel, "NKL-FAST");
});

test("role runner bounds and deduplicates evidence while redacting secrets and blocked paths", async () => {
  const result = await runNklRoleTask("worker", "inspect the repository", {
    config,
    runDirectTask: async () => ({
      status: "completed",
      text:
        `secret=${secret}\n` +
        "EVIDENCE: src/auth.ts:10-12 | validates the input\n" +
        "EVIDENCE: src/auth.ts:10-12 | validates the input\n" +
        "EVIDENCE: .env.local:1 | must not be shared\n" +
        "EVIDENCE: src/app.ts:4 | renders the page",
      finishReason: "stop",
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
      runDirectTask: async () => ({
        status: "failed",
        text: `provider failed with ${secret}`,
        finishReason: "error",
      }),
    },
  );

  assert.deepEqual(result, {
    role: "worker",
    status: "failed",
    text: "provider failed with [redacted]",
    evidence: [],
    uncertainty: "The provider did not return a usable result.",
  });
  assert.equal(JSON.stringify(result).includes(secret), false);
});
