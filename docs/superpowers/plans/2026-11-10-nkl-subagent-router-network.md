# NKL Subagent Router Network Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local, read-only Cline coordinator that uses the 9router aliases to run up to three worker analyses and one mandatory review while preserving explicit failure handling and low duplicated context.

**Architecture:** Keep the existing MCP stdio entrypoint and fixed workspace readers. Extend the Cline session lifecycle safely, add a validated 9router role configuration, run coordinator/workers/reviewer through isolated read-only sessions with model aliases, and synthesize compact structured results without recursive Cline spawning or persistent cache.

**Tech Stack:** Node.js 22+, TypeScript, `@cline/sdk`, `@modelcontextprotocol/sdk`, `tsx`, Zod, Node test runner, existing dotenv/configuration conventions.

**Spec:** `docs/superpowers/specs/2026-11-10-nkl-subagent-router-network-design.md`

## Global Constraints

- The process remains local via MCP stdio and must not open a network listener.
- The worker remains permanently bound to the current repository root.
- The first version is strictly read-only: no file writes, shell commands, test execution by agents, deploys, migrations, web fetches, external MCPs, persistent teams, or recursive agent spawning.
- Cline remains the primary coordinator; the 9router aliases are always auxiliary when combined mode is enabled.
- `NKL-ORQUESTRADOR`, `NKL-OPERARIOS`, and `NKL-REVISOR` are sent as literal model IDs; `Alll` remains a literal gateway alias and is resolved only by the 9router.
- Configuration is invalid when either the required `CLINE_*` or `NINE_ROUTER_*` group is partial; no silent fallback is allowed.
- The worker executes at most 3 workers concurrently and always performs a reviewer pass.
- A failed role is retried with another eligible helper; after the retry fails, the Cline coordinator performs the remaining work and marks the source explicitly.
- There is no aggregate token cap in the first version; safety limits remain on input/output size, iterations, deadlines, and concurrency.
- No result cache is persisted or reused automatically in the first version.
- Secrets and blocked paths must never appear in prompts, results, stdout, stderr, commits, or artifacts.
- Every session must await abort completion on timeout and call `dispose()` in `finally`.
- Runtime support is Node.js 22+.

## Review Focus

- A Cline session whose initial `start().result` is absent must await the asynchronous completion event; test this in Task 1.
- A timeout must not dispose a session before `abort()` settles, including when `run()` resolves concurrently; test this in Task 1.
- A partial `CLINE_*` or `NINE_ROUTER_*` configuration must fail with a redacted actionable error; test this in Task 2.
- Worker results must be deduplicated and bounded without copying full files into coordinator/reviewer prompts; test this in Task 3.
- A failed worker/reviewer must produce an explicit retry or coordinator-fallback status rather than a success-shaped result; test this in Task 3 and Task 4.

---

### Task 1: Stabilizing the read-only Cline session lifecycle

**Files:**
- Modify: `tools/deepseek-mcp-worker.ts`
- Modify: `tools/deepseek-mcp.test.ts`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Preserves `runDeepSeekTask(task: string, deps?: WorkerDependencies): Promise<DeepSeekTaskResult>`.
- Preserves `WorkerSession` and `WorkerSessionOptions` test seams.
- Produces a session implementation that awaits ClineCore asynchronous completion events, awaits timeout aborts before disposal, forwards every read-only capability flag, and uses Node 22 consistently.

- [ ] **Step 1: Add failing lifecycle tests**

Add tests that:

- create a fake Cline session where `start()` has no immediate result but an `agent_event` completion arrives later, and assert the worker returns the completed text;
- make `run()` resolve while `abort()` is held pending, then assert the recorded order is `abort-resolved` before `dispose`;
- assert the exact current built-in deny list includes `read_files`, `search_codebase`, `run_commands`, `fetch_web_content`, `apply_patch`, `editor`, `skills`, `ask_question`, `submit_and_exit`, `tasks`, `spawn_agent`, and every `team_*` tool;
- assert the Cline start config forwards `enableEditing: false`, `enableCommands: false`, `enableWeb: false`, `enableSkills: false`, and `enableMcp: false`.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm run test:deepseek-mcp`

Expected: FAIL on asynchronous completion and abort/dispose ordering before implementation.

- [ ] **Step 3: Implement the lifecycle fix**

Update the ClineCore adapter to subscribe before `start()`, await the matching terminal `agent_event`/session completion when `start().result` is absent, serialize timeout handling so the timeout path awaits `abort()` before returning, and dispose only after all session work has settled. Keep error messages classified and redacted.

- [ ] **Step 4: Align runtime metadata**

Set the repository engine and CI runner to Node 22, matching `@cline/sdk`'s declared floor. Do not change unrelated application runtime behavior.

- [ ] **Step 5: Run focused verification**

Run:

```text
npm run test:deepseek-mcp
npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --strict --skipLibCheck --esModuleInterop tools/deepseek-mcp-worker.ts tools/deepseek-mcp.ts tools/deepseek-mcp.test.ts
npx eslint tools/deepseek-mcp.ts tools/deepseek-mcp-worker.ts tools/deepseek-mcp.test.ts
```

Expected: all focused tests pass and typecheck/lint exit with code 0.

- [ ] **Step 6: Commit**

```text
git add tools/deepseek-mcp-worker.ts tools/deepseek-mcp.test.ts package.json .github/workflows/ci.yml
git commit -m "fix: complete Cline worker sessions safely"
```

### Task 2: Adding validated 9router role configuration

**Files:**
- Create: `tools/nkl-router-config.ts`
- Create: `tools/nkl-router-config.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces `NklRole = "orchestrator" | "worker" | "reviewer"`.
- Produces `NklRouterConfig` with `{ cline: DeepSeekMcpConfig; router: { providerId: string; baseUrl: string; apiKey: string; models: Record<NklRole, string>; maxWorkers: 3; reviewerRequired: true; retryLimit: 1 } }`.
- Produces `loadNklRouterConfig(env: NodeJS.ProcessEnv, workspaceRoot: string): NklRouterConfig`.
- Produces `redactNklConfigError(error: unknown): Error` with no key, endpoint credential, or `.env` content.

