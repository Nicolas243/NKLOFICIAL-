@AGENTS.md

## Protocolo de Memória Persistente (`.ai-memory/`)

- **Bootstrap de Sessão:** ler obrigatoriamente `.ai-memory/activeContext.md` e `.ai-memory/progress.md`; usar a skill `ai-memory-graph` (`node .agents/skills/ai-memory-graph/scripts/memory-graph.mjs query "<termos>"`) para consultar `projectBrief.md`, `techContext.md`, `systemPatterns.md`, `decisionsLog.md` e `docs/` sob demanda.
- **Gate de Conclusão (Jidoka):** nenhuma tarefa é concluída sem atualizar `.ai-memory/activeContext.md` (<80 linhas), `.ai-memory/progress.md`, registrar 3 linhas em `.ai-memory/decisionsLog.md` quando houver decisão/descarte arquitetural, e rodar `node .agents/skills/ai-memory-graph/scripts/memory-graph.mjs build`.
- **Segurança:** proibido gravar segredos, credenciais, tokens ou PII em `.ai-memory/`.
- **Versionamento:** incluir atualizações de `.ai-memory/` no mesmo commit atômico da entrega técnica.
