# Login and Profile Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make authentication failures diagnosable and ensure successful OAuth users receive a correctly linked profile with their provider name.

**Architecture:** Extract profile upsert and authentication-error mapping into small server-side helpers. Reuse the same profile invariant for password login, registration, and the OAuth callback; never overwrite an already completed profile name with empty provider metadata.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase SSR, Drizzle ORM, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-10-login-profile-recovery-design.md`

## Global Constraints

- Never expose OAuth secrets or database credentials.
- Preserve `user_profiles.id = auth.users.id`.
- Do not delete users, reset passwords, or alter existing profile data.
- OAuth provider credentials remain configured in Supabase, outside this code change.
- Keep the existing `/perfil` route and header behavior.

## Review Focus

- Wrong password or unknown e-mail: show a useful generic credential message without leaking account existence.
- Unconfirmed e-mail: explain that confirmation is required instead of reporting invalid credentials.
- OAuth callback without a code or with an exchange failure: return the existing safe login error.
- OAuth user with no name metadata: keep the profile valid and use a non-empty fallback only where needed.
- Existing profile with a manually edited name: do not overwrite it during a later login.

---

### Task 1: Authentication helper behavior

**Files:**
- Create: `src/lib/auth/profile.ts`
- Create: `src/lib/auth/errors.ts`
- Test: `src/lib/auth/__tests__/errors.test.ts`

**Interfaces:**
- Produces `upsertAuthenticatedProfile(user: User, options?: { role?: string }): Promise<void>`.
- Produces `getLoginErrorMessage(error: { message?: string; status?: number } | null): string`.

- [ ] **Step 1: Write failing tests** for the error mapper covering invalid credentials, unconfirmed e-mail, rate limiting, and an unknown error; assert the exact user-facing messages and that unknown details are not returned.
- [ ] **Step 2: Run the focused test** with `node --test src/lib/auth/__tests__/errors.test.ts`; confirm it fails because the helper does not exist.
- [ ] **Step 3: Implement the error mapper** in `src/lib/auth/errors.ts` with stable message matching and a generic fallback.
- [ ] **Step 4: Implement the profile upsert helper** in `src/lib/auth/profile.ts`, preserving an existing non-empty `fullName` while using `user.user_metadata.full_name` or `user.user_metadata.name` for a new/empty profile.
- [ ] **Step 5: Run the focused test** and confirm it passes.

### Task 2: Password authentication integration

**Files:**
- Modify: `src/actions/auth.ts`
- Test: `src/lib/auth/__tests__/errors.test.ts`

**Interfaces:**
- Consumes `getLoginErrorMessage` and `upsertAuthenticatedProfile` from Task 1.

- [ ] **Step 1: Add a failing integration-level assertion** for the login action's error translation boundary, using the existing Supabase action seam rather than asserting implementation details.
- [ ] **Step 2: Run the focused test** and confirm the current action still returns `Credenciais inválidas` for every failure.
- [ ] **Step 3: Replace the broad login error message** with `getLoginErrorMessage(error)` while retaining the existing redirect contract and call `upsertAuthenticatedProfile` after successful authentication.
- [ ] **Step 4: Run the focused auth tests** and confirm they pass.

### Task 3: OAuth callback profile synchronization

**Files:**
- Modify: `src/app/auth/callback/route.ts`
- Test: `src/app/auth/callback/route.test.ts`

**Interfaces:**
- Consumes `upsertAuthenticatedProfile` from Task 1.
- Preserves redirect responses to `/login?error=oauth_callback_invalid`, `/login?error=oauth_callback_failed`, or the safe `next` path.

- [ ] **Step 1: Write failing callback tests** for missing code, exchange failure, and successful exchange followed by profile synchronization.
- [ ] **Step 2: Run the callback tests** and confirm the success case fails because no profile synchronization occurs.
- [ ] **Step 3: After `exchangeCodeForSession`, call `getUser`, verify an authenticated user exists, and upsert the profile using provider metadata without replacing an existing custom name.
- [ ] **Step 4: Preserve safe `next` handling and return a login error when the exchanged session has no user.
- [ ] **Step 5: Run the callback tests** and confirm they pass.

### Task 4: Verification and documentation

**Files:**
- Modify: `docs/setup.md` only if the final OAuth callback setup instructions need correction.

- [ ] **Step 1: Run `npm run lint` and fix only errors caused by this change.
- [ ] **Step 2: Run `npm run typecheck` and fix only type errors caused by this change.
- [ ] **Step 3: Run `npm run verify` and record any pre-existing failures without masking them.
- [ ] **Step 4: Manually verify the production flow after Supabase OAuth credentials are configured: password login, Google callback, `/perfil`, and header label.

