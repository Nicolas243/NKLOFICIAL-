# Campanha de rifa de livros Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a transparent, low-pressure campaign for the external 123Rifas book action using a banner, end-of-content card, and one-per-session exit popup on public pages.

**Architecture:** Keep campaign URL, copy, UTM parameters, and eligibility rules in one typed module. Render three small client components through a public-shell campaign component, while route-level guards prevent private, checkout, authentication, admin, and error surfaces from rendering it. Reuse existing outbound-link and offer-event conventions where appropriate without coupling the campaign to Stripe checkout.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, existing browser storage and analytics/event endpoint patterns, Node test runner/tsx.

**Spec:** `docs/superpowers/specs/2026-11-11-rifa-livros-campaign-design.md`

## Global Constraints

- The campaign must link to `https://123rifas.com/acao/os-3-melhores-livros-de-financas-fisicos`.
- The copy must never call purchasing a raffle number a “doação”.
- The campaign must state that the action is external and processed by 123Rifas.
- The campaign must not process raffle payments or store raffle buyer data in Portal NKL.
- The campaign must not render in checkout, login, registration, private profile, dashboard, admin, or error routes.
- The banner can be dismissed for seven days.
- The exit popup can appear at most once per browser session and never after campaign interaction.
- Event tracking must contain only aggregate campaign/surface/action data and no personal data.
- External links must use a new tab with `noopener noreferrer`.
- Use the existing design system and Portuguese copy; do not introduce a new UI framework.

## Review Focus

- A visitor on an excluded private or transactional route must not see campaign UI; pin this in the route-eligibility tests in Task 1.
- A dismissed banner must stay hidden for seven days but reappear after expiry; pin this in the storage-policy tests in Task 1.
- A visitor who clicks any campaign CTA must not later receive the exit popup in the same session; pin this in the popup-state tests in Task 2.
- Tracking failures must not block navigation or render an error state; pin this in the event-helper tests in Task 1.
- External CTA URLs must preserve the correct UTM surface and safe link attributes; pin this in the link tests in Task 2.

---

### Task 1: Create campaign configuration and behavior helpers

**Files:**
- Create: `src/lib/rifa-campaign.ts`
- Test: `src/lib/rifa-campaign.test.ts`

**Interfaces:**
- Produces `RIFA_CAMPAIGN_URL`, `RIFA_CAMPAIGN_COPY`, `RIFA_CAMPAIGN_SURFACES`, `isRifaCampaignRoute(pathname: string): boolean`, `getRifaCampaignUrl(surface: RifaCampaignSurface): string`, `getDismissalExpiry(now: number): number`, and `trackRifaCampaignEvent(input: RifaCampaignEvent): Promise<void>`.

- [ ] **Step 1: Write failing tests** for the exact URL, Portuguese copy requirements, excluded route prefixes, seven-day expiry, UTM generation, and non-throwing tracking failure behavior.
- [ ] **Step 2: Run `npx tsx --test src/lib/rifa-campaign.test.ts` and verify the tests fail for missing exports or incorrect behavior.**
- [ ] **Step 3: Implement the typed configuration and helpers in `src/lib/rifa-campaign.ts`; keep tracking fire-and-forget and log failures with the repository’s existing console-error convention.**
- [ ] **Step 4: Run the focused test again and verify all behavior passes.**
- [ ] **Step 5: Commit the configuration/helper unit.**

### Task 2: Build the banner, card, and exit popup components

**Files:**
- Create: `src/components/rifa-campaign/rifa-campaign-banner.tsx`
- Create: `src/components/rifa-campaign/rifa-campaign-card.tsx`
- Create: `src/components/rifa-campaign/rifa-campaign-exit-popup.tsx`
- Create: `src/components/rifa-campaign/rifa-campaign-link.tsx`
- Test: `src/components/rifa-campaign/rifa-campaign.test.tsx` or the repository’s established component-test location