- [ ] **Step 1: Write failing configuration tests**

Cover:

- valid `CLINE_*` plus `NINE_ROUTER_*` values load the three exact aliases and the literal `Alll` option without exposing secrets;
- missing or partial Cline configuration fails;
- missing or partial router configuration fails rather than falling back;
- empty aliases, invalid worker count overrides, and invalid retry values fail explicitly;
- `.env.example` contains only variable names and non-secret defaults.

- [ ] **Step 2: Run tests to verify RED**

Run: `npx tsx --test tools/nkl-router-config.test.ts`

Expected: FAIL because the config module does not exist.

- [ ] **Step 3: Implement `loadNklRouterConfig`**

Read only the required environment variables, use the existing Cline provider/base URL contract for the router transport, set defaults `NKL-ORQUESTRADOR`, `NKL-OPERARIOS`, `NKL-REVISOR`, `maxWorkers: 3`, `reviewerRequired: true`, and `retryLimit: 1`, and reject partial configuration without logging values.

- [ ] **Step 4: Document the non-secret environment contract**

Add the `NINE_ROUTER_*` names, role aliases, `Alll` note, and the Node 22/local-only requirement to `.env.example`. Never copy actual `.env.local` values.

- [ ] **Step 5: Run focused verification**

Run: `npx tsx --test tools/nkl-router-config.test.ts` and `npx eslint tools/nkl-router-config.ts tools/nkl-router-config.test.ts`.

Expected: all configuration tests pass and ESLint exits with code 0.

- [ ] **Step 6: Commit**

```text
git add tools/nkl-router-config.ts tools/nkl-router-config.test.ts .env.example
git commit -m "feat: add validated NKL router configuration"
```

### Task 3: Implementing bounded role fan-out and synthesis

**Files:**
- Create: `tools/nkl-router-runner.ts`
- Create: `tools/nkl-router-runner.test.ts`
- Create: `tools/nkl-subagent-orchestrator.ts`
- Create: `tools/nkl-subagent-orchestrator.test.ts`
- Modify: `tools/deepseek-mcp-worker.ts`

**Interfaces:**
- Consumes `NklRouterConfig` and the safe workspace readers from Task 1.
- Produces `runNklRoleTask(role: NklRole, prompt: string, deps?: RouterRunnerDependencies): Promise<NklRoleResult>`.
- Produces `orchestrateNklTask(task: string, deps?: OrchestratorDependencies): Promise<NklOrchestrationResult>`.
- `NklRoleResult` contains `{ role: NklRole; status: "completed" | "failed" | "aborted" | "fallback"; text: string; evidence: Array<{ path: string; lines?: string; note: string }>; uncertainty?: string; usage?: Record<string, unknown> }`.
- `NklOrchestrationResult` contains `{ status: "completed" | "incomplete" | "failed"; text: string; plan: string; workers: NklRoleResult[]; review: NklRoleResult; fallbackUsed: boolean }`.

- [ ] **Step 1: Write failing runner and orchestrator tests**

Cover:

- role selection sends exactly the configured alias and fixed workspace to a read-only Cline session;
- up to three workers run in parallel and no recursive spawn/team tool is enabled;
- duplicate worker prompts/evidence paths are deduplicated within one task;
- worker failure retries once, then returns `fallback` for coordinator handling;
- the reviewer always runs with only compact plan/results and receives no full file contents;
- no cache is consulted or written;
- all secret-like strings and blocked paths are redacted from role results;
- an unavailable reviewer marks orchestration `incomplete` rather than `completed`.

- [ ] **Step 2: Run tests to verify RED**

Run: `npx tsx --test tools/nkl-router-runner.test.ts tools/nkl-subagent-orchestrator.test.ts`

Expected: FAIL because the runner and orchestrator interfaces do not exist.

- [ ] **Step 3: Implement the role runner**

Adapt the hardened Cline session seam so each role receives one alias, fixed `cwd`, the two safe extra tools only, all built-in capabilities disabled, a bounded prompt, and the configured deadline. Never enable `spawn_agent` or `team_*`. Normalize output into `NklRoleResult` and redact recursively.

