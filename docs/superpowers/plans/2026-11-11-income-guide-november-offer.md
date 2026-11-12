# November Income Guide Offer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve `/guias/renda-extra` with a clear November package offer and a balanced five-variant CTA experiment.

**Architecture:** Add a Guide-specific experiment alongside the existing program-card experiment. Reuse the generic offer-event endpoint and balanced-variant selector, while adding a small client component that selects and persists the Guide variant and renders the approved copy without duplicating the landing page.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Drizzle/Postgres, Playwright, Node test runner, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-11-11-income-guide-november-offer-design.md`

## Global Constraints

- The two purchase modes deliver the November package with five materials: Guide Essencial, O Código de Novembro, Dinheiro Para Ontem, Escudo de Black Friday, and Raio-X Financeiro with computer/mobile versions counted as one material.
- The one-time purchase releases the November package once; the R$ 19/month subscription releases the current package and new PDFs/guides from December 15 onward.
- The current `program-secondary-cta` experiment remains with variants `0`, `1`, and `2`.
- The new Guide experiment is `guide-page-cta` with variants `0`, `1`, `2`, `3`, and `4`.
- Explicit `cta_variant=0..4` takes priority; absent or invalid values use balanced selection and persist in a Guide-specific localStorage key.
- Guide events use `guide-page-cta:<variant>` and remain gated by accepted consent.
- Preserve existing prices, payment gateways, webhooks, checkout behavior, and no-guaranteed-results language.

## Review Focus

- An invalid or missing `cta_variant` must never produce an unsupported variant or break checkout: Task 1 and Task 3 tests.
- Existing `program-secondary-cta` events and validation must remain unchanged: Task 1 and Task 2 regression tests.
- A failed variant-selection request must still render a usable page with a deterministic five-variant fallback and visible checkout: Task 3 E2E test.
- The one-time and subscription offers must describe different duration/access semantics while retaining R$ 39 and R$ 19/month: Task 3 E2E test.
- Conversion attribution must preserve `guide-page-cta:<variant>` through checkout/webhook validation: Task 1 and Task 2 tests.

---

### Task 1: Add Guide experiment contracts and attribution support

**Files:**
- Modify: `src/lib/offer-experiment.ts`
- Modify: `src/lib/analytics.ts`
- Test: `src/lib/__tests__/offer-experiment.test.ts`
- Test: `src/lib/__tests__/analytics.test.ts`

**Interfaces:**
- Produces `GUIDE_PAGE_CTA_EXPERIMENT = 'guide-page-cta'`.
- Produces `GUIDE_PAGE_CTA_VARIANTS = ['0', '1', '2', '3', '4'] as const`.
- Produces `parseGuidePageCtaVariant(value: string | null | undefined): '0' | '1' | '2' | '3' | '4' | null`.
- Extends validated attribution parsing to accept `guide-page-cta:0..4` while preserving existing experiment contracts.
- Extends funnel event tracking so `trackOfferFunnelEvent('guide-page-cta:0', eventType)` posts the Guide experiment and existing program variants still post `program-secondary-cta`.

- [ ] **Step 1: Write failing contract tests**

Add tests that assert all five Guide variants are accepted, `5` and non-numeric values are rejected, `parseValidatedOfferVariant('guide-page-cta:4')` returns the normalized value, and existing `program-secondary-cta:2` behavior remains valid.

- [ ] **Step 2: Run the focused tests and verify the expected failure**

Run: `npx tsx --test src/lib/__tests__/offer-experiment.test.ts src/lib/__tests__/analytics.test.ts`

Expected: FAIL because the Guide experiment parser and attribution support do not exist yet.

- [ ] **Step 3: Implement the Guide experiment contracts**

Add the constants and parser in `src/lib/offer-experiment.ts`, and update validated attribution parsing without changing the existing program, native-card, or exit-popup variant sets.

- [ ] **Step 4: Generalize event attribution minimally**

Update `trackOfferFunnelEvent` to derive the experiment and variant from validated attribution, send the same event name/params to GA4 and PostHog, and POST the parsed experiment instead of hard-coding `program-secondary-cta`. Keep invalid attribution as a no-op.

- [ ] **Step 5: Run the focused tests and verify they pass**

Run: `npx tsx --test src/lib/__tests__/offer-experiment.test.ts src/lib/__tests__/analytics.test.ts`

Expected: all focused tests pass.

- [ ] **Step 6: Commit**

Commit with: `feat: add guide CTA experiment contracts`

### Task 2: Extend offer-event API for five Guide variants

**Files:**
- Modify: `src/app/api/sales/offer-events/route.ts`
- Modify: `src/app/api/payments/hotmart-webhook/route.ts`
- Test: `src/app/api/sales/offer-events/route.test.ts` or the repository's existing route-test location

**Interfaces:**
- Consumes the Guide constants and parser from Task 1.
- Accepts `experiment=guide-page-cta` in GET and POST.
- Returns a balanced variant from `0..4` for `GET /api/sales/offer-events?experiment=guide-page-cta`.
- Accepts Guide event payloads with `impression`, `click`, `checkout`, and `conversion`.
- Allows the payment attribution validator to recognize `guide-page-cta:0..4`.

- [ ] **Step 1: Write failing API tests**

Test that the GET route accepts `guide-page-cta`, returns a variant in `0..4`, POST accepts a Guide impression and rejects variant `5`, and the existing program experiment remains accepted.

- [ ] **Step 2: Run the route tests and verify the expected failure**

Run the repository's focused route test command for the new test file.

Expected: FAIL because the route enum and variant map do not include `guide-page-cta`.

- [ ] **Step 3: Extend the route experiment registry**

Import the Guide experiment constants, add the Guide tuple to `experimentVariants`, and use the same `chooseBalancedVariant` minimum-exposure policy without changing existing experiments.

- [ ] **Step 4: Extend payment attribution validation**

Update the Hotmart webhook attribution guard to accept only the new validated Guide variants, preserving rejection of unsupported experiment names and values.

- [ ] **Step 5: Run focused API and payment attribution tests**

Run the focused route/webhook tests.

Expected: all new and existing attribution tests pass.

- [ ] **Step 6: Commit**

Commit with: `feat: support five guide CTA variants`

### Task 3: Build the November package offer and variant-aware page

**Files:**
- Create: `src/lib/guide-offer.ts`
- Create: `src/components/sales/guide-page-offer.tsx`
- Modify: `src/app/guias/renda-extra/page.tsx`
- Test: `src/lib/__tests__/guide-offer.test.ts`

**Interfaces:**
- `src/lib/guide-offer.ts` exports a typed `GUIDE_PAGE_CTA_VARIANTS` configuration containing variant id, title, summary, CTA label, and angle for all five variants.
- `GuidePageOffer` accepts `initialVariant: GuidePageCtaVariant | null`, `purchaseOfferVariant?: string`, `subscriptionOfferVariant?: string`, and `hotmartCheckoutUrl?: string`.
- The client component selects an explicit server-provided variant first; otherwise it fetches `GET /api/sales/offer-events?experiment=guide-page-cta`, persists the valid result under a Guide-specific key, and falls back to a deterministic random choice among `0..4` if the request fails.
- The page renders the exact November package description and differentiates one-time access from the R$ 19/month subscription.

- [ ] **Step 1: Write failing offer configuration tests**

Test that the configuration contains exactly five variants, each has a distinct id and non-empty title/summary/CTA label, and the copy mentions the November package without promising income.

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run: `npx tsx --test src/lib/__tests__/guide-offer.test.ts`

Expected: FAIL because the Guide offer configuration does not exist.

- [ ] **Step 3: Implement the typed offer configuration**

Create the five approved angles:
`0` pacote de novembro, `1` diagnóstico rápido, `2` ação imediata, `3` oportunidades, and `4` proteção/Black Friday. Keep copy plain, truthful, and compatible with the existing visual hierarchy.

- [ ] **Step 4: Implement the client variant selector and offer UI**

Create `GuidePageOffer` with explicit-variant priority, localStorage persistence, five-variant fallback, impression tracking once per persisted variant, and the existing `DiscountSimulator`/`GuideSubscriptionButton` components. Send `guide-page-cta:<variant>` to both purchase paths.

- [ ] **Step 5: Wire server params into the page**

Parse `cta_variant` with `parseGuidePageCtaVariant`; pass a valid explicit variant to `GuidePageOffer`, otherwise allow client selection. Preserve `ad_variant` handling only as legacy attribution when no Guide CTA variant is present, and keep both existing checkout URLs.

- [ ] **Step 6: Replace the page's generic copy with the approved package explanation**

Show that the one-time purchase delivers the five November materials once and that the subscription delivers the current package plus new PDFs/guides from December 15. Keep prices unchanged and retain the existing checkout/payment disclosure.

- [ ] **Step 7: Run focused tests and type-check**

Run:
`npx tsx --test src/lib/__tests__/guide-offer.test.ts`
`npm run typecheck`

Expected: all offer tests pass and TypeScript reports no errors.

- [ ] **Step 8: Commit**

Commit with: `feat: improve November guide offer page`

### Task 4: Add end-to-end coverage and documentation

**Files:**
- Modify: `e2e/program-catalog.spec.ts` only if shared CTA assertions require extraction
- Create: `e2e/guide-offer.spec.ts`
- Modify: `docs/architecture.md`
- Modify: `docs/quality.md`

**Interfaces:**
- E2E coverage uses consent accepted and verifies the public page behavior, not implementation details.
- Documentation records the separate `guide-page-cta` experiment, five variants, package semantics, and minimum exposure rule.

- [ ] **Step 1: Write failing E2E scenarios**

Add scenarios that visit `/guias/renda-extra?cta_variant=0` and `?cta_variant=4`, verify the variant-specific heading/CTA, confirm the five November materials and both access modes, and assert an invalid `cta_variant=5` does not break the page.

- [ ] **Step 2: Run the new E2E tests and verify the expected failure**

Run: `npx playwright test e2e/guide-offer.spec.ts`

Expected: FAIL until the page and experiment are wired.

- [ ] **Step 3: Implement the E2E assertions**

Assert visible copy, unchanged `R$ 39,00` and `R$ 19/mês`, the two checkout controls, valid URL-driven variants, and fallback page usability.

- [ ] **Step 4: Update architecture and quality documentation**

Document that `guide-page-cta` is isolated from `program-secondary-cta`, uses variants `0..4`, and compares impression/click/checkout/conversion after each variant reaches at least 40 impressions.

- [ ] **Step 5: Run focused and full verification**

Run:
`npx playwright test e2e/guide-offer.spec.ts`
`npm run verify`
`npm run test:e2e`

Expected: focused tests, lint, typecheck, build, and the E2E suite pass; known baseline warnings/failures are reported rather than hidden.

- [ ] **Step 6: Commit**

Commit with: `test: cover November guide CTA experiment`
