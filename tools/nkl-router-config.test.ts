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
    CLINE_API_KEY: "cline-test-key",
    CLINE_MODEL_ID: "cline-model",
    CLINE_PROVIDER_ID: "openai-compatible",
    CLINE_BASE_URL: "http://localhost:20128/dashboard",
    NINE_ROUTER_API_KEY: routerSecret,
    NINE_ROUTER_BASE_URL: "http://localhost:20128/dashboard",
    NINE_ROUTER_PROVIDER_ID: "openai-compatible",
    NINE_ROUTER_ORCHESTRATOR_MODEL: "NKL-ORQUESTRADOR",
    NINE_ROUTER_WORKER_MODEL: "NKL-OPERARIOS",
    NINE_ROUTER_REVIEWER_MODEL: "NKL-REVISOR",
    NINE_ROUTER_ALL_ALIAS: "Alll",
  };
}

test("loads exact router roles and fixed safety defaults", () => {
  const config = loadNklRouterConfig(validEnv(), workspaceRoot);

  assert.equal(config.router.providerId, "openai-compatible");
  assert.equal(config.router.baseUrl, "http://localhost:20128/dashboard");
  assert.equal(config.router.apiKey, routerSecret);
  assert.deepEqual(config.router.models, {
    orchestrator: "NKL-ORQUESTRADOR",
    worker: "NKL-OPERARIOS",
    reviewer: "NKL-REVISOR",
  });
  assert.equal(config.router.maxWorkers, 3);
  assert.equal(config.router.reviewerRequired, true);
  assert.equal(config.router.retryLimit, 1);
  assert.equal(config.cline.modelId, "cline-model");
});

test("rejects partial Cline configuration", () => {
  const env = validEnv();
  delete env.CLINE_MODEL_ID;

  assert.throws(
    () => loadNklRouterConfig(env, workspaceRoot),
    /CLINE_MODEL_ID/,
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

test("rejects invalid concurrency and retry overrides", () => {
  const env = validEnv();
  env.NINE_ROUTER_MAX_WORKERS = "4";
  assert.throws(
    () => loadNklRouterConfig(env, workspaceRoot),
    /NINE_ROUTER_MAX_WORKERS/,
  );

  const retryEnv = validEnv();
  retryEnv.NINE_ROUTER_RETRY_LIMIT = "2";
  assert.throws(
    () => loadNklRouterConfig(retryEnv, workspaceRoot),
    /NINE_ROUTER_RETRY_LIMIT/,
  );
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
