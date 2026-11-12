# Portal NKL Growth and PDF Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Formspree flow with protected PDF delivery near the platform-page footer, improve suggestion and quiz conversion flows, and add local-only ad previews.

**Architecture:** Keep paid guide downloads separate from free lead downloads. A server action validates and persists a lead, creates a hashed temporary token, and either sends a Resend email or exposes the same protected link in local preview mode. Reuse existing program editorial data and first-withdrawal guides; build `/anuncie` and `/mural-de-parceiros` as explicitly labeled previews with no real inventory or checkout.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Server Actions, Drizzle/Postgres, Supabase private Storage, Zod already used by the project, Tailwind CSS v4, Vitest/Playwright.

**Spec:** `docs/superpowers/specs/2026-11-11-nkl-crescimento-e-entrega-pdf-design.md`

## Global Constraints

- The free form belongs at the bottom of the complete platform page, near the footer, and does not change `/guias/renda-extra` into a free lead form.
- The initial free asset is `guia-essencial-renda-extra-2027`.
- Local mode must show a download button on the success screen; production must not silently fall back to preview.
- Requests with a valid token for the same normalized e-mail are temporarily blocked.
- Suggestions require e-mail or phone and consent to contact about the suggestion.
- Affiliate URLs remain transparent, marked sponsored, and accompanied by partnership disclosure.
- Do not apply remote database migrations, configure production secrets, publish real ads, or activate ad checkout in this phase.
- Do not log e-mail, phone, affiliate URLs, or free-form user data to analytics.
- Use the existing private `guide-assets-private` Storage bucket and signed URL helper.

## Review Focus

- Missing Storage configuration: local preview must work, while production must return an explicit configuration error rather than a fake success. Test in the lead-delivery task.
- Duplicate lead requests: an active token must be rate-limited and not create another delivery. Test in the lead-delivery task.
- Invalid contact combinations: a suggestion with neither valid e-mail nor valid phone must be rejected; valid e-mail-only and phone-only submissions must pass. Test in the suggestion task.
- Affiliate or editorial data missing: quiz results must still render a safe canonical website link and a clear missing-step state. Test in the quiz task.
- Mobile ad previews: tiles and CTA controls must remain usable at 390px without horizontal overflow or tap targets below 44px. Test in the ad-preview task.

---

### Task 1: Add lead and suggestion data contracts

**Files:**
- Modify: `src/db/schema.ts`
- Create: `drizzle/0035_guide_leads_and_suggestion_contacts.sql`
- Create: `src/lib/guide-lead-policy.ts`
- Test: `src/lib/__tests__/guide-lead-policy.test.ts`
- Test: `src/lib/__tests__/suggestion-validation.test.ts`

**Interfaces:**
- Produces `GUIDE_LEAD_ASSET_ID`, `GUIDE_LEAD_TOKEN_TTL_SECONDS`, `GUIDE_LEAD_MAX_DOWNLOADS`, normalized contact helpers, and validation schemas consumed by Tasks 2 and 3.
- Produces `guideLeadRequests` and contact fields on `partnerSuggestions`; migration is generated/reviewable but not applied remotely.

- [ ] **Step 1: Write failing policy tests**

  Cover e-mail normalization, phone normalization, token expiry, token hash comparison, the
  main guide asset id, the 24-hour token TTL, the two-download local policy, and suggestion
  validation requiring one contact channel plus explicit consent.

- [ ] **Step 2: Run focused tests and verify they fail**

  Run: `npx tsx --test src/lib/__tests__/guide-lead-policy.test.ts src/lib/__tests__/suggestion-validation.test.ts`

  Expected: FAIL because the policy module and schemas do not exist.

- [ ] **Step 3: Implement typed policy and schema**

  Define `GuideLeadInput`, `SuggestionContactInput`, `normalizeEmail`, `normalizePhone`,
  `hashGuideLeadToken`, and `isGuideLeadTokenExpired` in `src/lib/guide-lead-policy.ts`.
  Use the exact limits from the design: e-mail max 255, phone max 30, name max 120,
  URL max 500, reason max 2,000, token TTL 86,400 seconds, and max two downloads.

