# Contexto Ativo (Portal NKL)

## Foco Atual
- **Saneamento Infra + IDE + SEO Google #1 Renda Extra (2026-11-24):**
  - Supabase (`vgogceknmqdqzzpztkrr`): migracao `0050_performance_fk_indexes_and_rls_policies.sql` aplicada — 24 FKs indexadas e 37 tabelas server-only com policy restritiva `deny_direct_client_access` (0 `unindexed_foreign_keys`, 0 `rls_enabled_no_policy`).
  - Vercel Preview & Build: `src/env.ts` com fallback exclusivo de `phase-production-build` evitando quebra em Preview builds no `/api/ads/click`; `/*turbopackIgnore: true*/` em `guide/route.ts` e `guide-assets.ts` zerando tracing warnings.
  - IDE Problems: `.vscode/settings.json` ajustado para ignorar falsos positivos de links MD em skills/auditorias, CSS legacy e scans em `private-assets/`, `public/`, `.agents/` e `docs/`.
  - SEO Google #1 Renda Extra: `WebSite SearchAction` + metadata root (`layout.tsx`), `CollectionPage` + `FAQPage` (6 FAQs) + `BreadcrumbList` + `ItemList` em `/programas`, 4 novos hubs programáticos ISR (`com-ia`, `afiliados`, `home-office`, `com-investimento`), malha de links internos e titulos high-CTR nos `/programas/[slug]`, e sitemap sem redirect (`/quiz-negocios`).

## Pendencias Somente Manuais do Usuario (Browser / Contas Externas)
1. **Google Search Console:** enviar `https://nkloficial.com.br/sitemap.xml` e solicitar indexacao de `/programas` e dos 4 novos hubs.
2. **Afiliados, Cloudflare Email Routing, Amazon KDP e NotebookLM:** checklist completo em `docs/CHECKLIST-OFFLINE-NKL.md`.
