# Contexto Ativo (Portal NKL)

## Foco Atual

- **Blindagem `/sitemap.xml` e Endpoints de Crawlers (2026-11-27):**
  - `src/proxy.ts` agora exclui `.xml`, `.txt`, `.ico`, `.webmanifest`, `/sitemap.xml`, `/robots.txt`, `/llms.txt` e `/llms-full.txt` do matcher e de `updateSession()`, evitando que timeouts de Supabase Auth devolvam HTML para o Googlebot.
  - `src/app/sitemap.ts` migrado de `force-dynamic` para ISR (`revalidate = 3600`) servindo XML estático/borda, e `next.config.ts` adiciona `301` de `/sitemap`, `/sitemap_index.xml`, `/sitemap-index.xml` e `/sitemap-0.xml` -> `/sitemap.xml`.
- **Arquitetura GEO + SEO Técnico Completa (2026-11-27):**
  - IndexNow (`public/a7f4c92e1b8d40539e6c1a2f8b4d7e03.txt` + `npm run seo:indexnow`), `/llms.txt`, `/llms-full.txt`, `robots.ts` com bots de IA liberados, grafo Schema `@id`, `/metodologia`, `<BlufSummary />`, `<CatalogStatsBox />`, tabelas HTML SSR e 22 comparativos (`/programas/comparar/*` e `/comparar/*`).

## Pendencias Somente Manuais do Usuario (Contas Externas)

1. **Checklist Consolidado:** ver `docs/CHECKLIST-MESTRE-NKL.md` (reenviar `sitemap.xml` no GSC para limpar leitura de `26/11/2026`, importar no Bing Webmaster Tools, off-page Itens 8 & 10 e publicação KDP).