- [ ] **Step 4: Add Drizzle tables and additive SQL**

  Add `guideLeadRequests` with UUID id, normalized e-mail, optional phone, consent flags,
  token hash, expiry, download count, status, delivery timestamps, and created/updated
  timestamps. Add nullable `email`, `phone`, and `contactConsentConfirmed` fields to
  `partnerSuggestions`. Generate the migration using the repository's existing Drizzle
  command, then review the SQL for additive changes only.

- [ ] **Step 5: Run tests and schema checks**

  Run: `npx tsx --test src/lib/__tests__/guide-lead-policy.test.ts src/lib/__tests__/suggestion-validation.test.ts`

  Expected: PASS with all limits and normalization assertions.

- [ ] **Step 6: Commit the data-contract slice**

  ```bash
  git add src/db/schema.ts src/lib/guide-lead-policy.ts src/lib/__tests__/guide-lead-policy.test.ts src/lib/__tests__/suggestion-validation.test.ts drizzle/0035_guide_leads_and_suggestion_contacts.sql
  git commit -m "feat: add lead delivery data contracts"
  ```

### Task 2: Replace Formspree with protected lead delivery

**Files:**
- Create: `src/lib/guide-lead-delivery.ts`
- Create: `src/lib/email/resend.ts`
- Create: `src/actions/guide-leads.ts`
- Create: `src/app/api/downloads/guide-lead/route.ts`
- Modify: `src/components/income/lead-capture-form.tsx`
- Modify: `src/env.ts`
- Modify: `.env.example`
- Test: `src/lib/__tests__/guide-lead-delivery.test.ts`
- Test: `src/lib/__tests__/resend-email.test.ts`
- Test: `e2e/guide-lead-delivery.spec.ts`

**Interfaces:**
- Consumes Task 1 policy and `getGuideAsset()` from `src/lib/guide-assets.ts`.
- Produces `requestGuideLead(input: GuideLeadInput): Promise<GuideLeadResult>`.
- Produces `sendGuideDeliveryEmail(input: GuideDeliveryEmailInput): Promise<EmailDeliveryResult>`.
- `GuideLeadResult` returns `status: 'sent' | 'preview' | 'duplicate'`, an optional preview
  download URL, and a user-safe message; it never returns the raw token in production.

- [ ] **Step 1: Write failing unit tests**

  Test creation of a hashed token, duplicate blocking for an active e-mail token, preview
  response with a protected link, Resend request shape without logging the API key, explicit
  failure when `EMAIL_DELIVERY_MODE=resend` lacks `RESEND_API_KEY`, and download rejection
  after expiry or download quota exhaustion.

- [ ] **Step 2: Run focused tests and verify they fail**

  Run: `npx tsx --test src/lib/__tests__/guide-lead-delivery.test.ts src/lib/__tests__/resend-email.test.ts`

  Expected: FAIL because the delivery service, Resend adapter, and lead route do not exist.

- [ ] **Step 3: Implement the Resend HTTP adapter**

  In `src/lib/email/resend.ts`, call `https://api.resend.com/emails` with `fetch`, using
  `RESEND_API_KEY`, `EMAIL_FROM`, optional `EMAIL_REPLY_TO`, and an HTML/text message containing
  the internal download URL. In `preview` mode, do not call the network. In `resend` mode,
  missing configuration throws a typed error surfaced by the action.

- [ ] **Step 4: Implement transactional lead creation**

  In `src/lib/guide-lead-delivery.ts`, normalize contact values, enforce the rate limit,
  look up a non-expired request by e-mail, reject it as `duplicate`, create a cryptographically
  random token, store only its hash, and call the email adapter. If delivery fails in `resend`
  mode, mark the request as failed and return an explicit error; do not report success.