- [ ] **Step 4: Implement orchestration**

Run the Cline coordinator first, launch at most three worker tasks with `Promise.all` under the concurrency limit, retry failed roles once with another eligible helper, compact/deduplicate evidence, always call the reviewer, and let the coordinator complete any failed remainder. Mark fallback and incomplete states explicitly.

- [ ] **Step 5: Run focused verification**

Run:

```text
npx tsx --test tools/nkl-router-runner.test.ts tools/nkl-subagent-orchestrator.test.ts tools/deepseek-mcp-files.test.ts
npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --strict --skipLibCheck --esModuleInterop tools/nkl-router-config.ts tools/nkl-router-runner.ts tools/nkl-subagent-orchestrator.ts
npx eslint tools/nkl-router-config.ts tools/nkl-router-runner.ts tools/nkl-subagent-orchestrator.ts tools/nkl-router-*.test.ts
```

Expected: all focused tests pass and typecheck/lint exit with code 0.

- [ ] **Step 6: Commit**

```text
git add tools/nkl-router-runner.ts tools/nkl-router-runner.test.ts tools/nkl-subagent-orchestrator.ts tools/nkl-subagent-orchestrator.test.ts tools/deepseek-mcp-worker.ts
git commit -m "feat: orchestrate read-only NKL router agents"
```

### Task 4: Wiring the MCP tool and local commands

**Files:**
- Modify: `tools/deepseek-mcp.ts`
- Modify: `tools/deepseek-mcp.test.ts`
- Modify: `package.json`

**Interfaces:**
- Preserves MCP tool `delegate_to_deepseek({ task: string }): CallToolResult`.
- Routes the tool through `orchestrateNklTask` in combined mode.
- Preserves structured status/error mapping and serialized request handling.

- [ ] **Step 1: Add failing MCP integration tests**

Cover:

- valid tasks route to the orchestrator and return compact `structuredContent`;
- empty/malformed tasks return valid MCP input errors;
- incomplete/fallback orchestration returns `isError: true` or an explicit incomplete status;
- startup rejects partial combined configuration with a safe actionable stderr message;
- stdout remains empty before MCP transport negotiation and no secret appears in any result;
- requests remain serialized.

- [ ] **Step 2: Run tests to verify RED**

Run: `npm run test:deepseek-mcp`

Expected: FAIL until the MCP handler uses the combined orchestrator.

- [ ] **Step 3: Wire `delegate_to_deepseek`**

Load `NklRouterConfig`, call `orchestrateNklTask`, map all result statuses to `CallToolResult`, keep diagnostics on stderr only, and preserve the fixed workspace and read-only policies. Do not add an HTTP listener.

- [ ] **Step 4: Add local commands**

Keep `"deepseek:mcp": "tsx tools/deepseek-mcp.ts"` and add a focused combined command if useful without changing the portal bundle. Keep test scripts deterministic and provider-free.

- [ ] **Step 5: Run focused verification**

Run: `npm run test:deepseek-mcp`, focused TypeScript, focused ESLint, and `git diff --check`.

Expected: all worker, router, orchestrator, MCP, redaction, and lifecycle tests pass.

- [ ] **Step 6: Commit**

```text
git add tools/deepseek-mcp.ts tools/deepseek-mcp.test.ts package.json
git commit -m "feat: wire NKL router network into MCP"
```

### Task 5: Documenting setup and completing validation

**Files:**
- Create or modify: `docs/setup.md`
- Create or modify: `docs/architecture.md`
- Modify: `.env.example`
- Modify: `docs/superpowers/sdd/2026-11-10-cline-deepseek-mcp/progress.md`

**Interfaces:**
- Documents local-only setup, environment names, aliases, permissions, retry/fallback behavior, and diagnostic commands without secrets.
- Produces a final validation record for the isolated worktree.

- [ ] **Step 1: Document the operational contract**

Explain that Cline coordinates, the 9router aliases assist, `Alll` is literal, the limit is three workers, review is mandatory, no edits/shell/web/MCP are allowed, partial configuration fails, and no cache is used.

- [ ] **Step 2: Add a non-secret registration example**

Show how a local MCP host launches `npm run deepseek:mcp` via stdio with the repository working directory. Do not include an API key value or `.env.local` content.

- [ ] **Step 3: Run the complete validation**

Run:

```text
npm run test:deepseek-mcp
npm run typecheck
npm run lint
npm run verify
```

If repository-wide portal diagnostics remain, record them as pre-existing only when the changed worker/router files remain clean. Do not run live provider calls or deploy the worker.

- [ ] **Step 4: Check for secret leakage and unsafe artifacts**

Inspect the diff and tracked files for key-like values, `.env.local` content, blocked paths, HTTP listener creation, and accidental imports into `src/`. Remove only task-generated temporary artifacts.

- [ ] **Step 5: Commit documentation and validation record**

```text
git add docs/setup.md docs/architecture.md .env.example .superpowers/sdd/2026-11-10-cline-deepseek-mcp/progress.md
git commit -m "docs: document NKL subagent router network"
```
