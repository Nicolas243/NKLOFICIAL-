# Cline DeepSeek MCP Worker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local, read-only MCP worker that delegates focused repository analysis to the DeepSeek model configured through the existing Cline environment variables.

**Architecture:** A stdio MCP server will expose one `delegate_to_deepseek` tool. Each request creates a local `ClineCore` session configured with the Cline provider, a fixed repository root, and only two custom safe file-reading tools; built-in editing, command, web, spawn, team, skill, and MCP tools remain unavailable.

**Tech Stack:** Node.js 22+, TypeScript, `tsx`, `@cline/sdk`, official `@modelcontextprotocol/sdk`, existing `dotenv`, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-10-cline-deepseek-mcp-design.md`

## Global Constraints

- The worker is local-only and uses MCP stdio; it must not open a network listener.
- The worker is permanently bound to the current repository root and must reject arbitrary caller-supplied workspaces.
- The first version is read-only: no file writes, shell commands, tests, deploys, migrations, web fetches, skills, spawn, teams, or configured MCP tools.
- `CLINE_API_KEY` and `CLINE_MODEL_ID` are required; `CLINE_BASE_URL` is required only for `openai-compatible`; `CLINE_PROVIDER_ID` defaults to `openai-compatible`.
- Never print, return, log, commit, or send `.env*`, credentials, certificates, `.git`, `node_modules`, `.next`, or `supabase/.temp/**` contents.
- MCP stdout must contain only protocol output; diagnostics must go to stderr.
- Every ClineCore session must be disposed in `finally`, and request deadlines must abort the active session.
- The worker must fail explicitly on missing configuration, invalid paths, malformed MCP input, timeouts, and provider failures.

## Review Focus

- Missing `CLINE_MODEL_ID` or provider-specific base URL: configuration fails with a redacted actionable error.
- Absolute paths, `..` traversal, symlink escapes, and blocked filenames: safe file tools reject them before reading.
- Large files or oversized directory listings: tools enforce bounded output rather than flooding the model.
- MCP protocol errors or provider failures: the server returns valid structured tool errors without corrupting stdout.
- Cancellation, timeout, and repeated requests: sessions are aborted/disposed and requests are serialized without leaked state.

---

### Task 1: Creating safe DeepSeek configuration and workspace readers

**Files:**
- Create: `tools/deepseek-mcp-config.ts`
- Create: `tools/deepseek-mcp-files.ts`
- Create: `tools/deepseek-mcp-files.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces `DeepSeekMcpConfig` with `{ workspaceRoot: string; providerId: string; modelId: string; apiKey: string; baseUrl?: string }`.
- Produces `loadDeepSeekMcpConfig(env: NodeJS.ProcessEnv, workspaceRoot: string): DeepSeekMcpConfig`, throwing redacted configuration errors.
- Produces `resolveReadableWorkspacePath(workspaceRoot: string, relativePath: string): Promise<string>`, rejecting absolute paths, traversal, symlink escape, and blocked paths.
- Produces `listWorkspaceFiles(input: { path?: string; maxEntries?: number }): Promise<{ files: string[]; truncated: boolean }>` and `readWorkspaceFile(input: { path: string; maxBytes?: number }): Promise<{ path: string; content: string; truncated: boolean }>` for allowed relative paths only.

- [ ] **Step 1: Write failing unit tests**

Cover:
- valid Cline variables produce a config without exposing the key in thrown messages;
- missing `CLINE_API_KEY` and `CLINE_MODEL_ID` fail explicitly;
- `CLINE_PROVIDER_ID` defaults to `openai-compatible`;
- a relative source path can be listed/read;
- absolute paths, `../` traversal, symlink escapes, `.env.local`, `.git`, `node_modules`, `.next`, and `supabase/.temp` are rejected;
- file and directory output limits set `truncated: true`.

- [ ] **Step 2: Run the tests and verify RED**

Run: `npx tsx --test tools/deepseek-mcp-files.test.ts`

Expected: FAIL because the configuration and reader interfaces do not exist.

- [ ] **Step 3: Implement configuration and safe readers**

Parse only the needed `CLINE_*` values from the supplied environment, canonicalize the fixed root with `realpath`, validate symlink containment, deny sensitive paths, and apply bounded UTF-8 reads/listings. Do not log environment values.

- [ ] **Step 4: Add the non-secret environment contract**

Document `CLINE_PROVIDER_ID`, `CLINE_MODEL_ID`, and the existing `CLINE_API_KEY`/`CLINE_BASE_URL` in `.env.example`; do not modify `.env.local`.

- [ ] **Step 5: Run the tests and verify GREEN**

Run: `npx tsx --test tools/deepseek-mcp-files.test.ts`

Expected: all safe-reader and configuration tests pass.

- [ ] **Step 6: Commit**

```bash
git add tools/deepseek-mcp-config.ts tools/deepseek-mcp-files.ts tools/deepseek-mcp-files.test.ts .env.example
git commit -m "feat: add safe DeepSeek workspace readers"
```

### Task 2: Creating the read-only Cline MCP server

**Files:**
- Create: `tools/deepseek-mcp.ts`
- Create: `tools/deepseek-mcp-worker.ts`
- Create: `tools/deepseek-mcp.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes `DeepSeekMcpConfig`, `listWorkspaceFiles`, and `readWorkspaceFile` from Task 1.
- Produces an MCP stdio server with tool `delegate_to_deepseek({ task: string }): CallToolResult`.
- Produces `runDeepSeekTask(task: string, deps?: WorkerDependencies): Promise<DeepSeekTaskResult>` where the result contains `{ status: "completed" | "failed" | "aborted"; text: string; finishReason?: string; usage?: Record<string, unknown> }`.

- [ ] **Step 1: Write failing tests**

Cover:
- the MCP tool schema requires a non-empty task;
- successful worker results map Cline text/status/usage into `content` and `structuredContent`;
- provider failures and timeouts return valid structured error results;
- the worker configures `ClineCore` with `backendMode: "local"`, fixed `cwd`, `enableSpawnAgent: false`, `enableAgentTeams: false`, and only the two safe `extraTools`;
- built-in editing, command, web, skills, spawn, team, and MCP tools are disabled;
- `dispose()` is called after completion and after failure;
- no API key or `.env` content appears in stdout, stderr, or tool results.

- [ ] **Step 2: Run the tests and verify RED**

Run: `npx tsx --test tools/deepseek-mcp.test.ts`

Expected: FAIL because the MCP server and worker interfaces do not exist.

- [ ] **Step 3: Install the worker dependencies**

Run: `npm install @cline/sdk @modelcontextprotocol/sdk`

Keep the dependencies available to the local worker and do not import them from `src/` or the Next.js application bundle.

- [ ] **Step 4: Implement `runDeepSeekTask`**

Create one local `ClineCore` session per request, pass the fixed workspace and provider configuration, register only the safe readers through `extraTools`, apply the disabled-tool policies, abort on the request deadline, map the Cline result to the declared result type, and dispose in `finally`.

- [ ] **Step 5: Implement the stdio MCP entrypoint**

Create `McpServer` with the `delegate_to_deepseek` tool and `StdioServerTransport`. Serialize requests, validate the task, emit only MCP responses on stdout, write diagnostics to stderr, and keep the process free of HTTP listeners.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `npx tsx --test tools/deepseek-mcp.test.ts tools/deepseek-mcp-files.test.ts`

Expected: all worker, MCP mapping, cleanup, and security tests pass without live provider calls.

- [ ] **Step 7: Add the local command**

Add `"deepseek:mcp": "tsx tools/deepseek-mcp.ts"` and `"test:deepseek-mcp": "tsx --test tools/deepseek-mcp.test.ts tools/deepseek-mcp-files.test.ts"` to `package.json`.

- [ ] **Step 8: Commit**

```bash
git add tools/deepseek-mcp.ts tools/deepseek-mcp-worker.ts tools/deepseek-mcp.test.ts package.json package-lock.json
git commit -m "feat: expose DeepSeek as a read-only MCP worker"
```

### Task 3: Documenting setup and validating the integration

**Files:**
- Modify: `docs/setup.md`
- Modify: `docs/quality.md`
- Modify: `docs/architecture.md`
- Create: `tools/deepseek-mcp-config.example.json`

**Interfaces:**
- Consumes the `deepseek:mcp` command and `delegate_to_deepseek` tool from Task 2.
- Produces redacted setup instructions for Cline MCP registration, environment requirements, read-only boundaries, and a safe smoke-test prompt.

- [ ] **Step 1: Write the local setup documentation**

Document Node.js 22+, the required non-secret variable names, how to set the exact DeepSeek model ID, the stdio command, the fixed workspace boundary, and a smoke test that asks for a file summary without requesting secrets or modifications.

- [ ] **Step 2: Add a non-secret MCP registration example**

Create `tools/deepseek-mcp-config.example.json` containing only the command/arguments needed to launch the worker; use the repository-relative command and no environment values or credentials.

- [ ] **Step 3: Run the complete worker validation**

Run: `npm run test:deepseek-mcp`

Expected: all worker tests pass.

- [ ] **Step 4: Run repository quality gates**

Run: `npm run lint`, `npm run typecheck`, and `npm run verify`

Expected: no new errors; only the documented legacy warnings/build warnings may remain.

- [ ] **Step 5: Perform a redacted smoke check**

Run the MCP command with a deliberately missing `CLINE_MODEL_ID` in a subprocess and verify it exits with an actionable redacted error. If the user has configured the model ID, run one read-only task and verify the result plus absence of secrets in captured output; never print the key.

- [ ] **Step 6: Commit documentation**

```bash
git add docs/setup.md docs/quality.md docs/architecture.md tools/deepseek-mcp-config.example.json
git commit -m "docs: document DeepSeek MCP worker setup"
```
