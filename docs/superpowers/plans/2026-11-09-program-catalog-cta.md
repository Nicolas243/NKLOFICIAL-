# Program Catalog CTA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ordenar o catálogo de oportunidades por recomendação editorial e medir CTAs comerciais persistentes nas visualizações secundárias sem bloquear a navegação.

**Architecture:** Um helper puro concentra a comparação de relevância editorial. Um experimento de CTA reutiliza `guide_offer_events`, escolhe variantes equilibradas no route handler e persiste a atribuição no navegador. Um componente secundário reutiliza o card nativo existente, propaga `cta_variant` até a página do Guia e registra o funil em GA, PostHog e no banco local quando consentido/disponível.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Drizzle/Postgres, Tailwind v4, Playwright, Google Analytics, PostHog e Microsoft Clarity.

**Spec:** `docs/superpowers/specs/2026-11-09-program-catalog-cta-design.md`

## Global Constraints

- Preservar Next.js 16, React, TypeScript strict, Drizzle, Supabase e Tailwind.
- Reutilizar `guideOfferEvents` e o fluxo de `offerVariant` já existente, sem migração se os valores continuarem em colunas `varchar`.
- Manter consentimento e não enviar dados pessoais aos provedores de analytics.
- Falhas de telemetria não podem impedir abrir uma oportunidade ou acessar o checkout.
- O card do grid inicial continua no experimento `native-card`; `program-secondary-cta` fica restrito à visualização secundária.
- As três variantes devem manter o mesmo produto, preço, condições e destino; somente a mensagem muda.
- O mínimo de exposição por variante é 40 impressões; empates usam o menor identificador numérico.
- A URL de atribuição aceita somente `cta_variant=0|1|2`; valores inválidos caem no fluxo `sales-page`.

## Review Focus

- O selo editorial precisa vencer a nota e o nome na ordenação padrão, sem inverter a prioridade quando o usuário escolhe `Relevância`; teste no catálogo com o primeiro card.
- Todas as tags devem continuar acessíveis sem truncamento ou botão “Ler mais” próprio; teste o container de tags.
- A API deve rejeitar experimento, variante e evento desconhecidos sem alterar o comportamento legado do popup; teste payloads inválidos e compatibilidade.
- Fechar e reabrir o mesmo modal não deve duplicar a impressão, mas outra oportunidade deve poder registrar uma nova impressão; teste com `sessionStorage`.
- `cta_variant` ausente, inválido ou manipulado não pode gerar `offerVariant` arbitrário no checkout; teste os três estados na página do Guia.

---

### Task 1: Ordenação editorial e tags sem expansor

**Files:**
- Create: `src/lib/partner-program-sorting.ts`
- Modify: `src/components/partner-programs-browser.tsx`
- Modify: `src/components/income/smart-tag-list.tsx`
- Create: `e2e/program-catalog.spec.ts`

**Interfaces:**
- Produces `comparePartnerProgramRelevance(left, right)` and
  `hasBeginnerEditorialTag(tags)` in `src/lib/partner-program-sorting.ts`.
- `PartnerProgramsBrowser` uses the helper only for `sort === 'relevancia'`;
  explicit `nota`, `ganhos` and `nome` behavior remains unchanged.

- [ ] **Step 1: Write the failing E2E assertions**

  In `e2e/program-catalog.spec.ts`, add a test that opens `/programas`,
  selects the first article under `#programs-grid`, asserts that it contains
  `Melhor para Começar`, and asserts that its tag container contains no
  button named `Ler mais`. Add a second test that clicks the first card’s
  existing main `Ler mais` action and asserts the opportunity dialog opens.

- [ ] **Step 2: Run the focused tests and verify the new behavior is not yet guaranteed**

  Run: `npx playwright test e2e/program-catalog.spec.ts`

  Expected: the tag assertion fails because `SmartTagList` still renders its
  own `Ler mais` button; record the exact failure before editing.

- [ ] **Step 3: Implement the pure relevance comparator**

  In `src/lib/partner-program-sorting.ts`, implement
  `hasBeginnerEditorialTag(tags: readonly string[]): boolean` using the exact
  tag `Melhor para Começar`, and
  `comparePartnerProgramRelevance(left: PartnerProgramRelevanceInput, right:
  PartnerProgramRelevanceInput): number` with this order:
  beginner tag first, `finalRating` descending, then `name.localeCompare` with
  `pt-BR`. Export a small structural input type instead of importing the
  server action module at runtime.

- [ ] **Step 4: Wire relevance and remove tag truncation**

  Replace the alphabetical `relevancia` branch in
  `PartnerProgramsBrowser` with the comparator. Refactor `SmartTagList` to
  keep local click ranking and priority ordering but render every ordered tag
  in the wrapping container without `isExpanded`, fixed max height or its
  “Ler mais/Ler menos” button. Add a stable `data-testid="program-tags"`
  marker for the E2E assertion. Keep the card’s separate main `Ler mais`
  button untouched.

