# SEO técnico e arquitetura editorial de renda extra Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidar os sinais técnicos do Portal NKL e organizar conteúdo público de renda extra para aumentar sua elegibilidade a buscas relevantes sem criar spam ou prometer posições.

**Architecture:** Centralizar a URL pública em um helper reutilizável e usar esse helper em metadata, JSON-LD, sitemap e robots. Manter `/programas` como catálogo canônico, preservar `/blog/renda-extra` como alias acessível e adicionar poucos hubs editoriais com links contextuais para dados reais do catálogo.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Metadata API, JSON-LD existente, Drizzle/Supabase somente para leitura do catálogo, Tailwind.

**Spec:** `docs/superpowers/specs/2026-11-09-seo-renda-extra-design.md`

## Global Constraints

- Usar `https://nkloficial.com.br` como fallback e manter `NEXT_PUBLIC_SITE_URL` como override controlado em previews e ambientes locais.
- Não garantir primeiro lugar ou ranquear para “qualquer assunto”.
- Não comprar links, publicar páginas doorway, repetir palavras-chave ou criar conteúdo sem valor.
- Não alterar banco de dados, dados de produção, campanhas de anúncios ou infraestrutura.
- Preservar Next.js 16, App Router, Supabase, Drizzle e Tailwind.
- Não afirmar remuneração, disponibilidade ou aprovação de plataformas como garantia.
- Não criar hub cujo conteúdo não possa ser preenchido com informação original e verificável.

## Review Focus

- **Domínio ausente ou com barra final:** canonical, sitemap, robots e JSON-LD devem formar URLs válidas e sem duplicar barras; testar o fallback e o override.
- **Alias legado `/blog/renda-extra`:** deve continuar acessível, apontar canonical para `/programas` e não gerar um segundo hub; testar metadata renderizada.
- **Catálogo vazio ou consulta indisponível:** sitemap e hubs não devem emitir links quebrados nem mascarar erros; testar a lista vazia e preservar o comportamento de fallback existente.
- **Dados de programa com caracteres/URLs relativos:** JSON-LD deve serializar conteúdo válido e URLs absolutas; testar slug, nome e descrição com acentos.
- **Rotas privadas e públicas:** robots deve bloquear `/admin`, `/perfil`, `/dashboard` e `/api/`, sem bloquear catálogo, hubs ou guias públicos; testar o objeto gerado.

---

### Task 1: Centralizar URL pública e metadata base

**Files:**
- Create: `src/lib/site.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/blog/renda-extra/page.tsx`
- Modify: `src/app/programas/page.tsx`
- Modify: `src/app/programas/[slug]/page.tsx`
- Test: `e2e/seo.spec.ts`

**Interfaces:**
- Produces `SITE_URL: string` and `absoluteSiteUrl(pathname: string): string` from `src/lib/site.ts`.
- `SITE_URL` uses `NEXT_PUBLIC_SITE_URL` trimmed of a trailing slash when present; otherwise `https://nkloficial.com.br`.
- Consumers use `absoluteSiteUrl` for canonical/Open Graph/JSON-LD URLs and `SITE_URL` for `metadataBase`.

- [x] **Step 1: Write the failing focused SEO assertions** in `e2e/seo.spec.ts`: request `/`, `/programas`, `/blog/renda-extra`, and one stable program detail URL; assert canonical URLs use the configured public host, the alias canonical is `/programas`, and each page has a non-empty title and description.
- [x] **Step 2: Run the focused test** with `npx playwright test e2e/seo.spec.ts`; expect failures for the current `nkl.com.br` fallback or missing assertions.
- [x] **Step 3: Implement `SITE_URL` and `absoluteSiteUrl`** in `src/lib/site.ts`, preserving preview override behavior and rejecting only the trailing slash, not valid paths.
- [x] **Step 4: Replace duplicated URL fallbacks** in root metadata and public program metadata/JSON-LD with the shared helper; improve the home metadata so it describes both the music catalog and the public opportunities product without keyword stuffing.
- [x] **Step 5: Run the focused test** and verify canonical, title, description, and host assertions pass for the requested pages.

### Task 2: Make sitemap, robots, and structured URLs consistent

