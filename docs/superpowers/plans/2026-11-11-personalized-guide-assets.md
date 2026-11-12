# Personalized Guide Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Require an authenticated Portal NKL account and CPF consent for guide purchases, associate approved Stripe purchases with that account, and deliver personalized PDF/XLSX copies from protected downloads.

**Architecture:** Keep original assets private and immutable. Store only purchase-linked personalization data, generate a copy in memory on an authenticated download request, and stream it directly without exposing originals or reusable signed URLs. Stripe remains the only active gateway; existing download quotas remain authoritative.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Drizzle/PostgreSQL, Supabase Auth/Storage, Stripe Checkout/Webhooks, `pdf-lib`, and `exceljs`.

**Spec:** `docs/superpowers/specs/2026-11-11-personalized-guide-assets-design.md`

## Global Constraints

- “O cliente precisará estar autenticado no Portal NKL.”
- “CPF será solicitado somente no momento da compra, não no cadastro geral.”
- “Não enviar os arquivos por e-mail nesta etapa.”
- “Não alterar os arquivos originais no Supabase Storage.”
- “O CPF não aparecerá em logs, URLs, analytics ou metadados públicos.”
- Stripe is the only active gateway and payment methods remain dynamic.
- Do not apply remote migrations, publish, or change production infrastructure.

## Review Focus

- A signed-in user attempting checkout without a valid CPF or consent receives a clear validation error and no pending purchase.
- A webhook cannot attach a purchase to a different user or trust customer-submitted identity.
- A download cannot be accessed without the authenticated owner and approved purchase/subscription.
- PDF/XLSX personalization preserves the original bytes in storage and does not leak CPF through logs, URLs, or analytics.
- Missing/corrupt source assets return an explicit retryable error without consuming the download quota.

---

### Task 1: Model identity and purchase personalization data

**Files:**
- Modify: `src/db/schema.ts`
- Create: `drizzle/0037_personalized_guide_access.sql`
- Create: `src/lib/guide-personalization.ts`
- Test: `src/lib/__tests__/guide-personalization.test.ts`

**Interfaces:**
- Produces `normalizeCpf(value: string): string`, `isValidCpf(value: string): boolean`, and `buildPersonalizationLabel(input): string`.
- Adds `userId`, `cpf`, `cpfConsentConfirmed`, and `personalizationId` fields required by later checkout and download tasks.

- [ ] Write failing tests for CPF normalization/check-digit validation, rejection of repeated digits, and label construction without logging.
- [ ] Run `npx tsx --test src/lib/__tests__/guide-personalization.test.ts`; expect failure because the module does not exist.
- [ ] Implement the pure validation/label helpers and additive Drizzle schema/migration fields.
- [ ] Run the focused test and `npm run typecheck`; expect all to pass.
- [ ] Commit `feat: add guide personalization identity fields`.

### Task 2: Gate guide checkout behind authentication, CPF, and consent

**Files:**
- Modify: `src/app/api/payments/create-guide-checkout/route.ts`
- Modify: `src/app/api/payments/create-guide-subscription/route.ts`
- Modify: `src/lib/stripe/guide.ts`
- Modify: `src/components/sales/guide-checkout-button.tsx`
- Modify: `src/components/sales/guide-subscription-button.tsx`
- Modify: `src/components/sales/guide-page-offer.tsx`
- Test: `src/lib/stripe/guide.test.ts`

**Interfaces:**
- Checkout routes accept `{ cpf, cpfConsentConfirmed, offerVariant }` and derive user ID, name, and email from Supabase Auth/profile.
- Stripe metadata contains only an opaque internal purchase/subscription reference; CPF never enters metadata.

- [ ] Add failing tests proving checkout parameters carry the internal reference and never CPF.
- [ ] Run the focused Stripe tests and verify the new assertions fail.
- [ ] Implement authenticated session/profile lookup, CPF validation, consent enforcement, and persistence on pending purchase/subscription rows.
- [ ] Replace the client email-only flow with CPF + consent UI and a login link for anonymous users.
- [ ] Run focused tests, typecheck, and lint on changed files.
- [ ] Commit `feat: require authenticated CPF consent for guide checkout`.