- [ ] **Step 5: Run the focused tests and type-check**

  Run: `npx playwright test e2e/program-catalog.spec.ts && npm run typecheck`

  Expected: both catalog tests pass and TypeScript reports no errors.

### Task 2: Experiment contract and balanced server selection

**Files:**
- Create: `src/lib/offer-experiment.ts`
- Modify: `src/app/api/sales/offer-events/route.ts`

**Interfaces:**
- Produces `PROGRAM_SECONDARY_CTA_EXPERIMENT`,
  `PROGRAM_SECONDARY_CTA_VARIANTS`,
  `parseProgramSecondaryCtaVariant(value)`,
  `getOfferExperimentFromVariant(value)`, and
  `chooseBalancedVariant(stats, variants, minimumExposures)`.
- The route accepts `GET ?experiment=exit-popup|program-secondary-cta` and
  POST event types `impression`, `click`, `checkout`, and `conversion`.

- [ ] **Step 1: Add focused contract checks to the catalog E2E/API test file**

  Add request assertions for `POST /api/sales/offer-events` with an unknown
  experiment, variant `9`, and event `checkout` on the new experiment. Expect
  `400` for the first two and `201` for a valid new event. Add a request for
  `GET /api/sales/offer-events?experiment=program-secondary-cta` and assert a
  valid variant when the test database is available.

- [ ] **Step 2: Implement shared experiment constants and validation**

  In `src/lib/offer-experiment.ts`, define the three string variants `0`, `1`,
  `2`, the experiment name, and validation that returns `null` for absent or
  invalid values. Parse only the first two colon-separated segments for an
  existing `offerVariant`; never accept arbitrary query text as a program
  secondary variant.

- [ ] **Step 3: Generalize route selection without changing legacy defaults**

  Refactor the route’s stats query and selector so each allowed experiment has
  its own allowed variant list. Preserve a no-query GET as the current
  `exit-popup` behavior. Use 40 as the minimum exposure threshold; below it,
  choose the least-exposed variant with numeric tie-break, and after it,
  choose the highest `conversion / impression` rate with the same stable
  tie-break. Extend POST validation for the new event types and write the
  existing `guideOfferEvents` row shape unchanged.

- [ ] **Step 4: Run focused validation**

  Run: `npx playwright test e2e/program-catalog.spec.ts -g "experimento|evento"`

  Expected: invalid payloads return `400`, valid `checkout` is accepted, and
  the selector returns only `0`, `1` or `2` for the new experiment. If the
  remote database is unavailable, the route must return its existing explicit
  `503` error rather than a success-shaped fallback.

### Task 3: Persistent secondary offer and card instrumentation

**Files:**
- Create: `src/components/income/program-secondary-offer.tsx`
- Modify: `src/components/income/native-ad-card.tsx`
- Modify: `src/components/partner-programs-browser.tsx`
- Modify: `src/lib/analytics.ts`
- Modify: `src/components/privacy-scripts.tsx`

**Interfaces:**
- `ProgramSecondaryOffer({ programSlug, currentPage })` loads and persists one
  `ProgramSecondaryCtaVariant`, then renders the secondary offer.
- `NativeAdCard` accepts optional
  `{ experiment?: 'native-card' | 'program-secondary-cta'; variant?: string; impressionKey?: string }`
  while preserving its current `currentPage`-based grid behavior.
- `trackOfferFunnelEvent(offerVariant, eventType)` posts only valid attribution
  events and returns without throwing when the browser is unavailable.

- [ ] **Step 1: Add the modal-level failing assertion**

  Extend `e2e/program-catalog.spec.ts` to open an opportunity, wait for a
  heading matching one of the three CTA titles, click its CTA, and assert the
  destination contains `cta_variant=0`, `cta_variant=1` or `cta_variant=2`.
  Seed `localStorage` with `nkl_program_secondary_cta_variant_v1=1` in a
  separate test and assert the variant-1 copy is stable after a reload.

- [ ] **Step 2: Implement consent-aware funnel helpers**

  Extend `src/lib/analytics.ts` with a typed `trackOfferFunnelEvent` helper
  that maps `program-secondary-cta:<variant>` to the server event endpoint and
  also sends an aggregated GA event. Expose the initialized PostHog client
  through the existing consent-controlled browser boundary, and have the
  helper call `posthog.capture` only when that client exists. Do not include
  email, affiliate URL or free-form user data.

- [ ] **Step 3: Implement persistent variant assignment**

  In `ProgramSecondaryOffer`, use the versioned localStorage key
  `nkl_program_secondary_cta_variant_v1`. Reuse a valid stored value; otherwise
  request `GET /api/sales/offer-events?experiment=program-secondary-cta`, save
  its valid result, and use a random valid fallback only after logging the
  failed request. Pass an impression key scoped to
  `program-secondary-cta:<programSlug>` so the same opportunity is not counted
  twice during one browser session.