- [ ] **Step 5: Implement the free download route**

  Add `GET /api/downloads/guide-lead?token=...`. Hash and validate the token, status, expiry,
  asset id, and atomic download count. Reuse private Storage signed URLs and the existing local
  development fallback. Return a redirect to Storage in configured environments and a file
  response locally; never expose a public Storage path.

- [ ] **Step 6: Wire the client form**

  Replace the Formspree request in `lead-capture-form.tsx` with the server action. Add optional
  phone, required delivery consent, optional separate news consent, accessible pending/error
  states, and a success panel with the local preview download button. Keep the existing
  `PartnerProgramCard` prop and use the main guide asset, not the paid checkout flow.

- [ ] **Step 7: Add environment documentation**

  Add `EMAIL_DELIVERY_MODE=preview|resend`, `RESEND_API_KEY`, `EMAIL_FROM`, and optional
  `EMAIL_REPLY_TO` to `src/env.ts` and `.env.example`, keeping secrets server-only. Default
  local development to preview; require explicit `resend` configuration for production.

- [ ] **Step 8: Run unit and E2E tests**

  Run: `npx tsx --test src/lib/__tests__/guide-lead-delivery.test.ts src/lib/__tests__/resend-email.test.ts`

  Expected: PASS.

  Run: `npm run test:e2e -- e2e/guide-lead-delivery.spec.ts`

  Expected: PASS in preview mode, including success, duplicate, expiry, and protected download
  behavior.

- [ ] **Step 9: Commit the delivery slice**

  ```bash
  git add src/lib/guide-lead-delivery.ts src/lib/email/resend.ts src/actions/guide-leads.ts src/app/api/downloads/guide-lead/route.ts src/components/income/lead-capture-form.tsx src/env.ts .env.example src/lib/__tests__/guide-lead-delivery.test.ts src/lib/__tests__/resend-email.test.ts e2e/guide-lead-delivery.spec.ts
  git commit -m "feat: deliver guide leads through protected links"
  ```

### Task 3: Restore the PDF form near the platform-page footer

**Files:**
- Modify: `src/app/programas/[slug]/page.tsx`
- Modify: `docs/architecture.md`
- Modify: `README.md`
- Modify: `AI-CONTEXT.md`
- Test: `e2e/program-catalog.spec.ts`

**Interfaces:**
- Consumes `LeadCaptureForm` from Task 2 and the existing published `PartnerProgramCard`.
- Produces the same footer-adjacent editorial surface on every complete platform page without
  changing the paid `/guias/renda-extra` route.

- [ ] **Step 1: Add the failing page test**

  Assert that a complete platform page contains the “Receba o guia detalhado” form below the
  main content and before the partnership disclosure/footer area, while `/guias/renda-extra`
  remains a purchase/ subscription page.

- [ ] **Step 2: Run the focused E2E test and verify it fails**

  Run: `npm run test:e2e -- e2e/program-catalog.spec.ts -g "guia detalhado"`

  Expected: FAIL because the form is not mounted on the complete page.

- [ ] **Step 3: Mount the form at the documented footer boundary**

  Render `LeadCaptureForm` after the platform detail content and before the existing
  `AffiliateDisclaimer` block. Pass the page's program data and keep the form out of cards,
  the home page, and the paid guide landing page.

- [ ] **Step 4: Update documentation**

  Document that the form is a free, protected lead-delivery surface near the complete-page
  footer, that paid assets remain under the paid download route, and that Resend production
  setup is manual.

- [ ] **Step 5: Run the focused E2E test**

  Run: `npm run test:e2e -- e2e/program-catalog.spec.ts -g "guia detalhado"`

  Expected: PASS.

- [ ] **Step 6: Commit the footer integration**

  ```bash
  git add src/app/programas/[slug]/page.tsx e2e/program-catalog.spec.ts docs/architecture.md README.md AI-CONTEXT.md
  git commit -m "feat: restore guide capture near program footer"
  ```

