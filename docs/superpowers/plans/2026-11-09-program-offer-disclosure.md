# Program Offer and Disclosure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace nested premium-card promotion with a compact secondary-view advertisement, scope Buy Me a Coffee invitation copy to its own opportunity, and collapse affiliate disclosure everywhere it appears.

**Architecture:** Keep the existing `program-secondary-cta` experiment and analytics contract, but render its content through a focused compact component instead of the full `NativeAdCard`. Make `AffiliateDisclaimer` a reusable collapsed disclosure and keep catalog cards focused on discovery.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Playwright E2E, existing analytics helpers.

**Spec:** `docs/superpowers/specs/2026-11-09-program-offer-disclosure-design.md`

## Global Constraints

- “The initial `/programas` cards” must remain focused on discovery and must not show the secondary recommendation.
- “Show a compact rectangular recommendation in the modal and individual opportunity page”.
- “Keep ‘Convidar no Buy Me a Coffee’ exclusive to the Buy Me a Coffee opportunity card.”
- “Keep the affiliate disclosure available everywhere it is relevant, but collapsed by default with a clear way to expand it.”
- Preserve existing CTA attribution, consent behavior, sponsored-link semantics, and analytics.
- Do not apply production migrations or expose secrets.

## Review Focus

- The initial catalog card must not contain “Conteúdo Premium” or the secondary CTA.
- The opportunity modal and `/programas/[slug]` page must show one compact recommendation with a working attributed CTA.
- The Buy Me a Coffee invite link must not appear in the global footer or unrelated opportunity cards.
- The affiliate disclosure must be collapsed on initial render but accessible by keyboard and expandable.
- Existing impression, click, consent, sponsored-link, and checkout attribution behavior must remain intact.

---

### Task 1: Creating the compact secondary offer

**Files:**
- Create: `src/components/income/compact-secondary-offer.tsx`
- Modify: `src/components/income/program-secondary-offer.tsx`
- Modify: `src/components/partner-programs-browser.tsx`
- Modify: `src/app/programas/[slug]/page.tsx`
- Test: `e2e/program-catalog.spec.ts`

**Interfaces:**
- Consumes: `program-secondary-cta` variant selection from `ProgramSecondaryOffer` and the existing `NativeAdCard` strategy copy/CTA contract.
- Produces: `CompactSecondaryOffer` accepting `{ variant: string; programSlug: string; currentPage: number }` and preserving impression/click tracking for the selected CTA.

- [ ] **Step 1: Write failing E2E assertions**

Add assertions that the initial `/programas` card has no `Conteúdo Premium`, while the opportunity modal and individual page contain a compact rectangular recommendation with the selected CTA and `cta_variant=0|1|2`.

- [ ] **Step 2: Run the focused tests**

Run: `npx playwright test e2e/program-catalog.spec.ts -g "oferta|CTA|modal" --reporter=line`

Expected: FAIL because the current secondary offer renders the full premium card and the individual page has no secondary offer.

- [ ] **Step 3: Implement `CompactSecondaryOffer`**

Move only the secondary-strategy presentation and its existing tracking behavior into the new component. Render a rectangular, visually distinct announcement with a small editorial label, title, description, and one CTA link. Do not render it in the initial catalog card.

- [ ] **Step 4: Wire secondary surfaces**

Use the compact component in the opportunity modal and the individual opportunity page. Keep variant persistence, API fallback, `impression`, `click`, consent gating, and `cta_variant` propagation unchanged.

- [ ] **Step 5: Run focused tests**

Run: `npx playwright test e2e/program-catalog.spec.ts -g "oferta|CTA|modal" --reporter=line`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/income/compact-secondary-offer.tsx src/components/income/program-secondary-offer.tsx src/components/partner-programs-browser.tsx src/app/programas/[slug]/page.tsx e2e/program-catalog.spec.ts
git commit -m "fix: render compact secondary catalog offers"
```

### Task 2: Scoping Buy Me a Coffee and collapsing disclosure

**Files:**
- Modify: `src/components/affiliate-disclaimer.tsx`
- Modify: `src/components/footer.tsx`
- Modify: `src/components/partner-programs-browser.tsx`
- Modify: `src/app/programas/[slug]/page.tsx`
- Modify: `src/app/contatos/page.tsx`
- Test: `e2e/program-catalog.spec.ts`

**Interfaces:**
- Consumes: Existing `AffiliateDisclaimer` call sites and `PartnerProgramCard.slug`.
- Produces: A closed-by-default disclosure component and a Buy Me a Coffee-only invite CTA.

- [ ] **Step 1: Write failing E2E assertions**

Assert the disclosure text is not visible until its summary is activated, the footer does not contain “Convidar no Buy Me a Coffee”, and the Buy Me a Coffee opportunity contains that invite link while another opportunity does not.

- [ ] **Step 2: Run focused tests**

Run: `npx playwright test e2e/program-catalog.spec.ts -g "parceria|Buy Me a Coffee|disclosure" --reporter=line`

Expected: FAIL because the disclosure is always expanded and the invite link is currently global.

- [ ] **Step 3: Implement the collapsed disclosure**

Change `AffiliateDisclaimer` to a semantic `<details>` with an explicit summary such as “Sobre links de parceria”. Preserve the exact legal copy and ensure the summary has visible focus and touch-friendly sizing.

- [ ] **Step 4: Scope the invite CTA**

Remove the invite CTA from the global footer. Render it only when the program slug identifies Buy Me a Coffee, using the supplied invite URL and sponsored/external-link safety attributes consistent with existing outbound links.

- [ ] **Step 5: Run focused tests**

Run: `npx playwright test e2e/program-catalog.spec.ts -g "parceria|Buy Me a Coffee|disclosure" --reporter=line`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/affiliate-disclaimer.tsx src/components/footer.tsx src/components/partner-programs-browser.tsx src/app/programas/[slug]/page.tsx src/app/contatos/page.tsx e2e/program-catalog.spec.ts
git commit -m "fix: scope partner disclosure and invite CTA"
```

### Task 3: Verifying production behavior

**Files:**
- Modify: `docs/quality.md`
- Modify: `docs/architecture.md`

**Interfaces:**
- Consumes: Completed compact offer and disclosure behavior from Tasks 1–2.
- Produces: Documented validation and deployment evidence.

- [ ] **Step 1: Run the complete focused suite**

Run: `npx playwright test e2e/program-catalog.spec.ts --reporter=line`

Expected: All applicable catalog tests pass; any intentionally skipped provider test is reported with its missing environment variable.

- [ ] **Step 2: Run quality gates**

Run: `npm run verify`

Expected: lint, typecheck, and production build pass; only documented legacy warnings remain.

- [ ] **Step 3: Update documentation**

Record the collapsed disclosure, compact secondary surfaces, Buy Me a Coffee scoping, and exact validation commands in the quality/architecture docs.

- [ ] **Step 4: Commit documentation**

```bash
git add docs/quality.md docs/architecture.md
git commit -m "docs: record offer and disclosure validation"
```

- [ ] **Step 5: Deploy and verify**

Run the repository’s approved Vercel production deployment command, then verify `/programas`, one Buy Me a Coffee opportunity, one unrelated opportunity, and `/guias/renda-extra` return HTTP 200 and contain the expected scoped content.