- [ ] **Step 4: Make the native card data-driven**

  Add the exact three secondary copy records from the design spec. For the new
  experiment, build the link as
  `/guias/renda-extra?cta_variant=<variant>`, send one `impression` on first
  visible mount, and send `click` on the primary CTA before navigation. Keep
  the existing six native-card strategies, URLs, share behavior and event
  names unchanged for the grid.

- [ ] **Step 5: Insert the offer in the opportunity dialog**

  Render `ProgramSecondaryOffer` after the selected program’s summary and
  before long secondary content, passing the selected slug and current page.
  Keep the modal’s scroll lock, Escape handling, focus restoration and close
  behavior intact.

- [ ] **Step 6: Run focused UI validation**

  Run: `npx playwright test e2e/program-catalog.spec.ts`

  Expected: the modal shows the persisted variant, the CTA link contains a
  validated `cta_variant`, the same opportunity does not duplicate its
  impression in one session, and the existing grid native card still renders.

### Task 4: Propagate attribution through the Guide and checkout

**Files:**
- Modify: `src/app/guias/renda-extra/page.tsx`
- Modify: `src/components/sales/guide-checkout-button.tsx`
- Modify: `src/components/sales/guide-subscription-button.tsx`
- Modify: `src/components/privacy-scripts.tsx`
- Modify: `src/lib/analytics.ts`

**Interfaces:**
- `IncomeGuidePage` accepts `searchParams.cta_variant` and converts valid
  values to `program-secondary-cta:<variant>`.
- Both checkout components call `trackOfferFunnelEvent(..., 'checkout')`
  exactly when the user chooses Mercado Pago or Hotmart, before navigation or
  the provider request.

- [ ] **Step 1: Add failing attribution assertions**

  In the E2E file, open `/guias/renda-extra?cta_variant=1` and assert that the
  page contains the subscription/checkout controls without an error. Open the
  same page with `cta_variant=invalid` and assert it still renders the normal
  sales offer. Mock the offer-event endpoint in a browser test and assert a
  checkout event is sent when a payment-provider action is selected.

- [ ] **Step 2: Parse and sanitize the source variant**

  Update the page search-param type to include `cta_variant`. Map only `0`,
  `1` and `2` to `program-secondary-cta:<variant>`, preserve the existing
  `ad_variant` handling for native cards, and use `sales-page` when neither is
  valid. Pass the resulting source to both the subscription and one-time
  checkout paths without exposing arbitrary query text.

- [ ] **Step 3: Record checkout starts in both provider paths**

  Add provider-action handlers to `GuideSubscriptionButton` and
  `GuideCheckoutButton`. Send the typed `checkout` event once per user action
  for valid program-secondary attribution, then execute the existing Mercado
  Pago or Hotmart flow. Do not delay or block navigation on the telemetry
  request.

- [ ] **Step 4: Enable consented analytics on the income portal**

  Keep GA, PostHog and Vercel Analytics behind the existing accepted-consent
  gate, but remove the income-portal exclusion that currently prevents GA from
  loading on `/programas` and `/guias/renda-extra`. Register PostHog’s
  `portal_area` as before and expose only its client capture method to the
  typed analytics helper.

- [ ] **Step 5: Run attribution validation**

  Run: `npx playwright test e2e/program-catalog.spec.ts -g "atribuição|checkout"` and `npm run typecheck`

  Expected: valid variants reach the checkout components, invalid variants
  fall back safely, and checkout telemetry is fire-and-forget.

### Task 5: Documentation and full verification

**Files:**
- Modify: `docs/architecture.md`
- Modify: `docs/quality.md`
- Modify: `e2e/program-catalog.spec.ts`

**Interfaces:**
- Documentation records the experiment name, attribution parameter, event
  meanings, consent boundary and known low-volume limitation.

- [ ] **Step 1: Complete the catalog E2E coverage**

  Add assertions for the first-card editorial ordering, tag accessibility,
  secondary offer copy, stable localStorage assignment, valid/invalid
  attribution and no-blocking fallback behavior. Keep the tests independent
  of a winning variant by accepting only the three exact copy records.

- [ ] **Step 2: Update architecture and quality records**

  Document that `program-secondary-cta` is secondary-view only, that
  `conversion` is reserved for confirmed payment, and that GA/PostHog custom
  events require accepted consent. Record the focused E2E, lint, typecheck,
  build and `verify` commands plus any existing baseline warnings.

- [ ] **Step 3: Run the complete validation gates**

  Run:

  ```powershell
  npm run lint
  npm run typecheck
  npm run build
  npx playwright test e2e/program-catalog.spec.ts
  npm run verify
  ```

  Expected: no lint errors, no TypeScript errors, production build succeeds,
  focused catalog tests pass, and `verify` completes. Leave unrelated
  pre-existing worktree changes untouched and report any known warnings rather
  than suppressing them.

