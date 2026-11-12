# Guest Checkout and Authentication Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow visitors to purchase and access approved guide materials without logging in, while stabilizing `/login`, preserving the existing authenticated flow, and selectively incorporating today's growth work.

**Architecture:** Add a guest-access domain around hashed, expiring checkout access tokens. Stripe remains the payment authority; webhook approval is required before any download. Authenticated users keep the existing profile path, while guest checkout collects its own name, email, CPF, consent version, and access identity. Fix the global tutorial event guard separately, then merge only non-overlapping growth commits after an inventory and focused validation.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Drizzle ORM/PostgreSQL, Supabase Auth, Stripe Checkout/Webhooks, Zod, Node crypto, existing PDF/XLSX personalization libraries.

**Spec:** `docs/superpowers/specs/2026-11-11-guest-checkout-and-auth-stabilization-design.md`

## Global Constraints

- Visitors must be able to buy the one-time guide and subscription without logging in.
- The checkout must collect name, email, CPF, and CPF-purpose consent for guests.
- Authenticated profile name and email remain the trusted defaults for logged-in users, but a logged-in user may buy as a guest with a different email.
- Guest access uses a one-time success URL token converted to an HttpOnly cookie; recovery uses a new email link to the purchase email.
- CPF is persisted encrypted, never exposed in URLs, analytics, Stripe metadata, or logs.
- Downloads allow two attempts per material with no time limit; concurrent updates are atomic.
- Subscription materials are available only while the subscription status is active.
- Stripe webhooks, not browser redirects, approve purchases and subscriptions.
- No remote migration, Supabase configuration, production deployment, or destructive worktree reset is allowed without explicit approval.
- Preserve existing Stripe dynamic payment methods, including Pix when enabled in the Stripe environment.
- Preserve the current authenticated purchase flow and the existing guide personalization behavior.

## Review Focus

- Missing, malformed, expired, replayed, or cross-order guest tokens must return a generic access error and never reveal whether another order exists. Test in Task 2 and Task 5.
- A logged-in user who enters a different guest email must not have the order silently bound to the session user. Test in Task 3.
- Webhook approval and success-page polling must be idempotent and must not grant access before Stripe approval. Test in Task 4.
- Concurrent downloads must consume at most two attempts per asset, including when both requests start at the same time. Test in Task 5.
- Missing database, unavailable OAuth, unavailable tutorial target, and absent event detail must leave `/login` usable and avoid a client crash. Test in Task 1 and Task 6.

---

### Task 1: Stabilize login rendering and global tutorial events

**Files:**
- Modify: `src/components/ui/spotlight-tutorial.tsx`
- Modify: `src/components/site-guidance.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/lib/auth/profile-sync.ts`
- Test: `src/lib/__tests__/tutorial-areas.test.ts`
- Test: `e2e/critical-path.spec.ts`

**Interfaces:**
- Consumes: existing `OpenTutorialEvent`, `getTutorialRoute`, `syncAuthenticatedProfile`, and login page props.
- Produces: `openTutorial(event?: OpenTutorialEvent)` that safely handles absent `event.detail`; profile-sync errors remain represented as typed results and do not throw during login page rendering.

- [ ] **Step 1: Write the failing regression tests**

Add a unit assertion that an open-tutorial event without `detail` does not throw and an E2E assertion that `/login` renders its email field and submit controls after a fresh navigation.

- [ ] **Step 2: Run the focused tests and verify the failure**

Run: `node --import tsx --test src/lib/__tests__/tutorial-areas.test.ts` and `npx playwright test e2e/critical-path.spec.ts -g "login|cadastro"`

Expected: the tutorial regression reproduces the `Cannot read properties of undefined (reading 'area')` failure or the new login assertion fails before the fix.

- [ ] **Step 3: Implement the guards**

In `spotlight-tutorial.tsx`, normalize `event?.detail` before reading `area` and return when no route has visible steps. Keep the existing area filtering and local-storage behavior. Ensure login rendering does not eagerly require a profile query or an unavailable OAuth provider.

- [ ] **Step 4: Run focused tests**

Run the commands from Step 2.

