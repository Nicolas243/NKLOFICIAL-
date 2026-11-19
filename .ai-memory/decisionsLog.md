---
id: decisionsLog
tags: [adr, decisoes, descartes, historico]
links: [projectBrief, techContext, systemPatterns, activeContext]
updated: 2026-11-19
---

# Decisions Log - ADRs Concisos

Formato fixo de 3 linhas por entrada: Decisao / Motivo / Descartado. Entradas mais
recentes no topo. Contexto: [[systemPatterns]], [[techContext]], [[projectBrief]].

## ADR-006 (2026-11-19) Memoria persistente `.ai-memory/` + skill de grafo
- Decisao: memoria cross-IDE versionada em `.ai-memory/` consultada por BFS ponderado (`ai-memory-graph`).
- Motivo: agentes recuperam so os nos conectados relevantes, sem varrer `docs/` inteiro; protocolo unico em AGENTS.md.
- Descartado: memoria apenas em vault externo (nao versionada) e embeddings/vetores (dependencias e custo).

## ADR-005 (2026-11-19) 5 e-books nao ingleses marcados `coming-soon`
- Decisao: espanhol, italiano, frances, alemao e chines exibem "Em breve" no registro e nas paginas.
- Motivo: conteudo ainda nao validado para venda; evitar checkout de produto incompleto.
- Descartado: manter checkout ativo para todos os idiomas e remover as paginas (perda de SEO).

## ADR-004 (2026-11-19) E-books pagos fora de `public/guias/`
- Decisao: arquivos pagos movidos para `private-assets/guias/` (gitignored); fonte do ingles em `src/content/guias/`.
- Motivo: `public/` e servido sem autenticacao; entrega so via bucket privado com marca d'agua.
- Descartado: ofuscar nomes de arquivo em `public/` e bloquear por middleware (seguranca por obscuridade).

## ADR-003 (2026-11-19) Home musical em `/musica/naipe_cordas`
- Decisao: `/` vira hub multivertical; home musical migra para `/musica/naipe_cordas`, preservando sub-rotas existentes.
- Motivo: portal cresceu alem de musica; registro central alimenta a home base.
- Descartado: renomear/mover sub-rotas musicais (quebra de links e SEO) e home unica mista.

## ADR-002 (2026-11-19) MCP local 9router desacoplado do Cline
- Decisao: `tools/deepseek-mcp.ts` chama o 9router com `fetch()` nativo (Node >= 22); Cline vira fallback opcional.
- Motivo: menos dependencias, controle de timeout/retry e workers paralelos limitados (1-3).
- Descartado: manter `@cline/sdk` como caminho principal (acoplamento e falhas em Windows).

## ADR-001 Stripe como autoridade de pagamento
- Decisao: estado de compra so muda via webhook assinado e idempotente (`stripe_webhook_events`).
- Motivo: evitar fraude por redirect de sucesso e duplicidade de eventos.
- Descartado: confirmar compra pela pagina de sucesso no cliente.
