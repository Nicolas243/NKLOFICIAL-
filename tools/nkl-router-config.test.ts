import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import {
  loadNklRouterConfig,
  redactNklConfigError,
} from "./nkl-router-config.js";

const workspaceRoot = process.cwd();
const routerSecret = "router-secret-that-must-not-leak";

function validEnv(): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "test",
    NINE_ROUTER_API_KEY: routerSecret,
    NINE_ROUTER_BASE_URL: "http://127.0.0.1:20128/v1",
    NINE_ROUTER_PROVIDER_ID: "openai-compatible",
    NINE_ROUTER_ORCHESTRATOR_MODEL: "NKL-ORQUESTRADOR",
    NINE_ROUTER_WORKER_MODEL: "NKL-OPERARIOS",
    NINE_ROUTER_REVIEWER_MODEL: "NKL-REVISOR",
    NINE_ROUTER_ALL_ALIAS: "Alll",
  };
}

test("loads pure 9router configuration without any CLINE_* variables", () => {
  const config = loadNklRouterConfig(validEnv(), workspaceRoot);

  assert.equal(config.cline, undefined);
  assert.equal(config.router.providerId, "openai-compatible");
  assert.equal(config.router.baseUrl, "http://127.0.0.1:20128/v1");
  assert.equal(config.router.apiKey, routerSecret);
  assert.deepEqual(config.router.models, {
    orchestrator: "NKL-ORQUESTRADOR",
    worker: "NKL-OPERARIOS",
    reviewer: "NKL-REVISOR",
  });
  assert.equal(config.router.maxWorkers, 3);
  assert.equal(config.router.reviewerRequired, true);
  assert.equal(config.router.retryLimit, 1);
});

test("accepts both NINE_ROUTER_ORQUESTRADOR_MODEL and NINE_ROUTER_ORCHESTRATOR_MODEL", () => {
  const ptEnv = validEnv();
  delete ptEnv.NINE_ROUTER_ORCHESTRATOR_MODEL;
  ptEnv.NINE_ROUTER_ORQUESTRADOR_MODEL = "NKL-ORQ-PT";
  const ptConfig = loadNklRouterConfig(ptEnv, workspaceRoot);
  assert.equal(ptConfig.router.models.orchestrator, "NKL-ORQ-PT");

  const enEnv = validEnv();
  enEnv.NINE_ROUTER_ORCHESTRATOR_MODEL = "NKL-ORQ-EN";
  enEnv.NINE_ROUTER_ORQUESTRADOR_MODEL = "NKL-ORQ-PT";
  const enConfig = loadNklRouterConfig(enEnv, workspaceRoot);
  assert.equal(enConfig.router.models.orchestrator, "NKL-ORQ-EN");
});

test("rejects unreadable workspace root", () => {
  assert.throws(
    () => loadNklRouterConfig(validEnv(), `${workspaceRoot}\\missing-dir`),
    /workspace root is not readable/,
  );
});

test("rejects partial router configuration without fallback", () => {
  const env = validEnv();
  delete env.NINE_ROUTER_API_KEY;

  assert.throws(
    () => loadNklRouterConfig(env, workspaceRoot),
    /NINE_ROUTER_API_KEY/,
  );
});

test("rejects a non-literal Alll alias", () => {
  const env = validEnv();
  env.NINE_ROUTER_ALL_ALIAS = "all";

  assert.throws(
    () => loadNklRouterConfig(env, workspaceRoot),
    /NINE_ROUTER_ALL_ALIAS.*Alll/,
  );
});

test("accepts bounded concurrency and retry values and rejects out-of-range overrides", () => {
  for (const workers of ["1", "2", "3"]) {
    const env = validEnv();
    env.NINE_ROUTER_MAX_WORKERS = workers;
    assert.equal(loadNklRouterConfig(env, workspaceRoot).router.maxWorkers, Number(workers));
  }

  for (const invalidWorkers of ["0", "4", "abc"]) {
    const env = validEnv();
    env.NINE_ROUTER_MAX_WORKERS = invalidWorkers;
    assert.throws(
      () => loadNklRouterConfig(env, workspaceRoot),
      /NINE_ROUTER_MAX_WORKERS/,
    );
  }

  for (const retry of ["0", "1"]) {
    const env = validEnv();
    env.NINE_ROUTER_RETRY_LIMIT = retry;
    assert.equal(loadNklRouterConfig(env, workspaceRoot).router.retryLimit, Number(retry));
  }

  for (const invalidRetry of ["2", "-1"]) {
    const retryEnv = validEnv();
    retryEnv.NINE_ROUTER_RETRY_LIMIT = invalidRetry;
    assert.throws(
      () => loadNklRouterConfig(retryEnv, workspaceRoot),
      /NINE_ROUTER_RETRY_LIMIT/,
    );
  }
});

test("redacts secrets from configuration errors", () => {
  const error = redactNklConfigError(
    new Error(`router failed with ${routerSecret} and CLINE_API_KEY=value`),
  );

  assert.equal(error.message.includes(routerSecret), false);
  assert.equal(error.message.includes("value"), false);
  assert.match(error.message, /NKL router configuration error|configuration error/);
});

test("documents only the non-secret router environment contract", async () => {
  const example = await readFile(".env.example", "utf8");

  for (const name of [
    "NINE_ROUTER_API_KEY",
    "NINE_ROUTER_BASE_URL",
    "NINE_ROUTER_PROVIDER_ID",
    "NINE_ROUTER_ORQUESTRADOR_MODEL",
    "NINE_ROUTER_WORKER_MODEL",
    "NINE_ROUTER_REVIEWER_MODEL",
    "NINE_ROUTER_ALL_ALIAS",
  ]) {
    assert.equal(example.includes(name), true);
  }
  assert.equal(example.includes(routerSecret), false);
});
