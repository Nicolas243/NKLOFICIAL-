import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  approveRun,
  createRun,
  planPublication,
  readRun,
  transitionStatus,
  validateManifest,
  type VideoManifest,
} from "./nkl-video-factory.js";

function manifest(overrides: Partial<VideoManifest> = {}): VideoManifest {
  return validateManifest({
    title: "IA na prática para criar conteúdo",
    objective: "Ensinar um fluxo seguro de pesquisa e criação",
    audience: "Criadores iniciantes",
    sources: [{ url: "https://nkloficial.com.br/ia", title: "Portal NKL", verified: true }],
    durationSeconds: 180,
    formats: ["horizontal", "vertical"],
    language: "pt-BR",
    prohibitedClaims: ["renda garantida"],
    callToAction: "Conheça o IA na Prática NKL",
    rightsConfirmed: true,
    channels: ["youtube", "facebook"],
    ...overrides,
  });
}

test("manifest validates and rights confirmation is required", () => {
  assert.equal(manifest().language, "pt-BR");
  assert.throws(
    () => validateManifest({ ...manifest(), rightsConfirmed: undefined }),
    /rightsConfirmed/,
  );
});

test("run is persisted and approval requires the three review dimensions", () => {
  const cwd = mkdtempSync(join(tmpdir(), "nkl-video-"));
  try {
    const run = createRun(manifest(), cwd);
    assert.equal(run.status, "draft");
    assert.equal(readRun(run.id, cwd).manifestSha256, run.manifestSha256);
    assert.throws(
      () => approveRun(run, "Revisor", { content: true, clip: false, metadata: true }, cwd),
      /three reviews/,
    );
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("publication planning is blocked until approval and is idempotent", () => {
  const cwd = mkdtempSync(join(tmpdir(), "nkl-video-"));
  try {
    const run = createRun(manifest(), cwd);
    assert.throws(() => planPublication(run, "youtube", "clip-1", cwd), /approved/);

    const approved = approveRun(run, "Nicolas", undefined, cwd);
    const planned = planPublication(approved, "youtube", "clip-1", cwd);
    const repeated = planPublication(planned, "youtube", "clip-1", cwd);
    assert.equal(planned.status, "scheduled");
    assert.equal(planned.publications.length, 1);
    assert.equal(repeated.publications.length, 1);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("closed state transitions reject publishing from draft", () => {
  const cwd = mkdtempSync(join(tmpdir(), "nkl-video-"));
  try {
    const run = createRun(manifest(), cwd);
    assert.throws(() => transitionStatus(run, "published"), /Invalid transition/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
