# Portal NKL Auth, Catalog and Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a single-session Portal NKL experience with non-invasive area guidance, safer page sharing, clearer opportunity metadata, complete program pages, and consent-aware analytics.

**Architecture:** Keep Supabase Auth and `user_profiles` as the shared identity layer. Add small pure helpers for tutorial-area state, canonical sharing URLs, and editorial metadata; keep the existing server/client component boundaries and global footer/layout. Use existing consent and analytics providers without adding a database migration.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Supabase SSR, Drizzle, Tailwind v4, Node `node:test`, Playwright.

**Spec:** [docs/superpowers/specs/2026-11-10-portal-nkl-auth-catalog-analytics-design.md](../specs/2026-11-10-portal-nkl-auth-catalog-analytics-design.md)

## Global Constraints

- Keep one Supabase Auth session shared by music, opportunities, and renda extra.
- Keep `nkl_tutorial_seen` exclusively for the existing home tutorial.
- Area tutorials are browser-local, non-invasive suggestions; the full tutorial opens only after the user clicks.
- Do not expose the personal uTest e-mail; copy only `Nicolas da Costa Santos`, UTest ID `2535825`, and `https://www.utest.com/ref2535825`.
- Sharing must use the current canonical page URL, never a direct affiliate URL.
- Use `program-first-withdrawal.ts` as the reviewed withdrawal source; never invent a deadline.
- Do not add a database migration, checkout-recovery webhook, or production infrastructure change.
- Marketing analytics load and event emission require the existing accepted consent state.
- Do not deploy until focused checks, `npm run verify`, and the applicable e2e checks have been reviewed.

## Review Focus

- OAuth succeeds but profile upsert fails: keep the Supabase session and provide a visible retry action; covered in Task 1.
- A user visits an area without its tutorial target or closes the suggestion: render no blocking overlay and keep navigation usable; covered in Task 2.
- A share button is clicked on a URL containing affiliate/tracking parameters: share only the canonical pathname; covered in Task 3.
- A program has no reviewed withdrawal deadline or has more than three rows of tags: render no invented deadline and keep card height bounded with access to overflow; covered in Task 4.
- Consent is absent/rejected or the `/programas/celular` route is inspected through a CSS-stripping tool: do not load marketing scripts, and verify real browser CSS before changing page code; covered in Task 6.

---

### Task 1: Stabilize shared Supabase authentication

**Files:**
- Modify: `src/actions/auth.ts`
- Modify: `src/app/auth/callback/route.ts`
- Modify: `src/app/login/login-form.tsx` (or the existing login form path found during implementation)
- Modify: `src/lib/auth/profile.ts`
- Create: `src/lib/auth/profile-sync.ts`
- Test: `src/app/auth/callback/route.test.ts`
- Test: `src/lib/auth/__tests__/profile-sync.test.ts`

**Interfaces:**
- Consumes: `safeNextPath`, `createClient`, `upsertAuthenticatedProfile`, and the existing Supabase cookie adapter.
- Produces: `syncAuthenticatedProfile(user): Promise<{ ok: true } | { ok: false; message: string }>` and a server action `retryProfileSync(): Promise<{ error?: string }>` for the visible recovery state.

- [ ] **Step 1: Write failing tests** for OAuth success with an internal `next`, profile-sync failure that preserves the authenticated session/retry state, and retry success/failure messages. Keep external Supabase calls behind the existing client/profile seams.
- [ ] **Step 2: Run the focused tests** with `npx tsx --test src/app/auth/callback/route.test.ts src/lib/auth/__tests__/profile-sync.test.ts`; confirm they fail because the retry contract and failure behavior do not exist.
- [ ] **Step 3: Implement the shared sync result and retry action** in `src/lib/auth/profile-sync.ts` and `src/actions/auth.ts`; keep logs explicit but redact tokens, e-mails beyond necessary context, and secrets.
- [ ] **Step 4: Update the callback** to exchange the code, keep the Supabase session when profile sync fails, redirect to a recoverable login/profile state, and retain the validated internal destination.
- [ ] **Step 5: Add the login UI retry/error state** without swallowing `NEXT_REDIRECT`; show a clear “Tentar novamente” action.
- [ ] **Step 6: Run the focused tests** again and verify PASS, then run the existing auth callback test.
- [ ] **Step 7: Commit** with `git add src/actions/auth.ts src/app/auth/callback/route.ts src/app/login src/lib/auth src/app/auth/callback/route.test.ts && git commit -m "fix: stabilize shared supabase authentication"`.

