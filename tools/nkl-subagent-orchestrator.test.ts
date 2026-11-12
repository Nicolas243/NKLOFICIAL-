import assert from "node:assert/strict";
import { test } from "node:test";

import {
  orchestrateNklTask,
  type OrchestratorDependencies,
} from "./nkl-subagent-orchestrator.js";
import type { NklRole, NklRouterConfig } from "./nkl-router-config.js";
import type { NklRoleResult } from "./nkl-router-runner.js";

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
    apiKey: "router-secret",
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

function completed(role: NklRole, text: string): NklRoleResult {
  return {
    role,
    status: "completed",
    text,
    evidence: [{ path: "src/app.ts", lines: "1", note: "relevant code" }],
  };
}

test("orchestrator runs at most three workers in parallel and always reviews compact results", async () => {
  const calls: Array<{ role: NklRole; prompt: string }> = [];
  let activeWorkers = 0;
  let peakWorkers = 0;
  const deps: OrchestratorDependencies = {
    config,
    runRole: async (role, prompt) => {
      calls.push({ role, prompt });
      if (role === "orchestrator") {
        return completed(role, "PLAN: inspect the application entry points");
      }
      if (role === "worker") {
        activeWorkers += 1;
        peakWorkers = Math.max(peakWorkers, activeWorkers);
        await new Promise((resolve) => setTimeout(resolve, 5));
        activeWorkers -= 1;
        return completed(role, "Worker found one relevant path.");
      }
      assert.equal(role, "reviewer");
      assert.equal(prompt.includes("FULL_FILE_CONTENT"), false);
      assert.equal(prompt.includes("Worker found one relevant path."), true);
      return completed(role, "Review passed.");
    },
  };

  const result = await orchestrateNklTask("analyze the application", deps);

  assert.equal(result.status, "completed");
  assert.equal(result.fallbackUsed, false);
  assert.equal(result.workers.length, 3);
  assert.equal(result.review.status, "completed");
  assert.equal(peakWorkers, 3);
  assert.equal(calls.filter((call) => call.role === "worker").length, 3);
  assert.equal(calls.filter((call) => call.role === "reviewer").length, 1);
});

test("orchestrator retries a failed worker once and marks the remaining work as fallback", async () => {
  let workerAttempts = 0;
  const deps: OrchestratorDependencies = {
    config,
    runRole: async (role) => {
      if (role === "orchestrator") {
        return completed(role, "PLAN: inspect the application");
      }
      if (role === "worker") {
        workerAttempts += 1;
        return {
          role,
          status: "failed",
          text: "NKL worker failed",
          evidence: [],
          uncertainty: "unavailable",
        };
      }
      return completed(role, "Review recorded the worker failure.");
    },
  };

  const result = await orchestrateNklTask("analyze the application", deps);

  assert.equal(workerAttempts, 6);
  assert.equal(result.fallbackUsed, true);
  assert.equal(result.workers.length, 3);
  assert.equal(result.workers.every((worker) => worker.status === "fallback"), true);
  assert.equal(result.review.status, "completed");
  assert.equal(result.status, "completed");
});

test("unavailable mandatory reviewer makes orchestration incomplete", async () => {
  const deps: OrchestratorDependencies = {
    config,
    runRole: async (role) => {
      if (role === "reviewer") {
        return {
          role,
          status: "failed",
          text: "NKL reviewer failed",
          evidence: [],
          uncertainty: "The reviewer was unavailable.",
        };
      }
      return completed(role, role === "orchestrator" ? "PLAN: inspect" : "worker result");
    },
  };

  const result = await orchestrateNklTask("analyze the application", deps);

  assert.equal(result.status, "incomplete");
  assert.equal(result.review.status, "failed");
  assert.equal(result.fallbackUsed, false);
});
