# Stripe-only payments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Mercado Pago with Stripe Checkout as the only active payment gateway for every paid flow in Portal NKL.

**Architecture:** Add a server-only Stripe client, shared Checkout-session helpers, and a signed/idempotent Stripe webhook route. Keep existing domain tables and success/access behavior, storing Stripe identifiers through the existing gateway fields unless a focused additive migration is required.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Drizzle/Postgres, Supabase Auth, Stripe Node SDK, Stripe CLI.

**Spec:** `docs/superpowers/specs/2026-11-11-stripe-only-payments-design.md`

## Global Constraints

- Stripe Checkout hosted pages are the selected payment UX.
- Mercado Pago is removed from active new-payment flows but historical records are preserved.
- Webhooks must validate the Stripe signature before database writes.
- Stripe secrets come from `.env.local`/deployment environment and are never printed or committed.
- Existing BRL constants remain the source of truth for Guide and subscription amounts.
- Do not apply remote migrations, deploy, or mutate production data without explicit approval.
- Preserve existing success pages, download authorization, subscription status, booking access, and offer attribution.

## Review Focus

- Missing or malformed Stripe environment variables must fail clearly during configuration, not create a success-shaped checkout.
- Checkout requests with forged price, user, booking, or metadata must use server-loaded domain values and reject unauthorized ownership.
- Duplicate webhook delivery must not duplicate purchases, subscriptions, booking access, or offer conversions.
- Invalid webhook signatures and malformed event payloads must be rejected before writes.
- Canceled, expired, unpaid, and payment-failed subscription events must revoke or preserve access according to the existing status model.

---

### Task 1: Configure Stripe SDK and environment contract

**Files:**
- Modify: `package.json`
- Modify: `src/env.ts`
- Create: `src/lib/stripe/server.ts`
- Create: `src/lib/stripe/checkout.ts`
- Test: `src/lib/stripe/checkout.test.ts` or the repository's existing focused test location

**Interfaces:**
- Produces `stripe: Stripe` from `src/lib/stripe/server.ts`, initialized with `STRIPE_SECRET_KEY`.
- Produces `createCheckoutSession(params: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session>` from `src/lib/stripe/checkout.ts`.
- `CreateCheckoutSessionParams` includes `mode`, `lineItems`, `metadata`, `successUrl`, `cancelUrl`, and optional `customerEmail`.

- [ ] **Step 1: Add the Stripe dependency and environment keys**

Add the Stripe Node SDK through the package manager and extend `src/env.ts` with required `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` only where the client needs it. Keep secret values out of source control.

- [ ] **Step 2: Write tests for Checkout helper validation**

Test that the helper creates hosted Checkout sessions with the requested mode, BRL line items, metadata, success/cancel URLs, and customer email; test that missing secret configuration fails explicitly.

- [ ] **Step 3: Implement the server client and shared helper**

Use the official Stripe SDK server client. Keep all Stripe calls server-only and normalize Checkout parameters in one helper so the four routes cannot diverge.

- [ ] **Step 4: Run focused type/test checks**

Run the repository's focused test command and `npm run typecheck`. Expected: the new tests pass and no TypeScript errors are introduced.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/env.ts src/lib/stripe
git commit -m "feat: add Stripe server checkout foundation"
```

### Task 2: Replace Guide one-time and recurring checkout creation

**Files:**
- Modify: `src/app/api/payments/create-guide-checkout/route.ts`
- Modify: `src/app/api/payments/create-guide-subscription/route.ts`
- Modify: `src/components/sales/guide-checkout-button.tsx`
- Modify: `src/components/sales/guide-subscription-button.tsx`
- Modify: `src/lib/guide-offer.ts`
- Test: focused route tests for both checkout endpoints

**Interfaces:**
- One-time route returns `{ checkoutUrl: string }` or the repository's existing response-compatible redirect field.
- Recurring route returns `{ checkoutUrl: string }` and creates a `guide_subscriptions` row before the session.
- Metadata uses `guide_purchase:<uuid>` and `guide_subscription:<uuid>` references.

- [ ] **Step 1: Write failing tests for server-owned Guide sessions**

Assert that one-time checkout inserts a pending `guide_purchases` row, uses `GUIDE_PRICE_CENTS`, and sends `guide_purchase:<id>` metadata. Assert that subscription checkout uses `GUIDE_SUBSCRIPTION_PRICE_CENTS`, the submitted email, and `guide_subscription:<id>` metadata. Assert invalid offer variants remain rejected.

- [ ] **Step 2: Implement Stripe Checkout sessions**

Replace Mercado Pago SDK calls with the shared helper. Keep offer attribution and existing success URL semantics. Do not accept client-supplied amounts or product identifiers.

- [ ] **Step 3: Update Guide buttons and provider copy**

Redirect users to the returned Stripe Checkout URL and preserve loading/error states. Change `GUIDE_OFFER_PROVIDER` and legal-facing text to Stripe/provider-neutral wording.

- [ ] **Step 4: Run focused tests and typecheck**

Run the focused Guide route/component tests and `npm run typecheck`. Expected: both endpoints produce Stripe URLs through mocked Stripe calls and all existing validation assertions pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/payments/create-guide-checkout src/app/api/payments/create-guide-subscription src/components/sales src/lib/guide-offer.ts
git commit -m "feat: route guide sales through Stripe"
```