### Task 2: Add non-invasive tutorials per area

**Files:**
- Modify: `src/components/ui/spotlight-tutorial.tsx`
- Modify: `src/components/site-guidance.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/lib/income-portal.ts`
- Create: `src/lib/tutorial-areas.ts`
- Test: `src/lib/__tests__/tutorial-areas.test.ts`
- Test: `e2e/critical-path.spec.ts`

**Interfaces:**
- Consumes: current pathname, existing `nkl:open-onboarding` event, existing `nkl_tutorial_seen`, and selectors already present in music pages.
- Produces: `getTutorialArea(pathname): 'income' | 'music' | null`, browser-local suggestion keys `nkl_area_tutorial_suggestion_seen:<area>`, and an explicit open event carrying the area.

- [ ] **Step 1: Write failing unit tests** for route-to-area mapping, preserving the home key as unrelated to area keys, and generating stable browser-local keys.
- [ ] **Step 2: Run `npx tsx --test src/lib/__tests__/tutorial-areas.test.ts`; confirm the new helper is missing or fails the new cases.
- [ ] **Step 3: Implement `tutorial-areas.ts`** using the existing portal route helpers; include the existing music routes rather than inventing selectors or routes.
- [ ] **Step 4: Change `SpotlightTutorial`** so it no longer auto-opens the blocking overlay for area visits; render/coordinate a dismissible suggestion and open the full spotlight only from the click event or “Guia rápido”.
- [ ] **Step 5: Preserve click-through behavior**: clicking a highlighted target closes the tutorial before the target's normal action continues, and missing targets remove only the invalid step.
- [ ] **Step 6: Add area-specific copy/steps** from existing visible selectors, with no automatic opening in the analysis path and no sensitive data in events.
- [ ] **Step 7: Run focused unit and e2e checks**; verify a first visit shows a suggestion, closing it does not blur the page, and the guide button still opens the tutorial.
- [ ] **Step 8: Commit** with `git add src/components/ui/spotlight-tutorial.tsx src/components/site-guidance.tsx src/app/layout.tsx src/lib/income-portal.ts src/lib/tutorial-areas.ts src/lib/__tests__/tutorial-areas.test.ts e2e/critical-path.spec.ts && git commit -m "feat: add non-invasive area tutorials"`.

### Task 3: Normalize page sharing and add the floating share control

**Files:**
- Create: `src/lib/share-url.ts`
- Create: `src/components/ui/share-page-button.tsx`
- Modify: `src/components/income/program-actions.tsx`
- Modify: `src/components/footer.tsx`
- Modify: `src/app/programas/[slug]/page.tsx`
- Test: `src/lib/__tests__/share-url.test.ts`
- Test: `e2e/program-catalog.spec.ts`

**Interfaces:**
- Consumes: canonical metadata, current pathname/search, `navigator.share`, and the existing WhatsApp float.
- Produces: `getCanonicalShareUrl({ canonicalHref, currentHref }): string` and a reusable `SharePageButton` with Web Share API plus clipboard fallback.

- [ ] **Step 1: Write failing pure tests** asserting that canonical metadata wins, affiliate/tracking query parameters are removed when falling back to the current URL, and the output never contains a direct affiliate URL.
- [ ] **Step 2: Run `npx tsx --test src/lib/__tests__/share-url.test.ts`; confirm the helper is missing or fails.
- [ ] **Step 3: Implement `share-url.ts`** with an allowlist of page-required parameters and removal of referral/tracking parameters.
- [ ] **Step 4: Implement `SharePageButton`** with accessible status feedback, `navigator.share` handling, AbortError no-op, and explicit clipboard failure messaging.
- [ ] **Step 5: Refactor `ProgramActions`** to use the canonical helper while retaining the existing program-specific title/text.
- [ ] **Step 6: Place `SharePageButton` in `Footer`** immediately above the WhatsApp floating control, using the current page URL and canonical link when available.
- [ ] **Step 7: Add e2e assertions** for the share control location/label and that program sharing exposes `/programas/<slug>` rather than `affiliateUrl`.
- [ ] **Step 8: Run focused tests and commit** with `git add src/lib/share-url.ts src/components/ui/share-page-button.tsx src/components/income/program-actions.tsx src/components/footer.tsx src/app/programas/[slug]/page.tsx src/lib/__tests__/share-url.test.ts e2e/program-catalog.spec.ts && git commit -m "feat: share canonical portal pages"`.