### Task 3: Associate approved Stripe payments with the authenticated owner

**Files:**
- Modify: `src/lib/stripe/webhook.ts`
- Modify: `src/app/guias/renda-extra/sucesso/page.tsx`
- Test: `src/lib/stripe/webhook.test.ts`

**Interfaces:**
- Approved purchase/subscription rows receive `userId`, `personalizationId`, and status from server-owned pending records.
- Webhook processing remains idempotent through `stripe_webhook_events`.

- [ ] Add failing webhook tests for approved purchase ownership and rejection of missing/invalid internal references.
- [ ] Run the focused webhook tests and verify failure.
- [ ] Implement ownership-preserving updates and success-page access lookup without trusting query-string identity.
- [ ] Run webhook tests and typecheck.
- [ ] Commit `feat: link guide payments to authenticated owners`.

### Task 4: Generate personalized PDF and XLSX downloads

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/lib/guide-personalizer.ts`
- Create: `src/lib/__tests__/guide-personalizer.test.ts`

**Interfaces:**
- Exports `personalizeGuideAsset(asset, source, identity): Promise<PersonalizedGuideFile>`.
- PDF output adds a low-contrast diagonal repeated watermark to every page.
- XLSX output preserves workbook sheets/formulas and adds a visible identity header/footer on every worksheet.

- [ ] Add failing tests using in-memory fixtures for PDF page count/watermark text and XLSX sheet/formula/header preservation.
- [ ] Run the focused test; expect missing dependency/module failure.
- [ ] Install `pdf-lib` and `exceljs`, implement in-memory transformations, and keep source buffers untouched.
- [ ] Run focused personalizer tests and typecheck.
- [ ] Commit `feat: personalize protected guide assets`.

### Task 5: Protect profile downloads and expose purchased materials

**Files:**
- Create: `src/app/api/downloads/personalized-guide/route.ts`
- Modify: `src/components/sales/guide-asset-downloads.tsx`
- Modify: `src/app/perfil/page.tsx`
- Create: `src/lib/__tests__/personalized-guide-access.test.ts`
- Modify: `src/lib/guide-storage.ts`

**Interfaces:**
- `POST /api/downloads/personalized-guide` accepts `{ assetId, purchaseId? , subscriptionId? }`, authenticates the session, verifies ownership/approval, reserves quota before preparation, and streams the personalized file.
- It returns 401/403/404/429/503 explicitly and never returns a source or signed URL.

- [ ] Add failing access tests for anonymous, wrong owner, unapproved, exhausted quota, and unavailable asset cases.
- [ ] Run the focused tests and verify failure.
- [ ] Implement owner checks, atomic quota reservation, personalization, direct response headers, and safe rollback on preparation failure.
- [ ] Render purchased materials in `/perfil` and update the download client to use the protected endpoint.
- [ ] Run focused tests, typecheck, lint, and the relevant E2E flow.
- [ ] Commit `feat: add authenticated personalized guide downloads`.

### Task 6: Remove active Hotmart surfaces, update privacy/configuration, and verify

**Files:**
- Modify: `.env.example`
- Modify: `src/env.ts`
- Modify: `src/app/privacidade/page.tsx`
- Modify: `docs/setup.md`
- Modify: `docs/architecture.md`
- Modify: `docs/quality.md`
- Modify: affected guide UI/routes and tests

**Interfaces:**
- Hotmart is absent from active checkout UI/routes/configuration.
- Privacy copy explains CPF purpose, retention, access control, and deletion/anonymization requests.

- [ ] Add failing assertions for no active Hotmart checkout path and presence of CPF privacy language.
- [ ] Run focused tests and verify failure.
- [ ] Remove stale active Hotmart branches/configuration while preserving unrelated historical migration records.
- [ ] Update documentation and add local-only migration/setup instructions.
- [ ] Run `npx tsx --test`, `npm run lint`, `npm run typecheck`, `npm run build`, and focused E2E.
- [ ] Commit `docs: document personalized guide access and privacy`.
