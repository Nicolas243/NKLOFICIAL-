# Contexto Ativo (Portal NKL)

## Foco Atual

- **Arquitetura GEO (Generative Engine Optimization) + SEO Técnico Completa (2026-11-27):**
  - **IndexNow & Sitemap Honesto:** chave estática `public/a7f4c92e1b8d40539e6c1a2f8b4d7e03.txt`, `src/lib/seo/indexnow.ts` (disparo não bloqueante em mutações de `/programas/admin`), `scripts/ping-indexnow.mjs` (`npm run seo:indexnow`) e `src/app/sitemap.ts` usando timestamps reais do banco (`lastVerifiedAt` / `updatedAt`) + constante `SITE_CONTENT_LAST_MODIFIED` nas rotas estáticas (incluindo `/metodologia`, `/catalogo/[id]` e 22 comparativos).
  - **Camada IA & Crawlers:** `/llms.txt` e `/llms-full.txt` dinâmicos (`revalidate = 3600`, Markdown direto do PostgreSQL) e `src/app/robots.ts` liberando `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Claude-SearchBot`, `ClaudeBot`, `Applebot` e `Google-Extended`.
  - **Grafo Semântico & Autoridade:** `src/lib/seo/schema-graph.ts` unificado via `@id` (`#organization`, `#website`, `#author`, `#programsDataset`, `#stringsDataset`, `Product`/`AggregateRating`), página `/metodologia` (`revalidate = 3600`), `<CatalogStatsBox />` com métricas citáveis ao vivo, `<BlufSummary />` + histórico de verificação e tabelas HTML semânticas SSR em hubs, `/catalogo` e `/comparar`.
  - **Comparativos Programáticos "X vs Y":** 12 comparativos em `/programas/comparar/[comparison]` + 10 comparativos acústicos de cordas em `/comparar/[comparison]` (`revalidate = 3600`).
  - **Topical Authority Legítima:** gaps de busca PT-BR documentados internamente em `docs/SEO-TOPICAL-MAP.md` com respostas originais nas páginas pilares e `/llms-full.txt` (zero scraping de concorrentes).

## Pendencias Somente Manuais do Usuario (Contas Externas)

1. **Checklist Consolidado:** ver `docs/CHECKLIST-MESTRE-NKL.md` (Bing Webmaster Tools import 1-clique do GSC, inspeção no GSC, off-page Itens 8 & 10 e publicação KDP em `private-assets/amazon-book/`).
