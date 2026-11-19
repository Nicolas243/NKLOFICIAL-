---
id: progress
tags: [progresso, checklist, milestones, pre-deploy]
links: [activeContext, projectBrief, techContext, decisionsLog]
updated: 2026-11-19
---

# Progress

Estado do trabalho. Contexto corrente em [[activeContext]]; decisoes em [[decisionsLog]];
gates de qualidade em [quality.md](../docs/quality.md).

## Baseline concluido

- [x] Auth, catalogo de cordas, luthiers, professores, agendamento e reviews.
- [x] Catalogo de renda extra `/programas` com hubs, editorial e links de afiliados.
- [x] Checkout Stripe de guias (logado e convidado) com webhook idempotente.
- [x] Bucket privado `guide-assets-private` + marca d'agua PDF/XLSX/HTML com `encryptedCpf`.
- [x] Inventario publicitario (migracoes 0042/0043) e mural de parceiros (placeholder).
- [x] Fundacao do Quiz de Negocios (migracao 0045_quiz_engine) e IA na Pratica (0046).
- [x] MCP local 9router via `fetch()` nativo, sem dependencia de Cline (commit 8a897e7).
- [x] Snapshot limpo + e-books pagos movidos para `private-assets/guias/` (commit 5729383).
- [x] Gates de baseline: lint, typecheck e `test:deepseek-mcp` 48/48 verdes.

## Overnight concluido e integrado em `master`

- [x] Home base `/` + musica em `/musica/naipe_cordas` + shell unificado (`feat/home-base-music-move`).
- [x] Funil de e-books, downloads 403, recuperacao e 5 idiomas "Em breve" (`feat/guides-funnel-downloads`).
- [x] IA na Pratica, Quiz de Negocios, LGPD, paridade Drizzle (`feat/ia-quiz-compliance`).
- [x] Anuncios, saved programs, Micro1 e SEO (`feat/ads-catalog-seo`).
- [x] Memoria `.ai-memory/` + skill `ai-memory-graph` + protocolo cross-IDE (`feat/memory-second-brain`).

## Pendencias pre-deploy

- [x] Integrar branches em `master` e resolver conflitos.
- [x] `npm run verify` verde e `npm run test:e2e` sem regressao sobre o baseline.
- [ ] Revisao manual das migracoes locais e plano de aplicacao remota aprovado.
- [ ] Upload dos ativos pagos ao bucket privado (`npm run guides:upload`) com aprovacao.
- [ ] Conferir variaveis de ambiente no provedor de deploy (somente nomes em [[techContext]]).
- [ ] Aprovacao explicita do usuario para deploy.