**Interfaces:**
- `RifaCampaignLink({ surface, variant }): JSX.Element` builds the safe external CTA URL and records the click without blocking navigation.
- `RifaCampaignBanner(): JSX.Element` handles seven-day dismissal.
- `RifaCampaignCard(): JSX.Element` renders the contextual post-content message.
- `RifaCampaignExitPopup(): JSX.Element` handles once-per-session display, explicit close, and interaction suppression.

- [ ] **Step 1: Write failing component tests** for both CTA labels, 123Rifas disclosure, safe external link attributes, banner dismissal, popup session limit, and popup suppression after click.
- [ ] **Step 2: Run the focused component test command and verify the expected failures.**
- [ ] **Step 3: Implement the components with accessible headings, buttons, close labels, keyboard-safe dialogs, responsive Tailwind classes, and no blocking navigation on tracking errors.**
- [ ] **Step 4: Run the focused component tests and verify they pass.**
- [ ] **Step 5: Commit the campaign surfaces.**

### Task 3: Integrate the campaign into the public shell

**Files:**
- Create: `src/components/rifa-campaign/rifa-campaign-shell.tsx`
- Modify: `src/app/layout.tsx`
- Modify: the existing public content shell/component identified during implementation, likely `src/components/site-guidance.tsx` or the relevant page wrapper
- Test: `src/components/rifa-campaign/rifa-campaign-shell.test.tsx`

**Interfaces:**
- `RifaCampaignShell({ pathname, children }): JSX.Element` renders children plus the eligible campaign surfaces and returns children unchanged on excluded paths.

- [ ] **Step 1: Write failing integration tests** for a public route rendering banner/card/popup and excluded routes rendering none.
- [ ] **Step 2: Run the focused integration test and verify it fails before shell integration.**
- [ ] **Step 3: Add the shell at the highest existing public layout boundary that does not wrap private/admin/checkout routes, using `isRifaCampaignRoute` as a defense-in-depth guard.**
- [ ] **Step 4: Run the integration tests and verify the campaign appears once per surface without duplicated markup.**
- [ ] **Step 5: Commit the public-shell integration.**

### Task 4: Add content transparency and documentation

**Files:**
- Modify: `src/app/privacidade/page.tsx` only if campaign analytics/storage or external-action wording needs a dedicated notice
- Modify: `docs/setup.md` or the appropriate product/architecture documentation
- Test: `src/lib/rifa-campaign.test.ts` for copy/documented URL invariants

**Interfaces:**
- Documentation must describe the external 123Rifas action, the canonical URL, campaign frequency controls, and aggregate event fields without claiming the Portal processes the raffle.

- [ ] **Step 1: Add a test assertion for the canonical campaign URL and required disclosure text.**
- [ ] **Step 2: Run the focused test and verify the new assertion fails if the disclosure is absent.**
- [ ] **Step 3: Update the privacy/product documentation and keep the legal wording factual: participation is processed externally by 123Rifas, and Portal NKL does not store raffle buyer data.**
- [ ] **Step 4: Run the focused test and verify it passes.**
- [ ] **Step 5: Commit the documentation update.**

### Task 5: Run full validation and review the experience

**Files:**
- Test: `e2e/rifa-campaign.spec.ts`
- Modify: `docs/quality.md` with the focused validation result

- [ ] **Step 1: Write E2E tests** covering a public page, a private/checkout page, banner dismissal persistence, popup frequency, CTA destination/UTM, and mobile layout visibility.
- [ ] **Step 2: Run `npx playwright test e2e/rifa-campaign.spec.ts --reporter=line` and verify the new tests fail until the complete integration is present.**
- [ ] **Step 3: Run the E2E tests against the implemented campaign and fix only campaign-caused failures.**
- [ ] **Step 4: Run `npm run lint`, `npm run typecheck`, and `npm run verify`; record pre-existing warnings separately from new failures.**
- [ ] **Step 5: Run `npx playwright test e2e/rifa-campaign.spec.ts --reporter=line` again and verify the final result.**
- [ ] **Step 6: Commit the validation notes and complete implementation.**