### Task 4: Harden opportunity suggestions and capture authorized contact

**Files:**
- Modify: `src/actions/partner-programs.ts`
- Modify: `src/components/partner-programs-browser.tsx`
- Modify: `src/app/programas/admin/page.tsx`
- Test: `src/lib/__tests__/suggestion-validation.test.ts`
- Test: `e2e/program-catalog.spec.ts`

**Interfaces:**
- Consumes Task 1 suggestion validation policy.
- Produces the existing `submitPartnerSuggestion` action with strict validation and persisted
  contact fields; admin output includes contact only inside the existing protected admin page.

- [ ] **Step 1: Extend failing validation tests**

  Assert rejection for missing contacts, invalid e-mail, invalid phone, unsupported URL protocol,
  overlong fields, and non-empty honeypot. Assert acceptance for valid e-mail-only and phone-only
  suggestions with consent.

- [ ] **Step 2: Implement strict action validation**

  Parse all fields from `FormData`, enforce the shared limits, normalize contact values,
  require e-mail or phone, require contact consent, reject the honeypot, preserve rate limiting,
  and insert only validated values. Return repository-standard user-safe errors.

- [ ] **Step 3: Update the suggestion form**

  Add e-mail, phone, consent checkbox, and hidden honeypot inputs. Preserve the existing
  `useActionState`/`useFormStatus` feedback and make the requirement clear without exposing
  administrative details.

- [ ] **Step 4: Update the protected admin view**

  Show submitted e-mail and phone only in `/programas/admin`, with safe text rendering and no
  public rendering or analytics event containing the values.

- [ ] **Step 5: Run focused tests**

  Run: `npx tsx --test src/lib/__tests__/suggestion-validation.test.ts`

  Expected: PASS.

  Run: `npm run test:e2e -- e2e/program-catalog.spec.ts -g "sugestão"`

  Expected: PASS for validation, pending state, success, and error feedback.

- [ ] **Step 6: Commit the suggestion slice**

  ```bash
  git add src/actions/partner-programs.ts src/components/partner-programs-browser.tsx src/app/programas/admin/page.tsx src/lib/__tests__/suggestion-validation.test.ts e2e/program-catalog.spec.ts
  git commit -m "feat: validate suggestion contacts"
  ```

### Task 5: Enrich interactive guide results with affiliate steps

**Files:**
- Modify: `src/components/income/income-wizard.tsx`
- Create: `src/components/income/income-wizard-result-card.tsx`
- Modify: `src/lib/program-first-withdrawal.ts`
- Test: `e2e/income-wizard.spec.ts`

**Interfaces:**
- Consumes `PartnerProgramCard`, `getFirstWithdrawalGuide()`, the existing `OutboundLink`, and
  the existing share/favorite behavior.
- Produces `IncomeWizardResultCard` with a canonical fallback website URL, optional affiliate
  CTA marked sponsored, a compact how-it-works summary, and first-withdrawal steps.

- [ ] **Step 1: Write the failing E2E test**

  Assert that a result with an affiliate URL renders “Acessar plataforma”, partnership
  disclosure, summary, and ordered first-withdrawal steps. Assert that a result without an
  affiliate URL uses the website URL and does not render a sponsored marker.

- [ ] **Step 2: Run the E2E test and verify it fails**

  Run: `npx playwright test e2e/income-wizard.spec.ts -g "passo a passo"`

  Expected: FAIL because the result card does not exist.

- [ ] **Step 3: Implement the focused result card**

  Keep the copy compact enough for the recommendation view. Reuse editorial guide data rather
  than duplicating platform-specific steps. Render missing guide data as a truthful “confira
  as regras da plataforma” state.

- [ ] **Step 4: Replace the result markup in `IncomeWizard`**

  Preserve recommendation ordering, WhatsApp/copy actions, favorites, and navigation to the full
  platform page. Add the affiliate CTA only after the user receives the recommendation.

