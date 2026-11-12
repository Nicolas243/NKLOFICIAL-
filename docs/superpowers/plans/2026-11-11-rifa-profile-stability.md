# Rifa and Profile Stability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the support campaign non-overlapping and keep `/perfil` usable when optional database reads fail.

**Architecture:** Centralize campaign copy and add a session-level surface lock shared by card, banner, and exit popup. Wrap only optional profile reads in explicit server-side error handling, preserving authentication and write-action failures.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Drizzle, Playwright, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-11-rifa-profile-stability-design.md`

## Global Constraints

- A campanha deve mencionar que o prêmio são **3 livros físicos**.
- Os botões devem usar apenas o texto **“Participar”**.
- Card, banner e popup não podem aparecer simultaneamente na mesma sessão.
- Não alterar o destino externo, o rastreamento UTM ou o checkout da ação.
- Não executar migration, alteração remota ou deploy.

## Review Focus

- A campanha renderiza no máximo uma superfície por sessão, inclusive após navegação entre rotas.
- Fechar ou clicar em “Participar” impede que outra superfície seja exibida na mesma sessão.
- O card, banner e popup usam o novo texto e mencionam os 3 livros físicos.
- Usuário autenticado ainda é redirecionado quando a sessão não existe.
- Falha de banco em dados opcionais não transforma a página em erro 500 nem mascara falhas de escrita.

---

### Task 1: Centralizar seleção de superfície da campanha

**Files:**
- Modify: `src/lib/rifa-campaign.ts`
- Modify: `src/components/rifa-campaign/rifa-campaign-shell.tsx`
- Modify: `src/components/rifa-campaign/rifa-campaign-card.tsx`
- Modify: `src/components/rifa-campaign/rifa-campaign-banner.tsx`
- Modify: `src/components/rifa-campaign/rifa-campaign-exit-popup.tsx`
- Test: `src/lib/rifa-campaign.test.ts`
- Test: `e2e/rifa-campaign.spec.ts`

**Interfaces:**
- Produces `RIFA_CAMPAIGN_COPY` with button-neutral copy, `3 livros físicos`, and no visible 123Rifas disclosure.
- Produces a session-level campaign lock consumed by all three surfaces.

- [x] **Step 1: Add failing unit assertions** for the exact copy: every surface mentions `3 livros físicos`, no surface copy contains `Participar por R$ 3`, and visible campaign copy does not require `123Rifas`.
- [x] **Step 2: Add a failing E2E assertion** that opening the public route and navigating does not expose more than one campaign surface in the same session.
- [x] **Step 3: Implement one session lock** in `src/lib/rifa-campaign.ts`, using a namespaced session-storage key and safe browser guards; reserve the surface before rendering and mark the session as interacted when dismissed or clicked.
- [x] **Step 4: Update the three components** to consume the shared lock and render the label `Participar`; preserve the existing rules link, UTM content, and event surfaces.
- [x] **Step 5: Run focused tests**:
  `npx tsx --test src/lib/rifa-campaign.test.ts`
  and `npx playwright test e2e/rifa-campaign.spec.ts --reporter=line`.
- [x] **Step 6: Commit** with `git commit -m "fix: avoid overlapping support campaign surfaces"`.

### Task 2: Make optional profile reads resilient

**Files:**
- Modify: `src/app/perfil/page.tsx`
- Test: `src/app/perfil/page.test.tsx` or the repository's existing profile test location, if present

**Interfaces:**
- Consumes the existing authenticated user and profile/favorites actions.
- Produces the same profile UI with empty optional sections when optional reads fail.

- [x] **Step 1: Locate or add a focused test seam** for the profile page's optional reads and assert that a rejected guide/favorites read still returns the page model with empty arrays and no thrown database error.
- [x] **Step 2: Implement explicit logging wrappers** around guide purchase/subscription reads and favorite reads; use empty values only for those optional reads and keep `redirect('/login')` unchanged.
- [x] **Step 3: Run the focused profile test or typecheck** and verify no broad catch hides the authentication or profile update action.
- [x] **Step 4: Run `npm run verify` and `npx playwright test e2e/rifa-campaign.spec.ts e2e/critical-path.spec.ts --reporter=line`.
- [x] **Step 5: Commit** with `git commit -m "fix: keep profile available during optional read failures"`.
