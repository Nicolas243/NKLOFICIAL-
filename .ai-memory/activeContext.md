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

Integracao overnight paralela pre-deploy do Portal NKL sobre baseline limpo
(`master` @ 5729383: MCP 9router desacoplado + snapshot de features + ativos pagos protegidos).

## Workstreams em andamento (branches locais, sem push)

| Branch | Dono | Escopo |
|---|---|---|
| `feat/home-base-music-move` | home-and-shell | Home base `/`, musica em `/musica/naipe_cordas`, shell unificado, `portal-areas` + testes |
| `feat/guides-funnel-downloads` | guides-funnel | Funil de e-books, download 403, recuperacao, chines, 5 idiomas "Em breve", `/api/materials` |
| `feat/ia-quiz-compliance` | ia-and-quiz | IA na Pratica, Quiz de Negocios, LGPD (`compliance.ts`), numeracao Drizzle, liberacao de slot no webhook |
| `feat/ads-catalog-seo` | ads-catalog-seo | Moderacao de anuncios, preco total, TOCTOU de slots, mural real, saved programs, Micro1, sitemap/robots |
| `feat/memory-second-brain` | memory-architect | `.ai-memory/`, skill `ai-memory-graph`, protocolo cross-IDE |

## Regras da rodada

- Cada worker edita somente seus caminhos; integracao feita pelo coordinator.
- Proibido push, deploy ou migracao remota. Segredos nunca impressos ou versionados.
- Zero emojis em codigo, notas e commits.

## Proximo passo imediato apos integracao

1. Coordinator faz merge das branches em `master` resolvendo conflitos de shell/sitemap.
2. Rodar `npm run verify` e `npm run test:e2e`; comparar com baseline de `docs/quality.md`.
3. Revisar migracoes Drizzle locais (numeracao 0045 duplicada) antes de qualquer remoto.
4. Atualizar este arquivo, [[progress]] e rodar `memory-graph.mjs build`.

## Riscos conhecidos

- Conflitos em `src/app/sitemap.ts`, `income-portal.ts` e header/footer entre branches.
- Migracoes com prefixo duplicado (`0038_*`, `0045_*`) exigem revisao de paridade de schema.
- Paginas de idiomas nao ingleses devem permanecer `coming-soon` ate validacao.
