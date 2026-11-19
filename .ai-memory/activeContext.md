---
id: activeContext
tags: [contexto-ativo, milestone, workstreams, overnight]
links: [progress, decisionsLog, projectBrief, systemPatterns, techContext]
updated: 2026-11-19
---

# Active Context

Limite rigido: menos de 80 linhas. Atualizar ao concluir qualquer tarefa.
Checklist detalhado em [[progress]]; decisoes em [[decisionsLog]].

## Milestone atual

Integracao overnight pre-deploy do Portal NKL concluida e verificada em `master`:
5 branches integradas sem conflitos + `npm run verify` verde + 199 testes unitarios + 24 testes E2E Playwright passando.

## Workstreams integradas em `master` (commits locais, sem push)

| Branch | Dono | Status |
|---|---|---|
| `feat/memory-second-brain` | memory-architect | Integrado em `master` (`.ai-memory/`, skill `ai-memory-graph`, protocolo cross-IDE) |
| `feat/home-base-music-move` | home-and-shell | Integrado em `master` (Home base `/`, musica em `/musica/naipe_cordas`, shell unificado, `portal-areas`) |
| `feat/guides-funnel-downloads` | guides-funnel | Integrado em `master` (Amostra de 5 aulas de ingles, download 403 corrigido, 5 idiomas "Em breve", `/api/materials`) |
| `feat/ia-quiz-compliance` | ia-and-quiz | Integrado em `master` (Checkout/webhook IA na Pratica, Quiz de Negocios, LGPD `compliance.ts`, migracoes 0046/0047) |
| `feat/ads-catalog-seo` | ads-catalog-seo | Integrado em `master` (Moderacao de anuncios, lock transacional de slots, mural real, saved programs, Micro1, sitemap/robots) |

## Regras da rodada

- Nenhuma branch enviada a remoto; proibido push, deploy ou migracao remota sem aprovacao explicita.
- Segredos nunca impressos ou versionados; `.env.local` intocado.
- Zero emojis em codigo, notas e commits.

## Proximo passo imediato (aguardando aprovacao do usuario)

1. Revisar `git log` e `git diff` consolidados em `master`.
2. Planejar aplicacao controlada das migracoes Drizzle locais (`0044` a `0047`) e upload dos ativos pagos ao bucket privado (`npm run guides:upload`).
3. Obter aprovacao explicita antes de qualquer `git push` ou deploy em producao.

## Riscos conhecidos

- Migracoes locais (`0044_new_income_programs.sql`, `0045_english_ebook_guide_offer.sql`, `0046_quiz_engine.sql`, `0047_ai_learning_product.sql`) ainda nao foram aplicadas no banco remoto.
- Paginas de idiomas nao ingleses permanecem `coming-soon` ate revisao editorial final.
