# Simplify Income Guide Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the sales copy on `/guias/renda-extra` so visitors immediately understand what they receive.

**Architecture:** Keep the existing Next.js page and component structure. Replace only the approved Portuguese copy in the page; no analytics, checkout, pricing, or layout behavior changes.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-11-11-simplify-income-guide-copy-design.md`

## Global Constraints

- Preserve the existing page structure, styles, prices, checkout handlers, and offer variants.
- Use the exact approved copy from the design spec.
- Do not promise guaranteed income or results.

## Review Focus

- Confirm the main description explains the weekly PDF in plain language: owned by Task 1.
- Confirm the cover and benefit list use consistent wording: owned by Task 1.
- Confirm the monthly subscription text remains accurate and does not change its price or payment behavior: owned by Task 1.

---

### Task 1: Simplify the income guide copy

**Files:**
- Modify: `src/app/guias/renda-extra/page.tsx:38-64`
- Spec: `docs/superpowers/specs/2026-11-11-simplify-income-guide-copy-design.md`

**Interfaces:**
- Consumes: Existing `IncomeGuidePage` props, offer variants, and checkout components.
- Produces: The same rendered page and interactions with clearer Portuguese copy.

- [ ] **Step 1: Replace the main description**

Update the paragraph below the page heading to the exact approved description in the spec.

- [ ] **Step 2: Replace the PDF cover labels**

Update the cover title and three supporting labels to the exact approved cover text. Keep the `PDF` and `Portal NKL` labels unchanged.

- [ ] **Step 3: Replace the benefit list**

Update the four list items to the exact approved benefit text. Keep the existing list markup, styling, and keys valid.

- [ ] **Step 4: Simplify the monthly subscription description**

Replace only the paragraph describing the monthly subscription. Keep the heading, price `R$ 19/mês`, subscription button, and offer variant unchanged.

- [ ] **Step 5: Verify the changed page**

Run: `npx eslint src/app/guias/renda-extra/page.tsx`

Expected: no errors.

Open `/guias/renda-extra` and confirm the new copy is visible, the two checkout options remain available, and the displayed price is unchanged.

- [ ] **Step 6: Review the diff**

Run: `git --no-pager diff -- src/app/guias/renda-extra/page.tsx`

Expected: only the intended copy changes are present.
