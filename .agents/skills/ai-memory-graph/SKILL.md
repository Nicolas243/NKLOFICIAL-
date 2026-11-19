---
name: ai-memory-graph
description: Indexa e consulta o Segundo Cerebro persistente (.ai-memory/ e docs/) via grafo de adjacencia e busca BFS ponderada em sub-10ms. Ativar no bootstrap de sessao, antes de planejar features, ao investigar arquitetura/regras do Portal NKL e no gate de conclusao (Jidoka).
triggers:
  - ai-memory
  - memory-graph
  - segundo cerebro
  - contexto arquitetural
  - activeContext
  - decisionsLog
  - systemPatterns
  - projectBrief
  - techContext
---

# Skill: AI Memory Graph (`ai-memory-graph`)

Motor deterministico de indexacao e busca em grafo sobre `.ai-memory/` e `docs/`,
sem dependencias externas (Node.js >= 22). Substitui leituras completas de diretorios
por consultas BFS ponderadas que retornam apenas os nos conectados relevantes.

## Quando ativar

1. **Bootstrap de sessao:** logo apos ler `.ai-memory/activeContext.md` e `.ai-memory/progress.md`.
2. **Investigacao focalizada:** antes de alterar rotas, checkout Stripe, storage de guias,
   inventario de anuncios, IA na Pratica, Quiz de Negocios, Drizzle ou MCP 9router.
3. **Gate de conclusao (Jidoka):** apos atualizar `.ai-memory/` no encerramento de uma entrega,
   para reconstruir `.ai-memory/graph-index.json` e validar links/orfaos.

## Procedimento operacional

### 1. Consultar subgrafo relevante (`query`)

Execute uma busca por termos tecnicos para recuperar os nos semente e seus vizinhos ate N saltos:

```bash
node .agents/skills/ai-memory-graph/scripts/memory-graph.mjs query "stripe webhook guide-assets-private" --depth 2 --limit 6
```

Opcoes:
- `--depth <n>`: profundidade maxima do BFS (padrao: `2`).
- `--limit <n>`: numero maximo de nos retornados (padrao: `6`).
- `--json`: retorna JSON estruturado para consumo programatico.
- `--root <dir>`: diretorio raiz do repositorio (padrao: `process.cwd()`).

Se `.ai-memory/graph-index.json` nao existir, `query` executa `build` automaticamente.

### 2. Inspecionar vizinhanca de uma nota (`neighbors`)

Para descobrir quais documentos dependem ou sao referenciados por um no especifico:

```bash
node .agents/skills/ai-memory-graph/scripts/memory-graph.mjs neighbors systemPatterns --depth 1
```

Aceita `id` do frontmatter (ex.: `systemPatterns`), basename (ex.: `architecture`) ou
caminho relativo (ex.: `docs/architecture.md`).

### 3. Reconstruir o indice deterministico (`build`)

Sempre que criar ou editar arquivos em `.ai-memory/` ou `docs/`:

```bash
node .agents/skills/ai-memory-graph/scripts/memory-graph.mjs build
```

O comando varre exclusivamente `.ai-memory/**/*.md` e `docs/**/*.md`, extrai YAML
frontmatter (`id`, `tags`, `links`, `updated`), titulos, headings (`#`, `##`, `###`),
`[[wikilinks]]` e links markdown `[...](...)`, calcula o grafo de adjacencia e o indice
invertido, e grava `.ai-memory/graph-index.json` ordenado deterministicamente.

### 4. Auditar saude do grafo (`stats`)

Para verificar contagem de nos, arestas, notas orfas e links internos quebrados:

```bash
node .agents/skills/ai-memory-graph/scripts/memory-graph.mjs stats
```

## Regras de seguranca e higiene

- **Zero segredos:** `.env*`, chaves privadas, tokens, CPFs e credenciais nunca sao lidos
  nem indexados. Padroes sensiveis sao filtrados antes de persistir o indice.
- **Limite de `activeContext.md`:** manter estritamente abaixo de 80 linhas.
- **Commit atomico:** versionar `.ai-memory/graph-index.json` junto com as atualizacoes de
  `.ai-memory/*.md` e o codigo da entrega.