### Task 4: Correct catalog editorial metadata and card constraints

**Files:**
- Modify: `src/actions/partner-programs.ts`
- Modify: `src/lib/partner-program-sorting.ts`
- Modify: `src/lib/program-first-withdrawal.ts`
- Modify: `src/components/income/smart-tag-list.tsx`
- Modify: `src/components/partner-programs-browser.tsx`
- Create or modify: `src/lib/partner-program-editorial.ts`
- Test: `src/lib/__tests__/partner-program-sorting.test.ts`
- Test: `src/lib/__tests__/program-first-withdrawal.test.ts`
- Test: `e2e/program-catalog.spec.ts`

**Interfaces:**
- Consumes: program slug/tags/rating, existing editorial metadata, and the reviewed first-withdrawal guide map.
- Produces: stable editorial output where `utest` may receive “Melhor para Começar”, `attapoll` never receives it, and optional reviewed withdrawal metadata can render a cautious tag.

- [ ] **Step 1: Write failing tests** for AttaPoll exclusion, uTest beginner ordering before equal/lower-rated non-beginner programs, absence of an unreviewed withdrawal deadline, and a three-line tag container with accessible overflow.
- [ ] **Step 2: Run the focused unit tests** and confirm the current editorial set/tag layout fails the new cases.
- [ ] **Step 3: Update the centralized editorial set and metadata**; use the existing rating/sorting helper and do not duplicate ranking logic in the browser.
- [ ] **Step 4: Add reviewed withdrawal metadata** only for entries backed by `program-first-withdrawal.ts`; render copy such as “1º saque em 15 dias” only when explicitly present.
- [ ] **Step 5: Update `SmartTagList`** to cap visible layout at three rows and provide a keyboard-accessible overflow path without increasing the card indefinitely.
- [ ] **Step 6: Update uTest card/detail copy** to use `https://www.utest.com/ref2535825`; add a dedicated safe copy payload containing the exact name and ID, excluding the e-mail.
- [ ] **Step 7: Run unit and catalog e2e tests** and verify tags, ordering, referral copy, and card behavior.
- [ ] **Step 8: Commit** with `git add src/actions/partner-programs.ts src/lib/partner-program-sorting.ts src/lib/program-first-withdrawal.ts src/components/income/smart-tag-list.tsx src/components/partner-programs-browser.tsx src/lib/partner-program-editorial.ts src/lib/__tests__ e2e/program-catalog.spec.ts && git commit -m "feat: refine opportunity editorial metadata"`.

### Task 5: Finish program detail pages and public strategy content

**Files:**
- Modify: `src/app/programas/[slug]/page.tsx`
- Modify: `src/components/affiliate-disclaimer.tsx`
- Modify: `src/components/footer.tsx`
- Modify: `src/lib/partner-strategies.ts`
- Modify: `src/components/income/program-first-withdrawal.tsx`
- Test: `e2e/program-catalog.spec.ts`

**Interfaces:**
- Consumes: Task 4 editorial/withdrawal metadata and the existing global `Footer`.
- Produces: detail pages with the disclosure at the bottom, a complete footer, a practical “Como chegar ao primeiro saque” section, Buy Me a Coffee invite scoped only to its program, and visible non-NotebookLM dark-channel strategies.