Expected: all focused tests pass and no browser runtime error is reported for `/login`.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/spotlight-tutorial.tsx src/components/site-guidance.tsx src/app/login/page.tsx src/lib/auth/profile-sync.ts src/lib/__tests__/tutorial-areas.test.ts e2e/critical-path.spec.ts
git commit -m "fix: stabilize login and tutorial rendering"
```

### Task 2: Add guest checkout identity and secure access-token primitives

**Files:**
- Create: `src/lib/guest-checkout.ts`
- Create: `src/lib/__tests__/guest-checkout.test.ts`
- Modify: `src/db/schema.ts`
- Create: `drizzle/0038_guest_checkout_access.sql`

**Interfaces:**
- Consumes: `PersonalizationIdentity`, existing guide purchase/subscription models, and Node `crypto`.
- Produces:
  - `type GuestCheckoutInput = { fullName: string; email: string; cpf: string; cpfConsentConfirmed: true; consentVersion: string }`
  - `function createGuestAccessToken(): { token: string; tokenHash: string; expiresAt: Date }`
  - `function hashGuestAccessToken(token: string): string`
  - `function isGuestAccessTokenValid(expiresAt: Date, now?: Date): boolean`
  - `function encryptGuestCpf(cpf: string): string`
  - `function decryptGuestCpf(value: string): string`
  - `function normalizeGuestCheckoutInput(input: unknown): GuestCheckoutInput`

- [ ] **Step 1: Write failing unit tests**

Test valid/invalid guest input, token hash non-reversibility, token expiry, CPF encryption/decryption, and rejection of missing consent or malformed email.

- [ ] **Step 2: Run the tests and verify failure**

Run: `node --import tsx --test src/lib/__tests__/guest-checkout.test.ts`

Expected: FAIL because the guest checkout module and schema fields do not exist.

- [ ] **Step 3: Implement the primitives and additive schema**

Add guest identity/access fields to `guide_purchases` and `guide_subscriptions`: encrypted CPF, guest name/email, token hash, token expiry, token consumption metadata, and versioned consent timestamp/version. Preserve nullable `userId`. Add `0038_guest_checkout_access.sql` as an additive migration only. Use an environment-backed encryption key and fail explicitly when encryption is requested without the key; never print the key or plaintext CPF.

- [ ] **Step 4: Run focused tests**

Run: `node --import tsx --test src/lib/__tests__/guest-checkout.test.ts`.

Expected: PASS with coverage for invalid input, expiry, encryption round-trip, and consent.

- [ ] **Step 5: Commit**

```bash
git add src/lib/guest-checkout.ts src/lib/__tests__/guest-checkout.test.ts src/db/schema.ts drizzle/0038_guest_checkout_access.sql
git commit -m "feat: add secure guest checkout access primitives"
```

### Task 3: Collect guest data and create Stripe checkout sessions

**Files:**
- Modify: `src/components/sales/guide-checkout-button.tsx`
- Modify: `src/components/sales/guide-subscription-button.tsx`
- Modify: `src/app/api/payments/create-guide-checkout/route.ts`
- Modify: `src/app/api/payments/create-guide-subscription/route.ts`
- Modify: `src/lib/stripe/guide.ts`
- Test: `src/lib/stripe/guide.test.ts`
- Test: `e2e/guide-offer.spec.ts`

**Interfaces:**
- Consumes: `normalizeGuestCheckoutInput`, encrypted CPF/token fields from Task 2, and existing `createCheckoutSession`.
- Produces: both payment routes accept a validated `fullName`, `email`, `cpf`, consent, and optional session; they create pending rows with `userId` only when the submitted guest email is not being used as a separate guest order. The returned payload remains `{ checkoutUrl: string }` and carries only an opaque internal reference plus a one-time access handoff mechanism, never CPF.

- [ ] **Step 1: Write failing E2E and route-contract tests**

Cover anonymous purchase and subscription submission with name/email/CPF/consent, authenticated user plus different guest email, invalid consent, invalid CPF, and absence of an authentication-required response.

- [ ] **Step 2: Run the tests and verify failure**

Run: `npx playwright test e2e/guide-offer.spec.ts -g "convidado|login|assinatura"` and the focused Stripe tests.

Expected: anonymous submissions still receive `401 authentication_required` or the UI lacks the guest fields.

- [ ] **Step 3: Implement guest checkout forms and route validation**

Add the guest fields to both buttons, prefill name/email only when available from the client session context without treating them as trusted, and send them to the server. Validate all values server-side with the Task 2 helper. Store encrypted CPF and consent evidence. For an authenticated user whose checkout email differs from the session email, keep `userId` null and create a guest order. Keep internal Stripe metadata limited to `guide_purchase:<id>` or `guide_subscription:<id>` and offer variant.

- [ ] **Step 4: Add checkout access handoff**

Generate and persist the hashed guest token and expiry. Configure the success return to carry only the opaque token handoff; do not put CPF or guest identity in the URL or Stripe metadata. Keep cancel URLs free of sensitive data.

- [ ] **Step 5: Run focused tests**

Run the E2E and Stripe test commands from Steps 1–2.

Expected: anonymous checkout reaches Stripe setup, invalid data is rejected with explicit messages, and no response contains CPF or requires login.

- [ ] **Step 6: Commit**

```bash
git add src/components/sales/guide-checkout-button.tsx src/components/sales/guide-subscription-button.tsx src/app/api/payments/create-guide-checkout/route.ts src/app/api/payments/create-guide-subscription/route.ts src/lib/stripe/guide.ts src/lib/stripe/guide.test.ts e2e/guide-offer.spec.ts
git commit -m "feat: allow guest guide checkout"
```

### Task 4: Approve guest orders through Stripe webhook and poll success

**Files:**
- Modify: `src/lib/stripe/webhook.ts`
- Modify: `src/app/guias/renda-extra/sucesso/page.tsx`
- Create: `src/app/api/payments/guide-status/route.ts`
- Test: `src/lib/stripe/webhook.test.ts`
- Test: `e2e/guide-offer.spec.ts`

**Interfaces:**
- Consumes: opaque guide references from existing Stripe metadata and guest order rows from Task 3.
- Produces:
  - `GET /api/payments/guide-status?reference=<opaque-id>` returns `{ status: 'pending' | 'approved' | 'active' | 'rejected' }` without exposing CPF or raw database fields.
  - Webhook processing remains idempotent through `stripeWebhookEvents`; approved rows retain their guest access token hash and become downloadable.

- [ ] **Step 1: Write failing webhook/status tests**

Test idempotent `checkout.session.completed`, guest purchase approval, active subscription approval, rejected/canceled access, and status responses that do not disclose another order.

- [ ] **Step 2: Run tests and verify failure**

Run: `node --import tsx --test src/lib/stripe/webhook.test.ts` and the focused success-page E2E.

Expected: guest rows are not approved or status endpoint is missing.

- [ ] **Step 3: Implement webhook handling**

Update guide purchase/subscription processing to preserve encrypted guest data, set payment identifiers, and apply active-only subscription access. Handle refund/dispute/cancellation events using the existing Stripe event routing and do not grant access from the browser return.

- [ ] **Step 4: Implement status polling**

Create the status endpoint with strict opaque reference validation and ownership through the guest token cookie or authenticated session. Update the success page to show pending state and poll for a bounded interval, then display recovery-by-email guidance without leaking order existence.

- [ ] **Step 5: Run focused tests**

Run the unit and E2E commands from Step 2.

Expected: status transitions are correct, webhook replay is harmless, and pending checkout becomes downloadable only after approval.

- [ ] **Step 6: Commit**

```bash
git add src/lib/stripe/webhook.ts src/app/guias/renda-extra/sucesso/page.tsx src/app/api/payments/guide-status/route.ts src/lib/stripe/webhook.test.ts e2e/guide-offer.spec.ts
git commit -m "feat: reconcile guest guide access with Stripe"
```

### Task 5: Deliver personalized guest downloads and email recovery

**Files:**
- Modify: `src/app/api/downloads/guide/route.ts`
- Modify: `src/components/sales/guide-asset-downloads.tsx`
- Create: `src/app/api/payments/guide-access/recover/route.ts`
- Modify: `src/lib/guide-personalizer.ts`
- Test: `src/lib/__tests__/guest-guide-access.test.ts`
- Test: `e2e/guide-lead-delivery.spec.ts` or a new `e2e/guest-guide-download.spec.ts`

**Interfaces:**
- Consumes: approved guest order, cookie/token from Tasks 2–4, existing `personalizeGuideAsset`, and existing encrypted CPF.
- Produces:
  - `POST /api/downloads/guide` accepts `{ assetId }` with either authenticated ownership or valid guest cookie/token.
  - `POST /api/payments/guide-access/recover` accepts `{ email }` and sends a new single-use link without revealing whether the email has an order.
  - Successful download returns the existing binary response and `X-Downloads-Remaining`; quota is two attempts per material, atomically enforced.

- [ ] **Step 1: Write failing access and concurrency tests**

Cover valid guest token, missing token, expired token, wrong token, approved vs pending order, two successful attempts for one asset, third rejection, and concurrent requests where only two can increment the asset quota.

- [ ] **Step 2: Run tests and verify failure**

Run: `node --import tsx --test src/lib/__tests__/guest-guide-access.test.ts` and the focused guest-download E2E.

Expected: the download route currently requires Supabase authentication and cannot authorize a guest token.

- [ ] **Step 3: Implement guest authorization**

Resolve access from an HttpOnly cookie or one-time success token, compare hashes in constant time, verify expiry/status, decrypt CPF only in memory, and reuse the existing personalization pipeline. Keep CPF out of logs, response headers, URLs, analytics, and error messages.

- [ ] **Step 4: Enforce per-asset quota atomically**

Replace the current global counter condition for guest access with a per-asset attempt record or equivalent atomic table keyed by order/access and asset ID. Preserve authenticated legacy access behavior during the transition and ensure personalization failures do not consume quota.

- [ ] **Step 5: Implement recovery email flow**

Create a generic response for all email inputs, generate a fresh hashed token, send only the opaque recovery link through the existing email provider, and preserve the same approval/status checks when the link is opened.

- [ ] **Step 6: Run focused tests**

Run the unit and E2E commands from Step 2.

Expected: guest downloads succeed only with approved valid access, limits are per asset, recovery does not enumerate orders, and personalized files are returned.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/downloads/guide/route.ts src/components/sales/guide-asset-downloads.tsx src/app/api/payments/guide-access/recover/route.ts src/lib/guide-personalizer.ts src/lib/__tests__/guest-guide-access.test.ts e2e/guest-guide-download.spec.ts
git commit -m "feat: deliver personalized guides to guests"
```