### Task 3: Replace Premium and booking payment flows

**Files:**
- Modify: `src/actions/subscriptions.ts`
- Modify: `src/components/premium-checkout-button.tsx`
- Modify: `src/components/checkout/booking-payment.tsx`
- Delete or replace: `src/components/payment-brick.tsx`
- Create or modify: `src/app/api/payments/create-premium-checkout/route.ts` if a route handler is needed for the action boundary
- Modify: `src/app/api/payments/create-booking-payment/route.ts`
- Modify: `src/app/checkout/[bookingId]/page.tsx` if checkout props/copy change
- Test: focused Premium and booking checkout tests

**Interfaces:**
- Premium checkout creates `mode: 'subscription'` with `premium_subscription:<user-id>` metadata and verifies the user is an authenticated luthier.
- Booking checkout creates `mode: 'payment'` with `booking:<booking-id>` metadata and loads the booking amount/server pricing from the authenticated student-owned row.
- Booking checkout returns a hosted `checkoutUrl`; no raw card token reaches the application.

- [ ] **Step 1: Write failing tests for authorization and server pricing**

Test unauthenticated/non-luthier Premium requests, non-owner/missing/non-pending booking requests, and a valid booking whose Stripe line item equals calculated total price including platform fee.

- [ ] **Step 2: Implement Premium Stripe checkout**

Replace the simulated URL in `startPremiumCheckout` with a server-side Stripe subscription Checkout session. Preserve the existing authentication and role checks.

- [ ] **Step 3: Implement booking Stripe checkout**

Replace Payment Brick token handling with a hosted Stripe session. Keep the existing booking ownership, pending-state, modality, and pricing calculations; pass the booking ID only as server-generated metadata.

- [ ] **Step 4: Update the booking and Premium UI**

Replace the Mercado Pago brick with a clear Stripe button/redirect state. Preserve Portuguese formatting, totals, installment disclaimer only if still accurate for Stripe Checkout, and existing success navigation.

- [ ] **Step 5: Run focused tests and typecheck**

Run Premium/booking tests and `npm run typecheck`. Expected: no Mercado Pago client code is required by these active flows.

- [ ] **Step 6: Commit**

```bash
git add src/actions/subscriptions.ts src/components/premium-checkout-button.tsx src/components/checkout src/components/payment-brick.tsx src/app/api/payments/create-booking-payment src/app/checkout
git commit -m "feat: add Stripe checkout for premium and bookings"
```

### Task 4: Add signed idempotent Stripe webhook processing

**Files:**
- Create: `src/app/api/payments/stripe-webhook/route.ts`
- Create: `src/lib/stripe/webhook.ts`
- Modify: `src/db/schema.ts` only if a Stripe event/idempotency table or gateway column is required
- Create: additive migration under `drizzle/` only if schema changes are required
- Test: focused webhook tests

**Interfaces:**
- `POST /api/payments/stripe-webhook` reads the raw request body, verifies `STRIPE_WEBHOOK_SECRET`, and returns `400` for invalid signatures.
- `processStripeEvent(event: Stripe.Event): Promise<void>` handles Checkout completion, payment success/failure, invoice payment success/failure, and subscription status changes.
- Processing is idempotent for repeated event IDs and repeated domain metadata.

- [ ] **Step 1: Write failing webhook tests**

Cover invalid signatures, malformed metadata, repeated Checkout completion, Guide purchase approval, Guide subscription status/period updates, Premium subscription status updates, booking payment confirmation, and failed/canceled subscription access revocation.

- [ ] **Step 2: Implement raw-body signature verification**

Use `request.text()` and the official Stripe webhook construct-event method before any database read/write that changes payment state.

- [ ] **Step 3: Implement domain event handlers**

Resolve each stable metadata reference to its domain row, update statuses and gateway IDs, preserve offer conversion uniqueness, and return explicit errors for unsupported/malformed events without falsely acknowledging them.

