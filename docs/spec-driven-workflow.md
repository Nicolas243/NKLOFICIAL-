# Fluxo spec-driven adaptado ao Copilot

Este projeto usa um fluxo leve e verificável no Copilot SDK/VS Code. Ele não
substitui os contratos existentes em `PRODUCT.md`, `AGENTS.md` e
`docs/architecture.md`; estes documentos continuam sendo a fonte principal.

## Quando criar especificação

Não criar documentos adicionais para correções pequenas e mudanças diretamente
limitadas a um arquivo ou fluxo. Criar a pasta `docs/specs/<feature>/` para:

- features novas com múltiplos arquivos;
- mudanças de arquitetura ou dados;
- integrações externas;
- fluxos críticos de autenticação, pagamentos, webhooks ou download;
- mudanças que podem afetar contratos públicos ou decisões anteriores.

## Artefatos

Crie somente os artefatos necessários, sem arquivos vazios ou aprovação implícita:

- `prd.md`: pedido literal, problema, público, objetivos, restrições e métricas;
- `adr.md`: decisão arquitetural, alternativas consideradas e consequências;
- `design.md`: contratos, dados, segurança, acessibilidade, testes e implantação;
- `spec.md`: histórias e critérios de aceite observáveis;
- `tasks.md`: tarefas sequenciais ou independentes, arquivos envolvidos e critérios atendidos.

Cada documento deve apontar para os documentos existentes que fundamentam o
trabalho. Uma alteração de escopo só é aplicada depois da decisão explícita do
usuário.

## Rastreabilidade

Use IDs estáveis no formato `AC-001`, `AC-002` e assim por diante. Vincule:

- cada história a seus critérios;
- cada critério a uma ou mais tarefas;
- cada teste diretamente relacionado ao marcador `@spec:AC-001`;
- toda conclusão ao resultado observável de lint, typecheck, build, teste ou E2E.

Testes pulados, pendentes ou sem evidência não contam como critérios concluídos.
Uma auditoria local pode verificar caminhos, marcadores e documentação, mas não
inventa aprovação nem substitui testes executados.

## Plano de execução

Para features grandes:

1. confirmar o pedido e listar limitações;
2. verificar impactos em produto, arquitetura e áreas anteriores;
3. registrar perguntas e decisões pendentes;
4. preencher PRD/ADR/design/spec/tasks;
5. revisar o plano antes de implementar;
6. executar tarefas em ordem ou em worktrees independentes;
7. validar testes focados e gates gerais;
8. registrar migrações ou deploy como ações manuais pendentes.

O Copilot não deve aplicar migração remota, publicar em produção ou alterar
infraestrutura sem aprovação explícita. Mudanças de banco devem ser aditivas,
revisáveis e acompanhadas da verificação remota necessária.