### Task 6: Selectively merge today's growth work

**Files:**
- Modify: files selected after inventory; expected candidates include `src/app/anuncie/page.tsx`, `src/app/mural-de-parceiros/page.tsx`, `src/components/ads/*`, `src/lib/guide-lead-delivery.ts`, `src/app/api/downloads/guide-lead/route.ts`, and related tests/docs.
- Test: existing growth unit/E2E suites and `git diff --check`.

**Interfaces:**
- Consumes: commits from branch `nkl-growth-pdf` that are not already represented in `master`.
- Produces: growth features present in `master` without reverting current Stripe, auth, notification, tutorial, or guest-checkout changes.

- [ ] **Step 1: Inventory overlap before applying anything**

Run:

```bash
git log --oneline master..nkl-growth-pdf
git diff --name-status master...nkl-growth-pdf
git diff --name-only master -- src/app src/components src/lib src/db docs e2e
```

Record which commits are already functionally present and which files overlap current uncommitted changes. Do not use `git merge`, `git reset`, or `git checkout` to overwrite the worktree.

- [ ] **Step 2: Apply only non-overlapping commits or patches**

Use `git cherry-pick --no-commit <commit>` only for a commit proven non-overlapping, or manually apply a narrow patch. Abort and restore the cherry-pick if conflicts would touch unrelated user changes. Preserve the existing guest checkout interfaces.