- [ ] **Step 5: Run the E2E test**

  Run: `npm run test:e2e -- e2e/income-wizard.spec.ts`

  Expected: PASS for recommendation, CTA, disclosure, and fallback link behavior.

- [ ] **Step 6: Commit the guide-result slice**

  ```bash
  git add src/components/income/income-wizard.tsx src/components/income/income-wizard-result-card.tsx src/lib/program-first-withdrawal.ts e2e/income-wizard.spec.ts
  git commit -m "feat: add affiliate steps to guide results"
  ```

### Task 6: Add projection and ad prelaunch previews

**Files:**
- Create: `src/lib/analytics/november-projection.ts`
- Create: `src/app/api/analytics/projection/route.ts`
- Create: `src/components/ads/ad-preview-tile.tsx`
- Create: `src/components/ads/native-ad-preview.tsx`
- Create: `src/app/anuncie/page.tsx`
- Create: `src/app/mural-de-parceiros/page.tsx`
- Modify: `src/lib/site.ts`
- Modify: `.env.example`
- Test: `src/lib/analytics/__tests__/november-projection.test.ts`
- Test: `e2e/ad-previews.spec.ts`

**Interfaces:**
- Produces `calculateNovemberProjection(input: ProjectionInput): ProjectionResult`.
- Produces `GET /api/analytics/projection` returning typed `{ currentViews, projectedNovember, averageDailyViews, source }`.
- Produces mobile-first, non-clickable inventory previews with a CTA to `/anuncie`.

- [ ] **Step 1: Write failing projection tests**

  Cover a seven-day average, remaining days in the target month, zero/negative inputs,
  configured fallback values, and `source: 'configured-preview'` when GA4 is not connected.

- [ ] **Step 2: Run tests and verify they fail**

  Run: `npx tsx --test src/lib/analytics/__tests__/november-projection.test.ts`

  Expected: FAIL because the projection module does not exist.

- [ ] **Step 3: Implement deterministic projection**

  Calculate current views plus `averageDailyViews * remainingDays`, with integer rounding and
  explicit source metadata. Read a server-only configured preview baseline; do not claim GA4
  accuracy without authenticated analytics data.

- [ ] **Step 4: Add the projection route**

  Return the typed payload without exposing secrets. Return a clear 503/configuration response
  when no preview baseline is configured rather than inventing a number.

- [ ] **Step 5: Build ad preview components and pages**

  Add labeled “Publicidade”/“Prévia” surfaces, R$ 19,90 mural blocks, R$ 49,90 native-lot
  preview, responsive 1:1 tiles, minimum 44px touch targets, and a projection CTA. Keep all
  destination URLs internal until real inventory and moderation exist.

- [ ] **Step 6: Add local visual E2E coverage**

  Assert `/anuncie` and `/mural-de-parceiros` load, show explicit preview wording, contain no
  horizontal overflow at 390px, and preserve usable CTA/tile dimensions.

- [ ] **Step 7: Run focused tests**

  Run: `npx tsx --test src/lib/analytics/__tests__/november-projection.test.ts`

  Expected: PASS.

  Run: `npm run test:e2e -- e2e/ad-previews.spec.ts`

  Expected: PASS at mobile and desktop viewport sizes.

- [ ] **Step 8: Commit the ad-preview slice**

  ```bash
  git add src/lib/analytics/november-projection.ts src/app/api/analytics/projection/route.ts src/components/ads/ad-preview-tile.tsx src/components/ads/native-ad-preview.tsx src/app/anuncie/page.tsx src/app/mural-de-parceiros/page.tsx src/lib/site.ts .env.example src/lib/analytics/__tests__/november-projection.test.ts e2e/ad-previews.spec.ts
  git commit -m "feat: add ad prelaunch previews"
  ```

### Task 7: Add the NKL Renda Extra cover asset

