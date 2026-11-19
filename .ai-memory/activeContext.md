---
id: activeContext
tags: [contexto-ativo, milestone, workstreams, overnight]
links: [progress, decisionsLog, projectBrief, systemPatterns, techContext]
updated: 2026-11-19
---

# Active Context

Limite rigido: menos de 80 linhas. Atualizar ao concluir qualquer tarefa.
Checklist detalhado em [[progress]]; decisoes em [[decisionsLog]]; roteiro executivo em [ROADMAP-DEPLOY.md](../docs/ROADMAP-DEPLOY.md).

## Milestone atual

Sprint overnight pre-deploy 100% concluida e verificada localmente em `master`:
5 branches integradas sem conflitos + `npm run verify` verde + 199/199 testes unitarios + 46/46 testes E2E Playwright passando (1 skip conhecido Hotmart).

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

1. Revisao visual local de `/`, `/musica/naipe_cordas`, `/guias/ingles/ebook`, `/ia/oferta`, `/quiz-negocios`, `/programas` e `/mural-de-parceiros`.
2. Executar as Fases A -> B -> C -> D de [ROADMAP-DEPLOY.md](../docs/ROADMAP-DEPLOY.md) na janela de mudanca aprovada (banco e bucket privado -> variaveis de ambiente -> build/deploy -> smoke test e monitoria).
3. Obter aprovacao explicita de NKL_OFICIAL antes de qualquer `git push` ou deploy em producao.

## Riscos conhecidos

- Migracoes locais (`0044` a `0047`) ainda nao foram aplicadas no banco Supabase remoto (ver Fase A de [ROADMAP-DEPLOY.md](../docs/ROADMAP-DEPLOY.md)).
- Paginas de idiomas nao ingleses permanecem `coming-soon` (HTTP 409 no checkout) ate revisao editorial final.