- [ ] **Step 3: Run growth-focused tests**

Run the existing relevant tests for guide leads, income wizard, ad previews, catalog, and SEO. Expected: all pass with no guest checkout regressions.

- [ ] **Step 4: Commit the selective integration**

```bash
git add <only-selected-growth-files>
git commit -m "merge: integrate today's growth improvements safely"
```

### Task 7: Document operations and validate the complete product

**Files:**
- Modify: `docs/setup.md`
- Modify: `docs/architecture.md`
- Modify: `docs/quality.md`
- Modify: `src/env.ts`
- Modify: `.env.example`
- Test: all focused unit tests, `npm run verify`, `npm run test:e2e`

**Interfaces:**
- Consumes: finalized guest token/encryption/email environment names and migration `0038`.
- Produces: explicit local setup checklist, production migration checklist, guest recovery behavior, privacy retention notes, and known baseline warnings.

- [ ] **Step 1: Document required environment and manual steps**

Document the guest CPF encryption key, email provider, token recovery URL, Stripe webhook events, migration order, and the fact that no remote migration or deploy has been performed.

- [ ] **Step 2: Run all focused tests**

Run:

```bash
node --import tsx --test src/lib/auth/__tests__/return-intent.test.ts src/lib/__tests__/tutorial-areas.test.ts src/lib/__tests__/guest-checkout.test.ts src/lib/__tests__/guest-guide-access.test.ts src/lib/stripe/*.test.ts
```

Expected: all relevant unit tests pass.

- [ ] **Step 3: Run the project gates**

Run: `npm run verify`

Expected: lint has no new errors, typecheck passes, and production build completes with only documented baseline warnings.

- [ ] **Step 4: Run the complete browser suite**

Run: `npm run test:e2e`

Expected: existing critical paths, guest checkout, authenticated checkout, login, tutorial, growth, and SEO tests pass.

- [ ] **Step 5: Review for secrets and unintended changes**

Run: `git diff --check`, inspect `git status --short`, and verify no CPF, token, encryption key, or provider secret appears in tracked files, logs, URLs, metadata, or screenshots.

- [ ] **Step 6: Commit documentation and validation updates**

```bash
git add docs/setup.md docs/architecture.md docs/quality.md src/env.ts .env.example
git commit -m "docs: record guest checkout and recovery operations"
```

## Handoff

After approval, execute the plan in the current `master` worktree without deleting
or reverting unrelated local changes. Apply no remote migration, provider
configuration, or deployment until the user explicitly approves those actions.