- [ ] **Step 1: Write failing e2e assertions** for disclosure placement after main content, complete footer links, scoped Buy Me a Coffee invitation, uTest indication copy, and at least two non-NotebookLM strategies.
- [ ] **Step 2: Run the focused e2e test** and confirm the current header disclosure/strategy content fails.
- [ ] **Step 3: Move `AffiliateDisclaimer`** below the detail sections in a closed accessible `<details>` block; keep the exact disclosure copy.
- [ ] **Step 4: Ensure the global footer remains present** and add the support count text “0 pessoas” without simulating a count source.
- [ ] **Step 5: Reframe the first-withdrawal section** as a practical sequence while preserving platform-specific caveats and copy action.
- [ ] **Step 6: Add public dark-channel strategies** for manual research, original scripting, licensed media, Shorts/distribution, and retention review, each with effort/risk/dependency-conscious copy.
- [ ] **Step 7: Run the detail-page e2e checks** and commit with `git add src/app/programas/[slug]/page.tsx src/components/affiliate-disclaimer.tsx src/components/footer.tsx src/lib/partner-strategies.ts src/components/income/program-first-withdrawal.tsx e2e/program-catalog.spec.ts && git commit -m "feat: complete program detail experience"`.

### Task 6: Audit `/programas/celular`, consent-aware events, and route inventory

**Files:**
- Modify: `src/components/income/income-analytics.tsx`
- Modify: `src/components/privacy-scripts.tsx`
- Modify: `src/components/ui/spotlight-tutorial.tsx`
- Modify: `src/components/partner-programs-browser.tsx`
- Modify: `docs/quality.md`
- Modify: `docs/architecture.md`
- Test: `e2e/seo.spec.ts`
- Test: `e2e/critical-path.spec.ts`

**Interfaces:**
- Consumes: existing `nkl_privacy_consent`, `nkl:privacy-consent`, PostHog/Clarity/GA4/Vercel provider configuration, and the App Router filesystem.
- Produces: deduplicated events for program views, CTA clicks, tutorial lifecycle, uTest copy, and login errors; no marketing script/event before accepted consent; a documented public-route count using one count per dynamic route family.

- [ ] **Step 1: Write failing e2e/DOM tests** for no analytics provider before consent, one event per intended interaction after acceptance, canonical metadata on `/programas/celular`, and loaded CSS in a real browser.
- [ ] **Step 2: Run the focused e2e tests** and capture the current baseline, including any known missing-module/build failures.
- [ ] **Step 3: Audit existing event names and consent helpers**; remove duplicate emissions rather than adding parallel names.
- [ ] **Step 4: Implement the minimum event set** with accepted consent gating and no personal/referral payloads; use feature flags only for future CTA/tutorial variants.
- [ ] **Step 5: Validate `/programas/celular`** in a browser build. If CSS loads, document that CSS-stripping inspection caused the plain-text appearance; only patch route/CSS if the browser reproduces the defect.
- [ ] **Step 6: Count public route families** by excluding `api`, auth, dashboard, admin, and internal routes; record the criterion and count in `docs/quality.md`.
- [ ] **Step 7: Run `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run test:e2e -- e2e/seo.spec.ts e2e/critical-path.spec.ts`; record pre-existing failures without masking new failures.
- [ ] **Step 8: Commit** with `git add src/components/income/income-analytics.tsx src/components/privacy-scripts.tsx src/components/ui/spotlight-tutorial.tsx src/components/partner-programs-browser.tsx docs/quality.md docs/architecture.md e2e/seo.spec.ts e2e/critical-path.spec.ts && git commit -m "chore: verify consent analytics and public routes"`.

### Task 7: Final review and deploy preparation

**Files:**
- Modify: `docs/onboarding.md`
- Modify: `docs/quality.md`
- Review: all files changed by Tasks 1-6

**Interfaces:**
- Consumes: all focused tests, the production build result, route inventory, and the existing baseline notes.
- Produces: a verified branch ready for explicit deployment approval, with no migration or secret changes.

- [ ] **Step 1: Run the complete available test command** and list any baseline failures by command and module; do not claim a green suite if it is not green.
- [ ] **Step 2: Run `npm run verify`** and compare failures to the documented baseline.
- [ ] **Step 3: Perform a read-only diff review** for secret exposure, affiliate URLs in share payloads, consent bypasses, and accidental changes outside scope.
- [ ] **Step 4: Update onboarding/quality documentation** with tutorial behavior, canonical sharing, uTest privacy choice, route-count criterion, and analytics limitations.
- [ ] **Step 5: Ask for explicit deployment confirmation** only after verification; deploy without migrations, then smoke-test auth, `/programas/celular`, one detail page, share, and WhatsApp float.