**Files:**
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/robots.ts`
- Modify: `src/app/programas/page.tsx`
- Test: `e2e/seo.spec.ts`

**Interfaces:**
- Sitemap and robots consume `SITE_URL`/`absoluteSiteUrl`.
- Sitemap remains an async `MetadataRoute.Sitemap` route and includes current public routes plus program detail URLs.

- [x] **Step 1: Add failing assertions** for `/sitemap.xml` and `/robots.txt`: sitemap host/canonical URLs use the public domain, public catalog routes are present, and robots contains the existing private disallow rules plus the sitemap URL.
- [x] **Step 2: Run the two route assertions** with `npx playwright test e2e/seo.spec.ts`; expect failures caused by duplicated fallback logic.
- [x] **Step 3: Implement the shared URL usage** in sitemap and robots; retain the selected broad public coverage, keep `/blog/renda-extra` accessible without treating it as an independent editorial hub, and avoid adding private routes.
- [x] **Step 4: Convert catalog `ItemList` entries to absolute URLs** using `absoluteSiteUrl`, retaining the existing list ordering and program data.
- [x] **Step 5: Run the focused route assertions** and verify valid XML/text responses and no private URL entries.

### Task 3: Add intent-focused editorial hubs

**Files:**
- Create: `src/app/programas/celular/page.tsx`
- Create: `src/app/programas/sem-investimento/page.tsx`
- Create: `src/app/programas/trabalho-remoto/page.tsx`
- Create: `src/app/programas/pesquisas-remuneradas/page.tsx`
- Modify: `src/app/programas/page.tsx`
- Modify: `src/app/sitemap.ts`
- Test: `e2e/seo.spec.ts`

**Interfaces:**
- Each hub is a public App Router page with static `Metadata`, canonical under `/programas/...`, one descriptive `h1`, original explanatory copy, and links to relevant existing `/programas/[slug]` pages.
- Hubs use `getPartnerPrograms` or a shared filtering helper and render an explicit useful empty state if no current program matches.

- [x] **Step 1: Add failing assertions** for each hub: HTTP 200, canonical matching its own route, one `h1`, a meaningful description, at least one contextual internal link when matching programs exist, and no fabricated earning guarantee.
- [x] **Step 2: Run the hub assertions** with `npx playwright test e2e/seo.spec.ts`; expect route-not-found failures.
- [x] **Step 3: Implement the four hubs** using a small shared presentation/filter helper only if duplication is material; filter from actual program categories/tags/objectives, write original Portuguese introductions and decision criteria, and preserve affiliate/editorial disclosures.
- [x] **Step 4: Add the hubs to sitemap** with weekly freshness and priority below `/programas`; do not add a hub if its data query cannot produce a useful page.
- [x] **Step 5: Add contextual links from the catalog** to the hubs without stuffing repeated anchor text.
- [x] **Step 6: Run hub assertions** and verify empty states, internal links, canonical URLs, and content claims.

### Task 4: Validate production-facing SEO behavior

**Files:**
- Modify: `docs/architecture.md`
- Modify: `docs/quality.md`
- Test: `e2e/seo.spec.ts`

**Interfaces:**
- Documentation records the shared URL helper, canonical alias policy, and SEO validation command.

- [x] **Step 1: Run `npm run lint`** and confirm no new errors; existing unrelated warnings remain identified.
- [x] **Step 2: Run `npm run typecheck`** and confirm strict TypeScript passes.
- [x] **Step 3: Run `npm run build`** and confirm metadata routes and all public hubs compile.
- [x] **Step 4: Run `npx playwright test e2e/seo.spec.ts`** and confirm all SEO route assertions pass; record any known environment/database baseline failure rather than hiding it.
- [x] **Step 5: Update architecture and quality docs** with the final route policy, focused test, and validation results.
- [x] **Step 6: Review the diff** for accidental secrets, private routes in sitemap, relative JSON-LD URLs, duplicate canonical claims, and unrelated changes.

## Self-review

- The spec's domain, metadata, canonical, sitemap, robots, JSON-LD, alias, hubs, internal links, constraints, and validation requirements map to Tasks 1–4.
- Tasks define exact files, interfaces, tests, and commands without prescribing implementation bodies beyond requirements that affect SEO behavior.
- Review-focus inputs are covered by focused E2E assertions and the validation task.
- No dependency or database migration is required; the plan preserves existing stack and separates technical foundation from editorial pages.
