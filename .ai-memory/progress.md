---
id: progress
tags: [progresso, checklist, milestones, pre-deploy]
links: [activeContext, projectBrief, techContext, decisionsLog]
updated: 2026-11-19
---

# Progress

Estado do trabalho. Contexto corrente em [[activeContext]]; decisoes em [[decisionsLog]];
gates de qualidade em [quality.md](../docs/quality.md); roteiro executivo em [ROADMAP-DEPLOY.md](../docs/ROADMAP-DEPLOY.md).

## Baseline concluido

- [x] Auth, catalogo de cordas, luthiers, professores, agendamento e reviews.
- [x] Catalogo de renda extra `/programas` com hubs, editorial e links de afiliados.
- [x] Checkout Stripe de guias (logado e convidado) com webhook idempotente.
- [x] Bucket privado `guide-assets-private` + marca d'agua PDF/XLSX/HTML com `encryptedCpf`.
- [x] Inventario publicitario (migracoes 0042/0043) e mural de parceiros (placeholder).
- [x] Fundacao do Quiz de Negocios (migracao 0046_quiz_engine) e IA na Pratica (0047).
- [x] MCP local 9router via `fetch()` nativo, sem dependencia de Cline (commit 8a897e7).
- [x] Snapshot limpo + e-books pagos movidos para `private-assets/guias/` (commit 5729383).
- [x] Gates de baseline: lint, typecheck e `test:deepseek-mcp` 48/48 verdes.

## Overnight concluido e integrado em `master`

- [x] Home base `/` + musica em `/musica/naipe_cordas` + shell unificado (`feat/home-base-music-move`).
- [x] Funil de e-books, downloads 403, recuperacao e 5 idiomas "Em breve" (`feat/guides-funnel-downloads`).
- [x] IA na Pratica, Quiz de Negocios, LGPD, paridade Drizzle (`feat/ia-quiz-compliance`).
- [x] Anuncios, saved programs, Micro1 e SEO (`feat/ads-catalog-seo`).
- [x] Memoria `.ai-memory/` + skill `ai-memory-graph` + protocolo cross-IDE (`feat/memory-second-brain`).
- [x] Integrar branches em `master`, alinhar E2E do mural (`e2e/ad-previews.spec.ts`) e validar `npm run verify` + 199 testes unitarios + 46 testes E2E Playwright.
- [x] Roteiro executivo pre-deploy documentado em [ROADMAP-DEPLOY.md](../docs/ROADMAP-DEPLOY.md).

## Proximas fases pre-deploy ([ROADMAP-DEPLOY.md](../docs/ROADMAP-DEPLOY.md))

- [ ] **Fase A — Banco e Storage**: backup/snapshot Supabase, aplicar migracoes `0044` a `0047` na ordem, validar RLS e subir ativos pagos ao bucket privado (`npm run guides:upload`).
- [ ] **Fase B — Variaveis de Ambiente e Provedores**: conferir/rotacionar chaves na Vercel (`SUPABASE_SERVICE_ROLE_KEY`, `GUEST_CHECKOUT_ENCRYPTION_KEY`, `STRIPE_AI_*_PRICE_ID`, `OPENAI_API_KEY`, webhook Stripe).
- [ ] **Fase C — Build e Deploy Controlado**: revisao visual final de NKL_OFICIAL, `git push` aprovado e deploy de producao monitorado.
- [ ] **Fase D — Smoke Test Pos-Deploy e Rollback**: validar `/api/health`, `/api/health/config`, fluxos publicos, checkout Stripe sandbox e plano de rollback.