**Files:**
- Create: `public/NKLRENDAEXTRA.PNG`
- Modify: `src/app/guias/renda-extra/page.tsx`
- Test: `e2e/guide-landing.spec.ts`

**Interfaces:**
- Produces a fixed-dimension cover used by the paid guide landing without changing checkout.

- [ ] **Step 1: Add the failing asset assertion**

  Assert that the paid guide page renders `/NKLRENDAEXTRA.PNG` with explicit width/height,
  accessible alt text, and no layout-shift-prone unconstrained image.

- [ ] **Step 2: Run the focused test and verify it fails**

  Run: `npm run test:e2e -- e2e/guide-landing.spec.ts -g "capa"`

  Expected: FAIL because the page currently renders a CSS-only mock cover.

- [ ] **Step 3: Create and wire the cover**

  Create the requested PNG using the existing Portal NKL visual language, optimize dimensions
  for the guide card, and render it through `next/image` with explicit dimensions. Do not add a
  new image dependency or move secret/private assets into `public/`.

- [ ] **Step 4: Run the focused E2E test**

  Run: `npm run test:e2e -- e2e/guide-landing.spec.ts -g "capa"`

  Expected: PASS.

- [ ] **Step 5: Commit the cover slice**

  ```bash
  git add public/NKLRENDAEXTRA.PNG src/app/guias/renda-extra/page.tsx e2e/guide-landing.spec.ts
  git commit -m "feat: add renda extra guide cover"
  ```

### Task 8: Full local verification and handoff

**Files:**
- Modify: `docs/quality.md`
- Modify: `docs/architecture.md`
- Modify: `.env.example`

- [ ] **Step 1: Review the diff and generated SQL**

  Confirm no secrets, public PDF paths, Formspree endpoint, real ad checkout, or remote migration
  command was introduced. Confirm the new migration is additive and not applied to production.

- [ ] **Step 2: Run focused suites together**

  Run: `npx tsx --test src/lib/__tests__/guide-lead-policy.test.ts src/lib/__tests__/guide-lead-delivery.test.ts src/lib/__tests__/resend-email.test.ts src/lib/__tests__/suggestion-validation.test.ts src/lib/analytics/__tests__/november-projection.test.ts`

  Expected: PASS.

  Run: `npm run test:e2e -- e2e/guide-lead-delivery.spec.ts e2e/program-catalog.spec.ts e2e/income-wizard.spec.ts e2e/ad-previews.spec.ts e2e/guide-landing.spec.ts`

  Expected: PASS, excluding only documented pre-existing failures.

- [ ] **Step 3: Run the production verification command**

  Run: `npm run verify`

  Expected: typecheck, lint, build, and repository verification pass.

- [ ] **Step 4: Start local preview and inspect**

  Run: `npm run dev`.

  Inspect `/programas/<slug>`, `/programas`, `/anuncie`, `/mural-de-parceiros`, and
  `/guias/renda-extra` at 390px and desktop widths. Confirm the PDF button works in preview mode,
  the form is near the platform-page footer, and the ad copy does not appear as a real paid ad.

- [ ] **Step 5: Update quality documentation**

  Record the local verification commands, the preview-only ad limitation, the Resend/Vercel
  setup steps, and the fact that no remote migration or deploy occurred.

- [ ] **Step 6: Commit the verification documentation**

  ```bash
  git add docs/quality.md docs/architecture.md .env.example
  git commit -m "docs: record growth flow verification"
  ```

## Manual setup required before production

1. Create a Resend account and verify the sending domain or sender address.
2. Add `RESEND_API_KEY`, `EMAIL_FROM`, and `EMAIL_DELIVERY_MODE=resend` to the production environment.
3. Review and apply the generated Drizzle migration to the correct Supabase project through the approved migration path.
4. Confirm the private `guide-assets-private` bucket contains the main PDF at the existing asset path.
5. Run a real e-mail delivery and protected download smoke test.
6. Only after these checks, request explicit approval for deployment.