- [ ] **Step 4: Add idempotency persistence or safe conditional updates**

Prefer an additive `stripe_webhook_events` table with unique Stripe event ID if current schema cannot guarantee duplicate protection. If existing rows and conditional updates are sufficient, document and test that invariant instead.

- [ ] **Step 5: Run focused webhook tests and typecheck**

Run the focused webhook suite and `npm run typecheck`. Expected: duplicate deliveries produce no duplicate side effects and invalid signatures produce no writes.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/payments/stripe-webhook src/lib/stripe src/db/schema.ts drizzle
git commit -m "feat: process signed Stripe payment webhooks"
```

### Task 5: Remove Mercado Pago from active payment surfaces and update documentation

**Files:**
- Modify: `src/app/termos/page.tsx`
- Modify: `src/app/reembolso/page.tsx`
- Modify: `docs/architecture.md`
- Modify: `README.md` or setup documentation where payment environment variables are documented
- Modify/delete: active Mercado Pago payment components/routes/actions only after confirming no new UI references remain
- Modify: `package.json` to remove Mercado Pago dependencies if no historical/admin route needs them
- Test: repository search and focused UI checks

**Interfaces:**
- No new payment UI or checkout route references Mercado Pago.
- Historical database columns/rows remain intact.
- Provider-specific legal copy names Stripe or uses provider-neutral language.

- [ ] **Step 1: Search for active references and classify historical compatibility**

Search `src/` and docs for Mercado Pago references. Keep only explicitly historical/admin compatibility code if needed by existing callbacks; remove active links, imports, required env keys, and payment-brick code.

- [ ] **Step 2: Update legal and architecture documentation**

Document Stripe webhook requirements, current active payment flows, and the fact that legacy Mercado Pago data is retained but no longer used for new sales.

- [ ] **Step 3: Remove obsolete dependency/configuration**

Remove Mercado Pago packages and required env validation only after TypeScript/build confirms no active import remains. Do not edit `.env.local` secrets; provide a manual cleanup checklist for deprecated variables.

- [ ] **Step 4: Run focused UI checks and repository search**

Run `rg` to confirm no active checkout path imports Mercado Pago, then run `npm run lint` and `npm run typecheck`. Expected: no active UI path uses Mercado Pago and no lint/type errors remain.

- [ ] **Step 5: Commit**

```bash
git add src docs package.json package-lock.json
git commit -m "chore: retire Mercado Pago payment surfaces"
```

### Task 6: Configure and verify Stripe CLI/products without exposing secrets

**Files:**
- Modify: `.env.example` if present
- Modify: setup documentation only if required by actual CLI output

- [ ] **Step 1: Install/verify Stripe CLI and Projects plugin**

On Windows, install the official Stripe CLI using the supported installer, then run `stripe --version` and `stripe agent setup`. If authentication requires browser approval, show only the CLI-provided URL/code and wait for the user action.

- [ ] **Step 2: Verify project readiness and catalog**

Run the CLI status/catalog commands appropriate to the connected Stripe account. Do not print secret values or account identifiers.

- [ ] **Step 3: Create or reconcile Products and Prices**

Create/reuse one-time Guide, recurring Guide, Premium recurring, and booking payment definitions using the exact current BRL amounts. Record only non-secret Product/Price IDs in deployment configuration or project variables.

- [ ] **Step 4: Register and test the webhook**

Use Stripe CLI forwarding for local verification, send test events for each flow, and confirm the application logs/DB state without manually applying production changes.

- [ ] **Step 5: Commit documentation/config templates**

Commit only safe variable names, setup commands, and non-secret identifiers; never commit `.env.local`, secret keys, webhook signing secrets, or customer data.

### Task 7: Full verification and final handoff

**Files:**
- No source changes expected unless verification reveals a regression.

- [ ] **Step 1: Run production verification**

Run `npm run verify`. Expected: lint, strict typecheck, and production build pass.

- [ ] **Step 2: Run critical end-to-end coverage**

Run `npm run test:e2e` for checkout, success, and access flows. Compare known baseline failures in `docs/quality.md` and report any unrelated baseline failures separately.

- [ ] **Step 3: Verify manual Stripe test-mode flows**

Use Stripe test mode to exercise Guide purchase, Guide subscription, Premium subscription, booking payment, canceled subscription, and duplicate webhook delivery. Confirm the UI is formatted correctly on mobile and desktop.

- [ ] **Step 4: Produce the handoff**

List changed files, verification results, Stripe Dashboard/CLI steps still required, exact environment variable names (never values), and the manual deployment checklist. Do not claim production readiness until the user completes any required Stripe account/webhook approval steps.
