# Portal NKL: instruções de engenharia

## Contexto do produto

- Portal brasileiro para músicos, luthiers, professores e oportunidades digitais.
- Preserve os contratos públicos descritos em `PRODUCT.md` e `docs/architecture.md`.
- `/programas` é o catálogo canônico; `/blog/renda-extra` é apenas compatibilidade.
- Stripe é a autoridade de pagamentos. Webhooks devem validar assinatura e idempotência.
- Supabase fornece Auth, Storage e PostgreSQL; Drizzle acessa o banco.

## Stack e fronteiras

- Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4.
- `src/app`: rotas e handlers; `src/actions`: Server Actions; `src/lib`: domínio;
  `src/db`: schema/conexão; `drizzle`: migrações aditivas.
- Segredos ficam em `.env.local`/provedor de deploy, nunca em código, logs, testes
  versionados ou prompts.

## Regras obrigatórias

1. Leia `AGENTS.md`, `PRODUCT.md` e a documentação da área antes de editar.
2. Verifique `git status --short` e preserve alterações existentes.
3. Toda entrada externa precisa de validação explícita (preferir Zod), autenticação
   e autorização no servidor; não confie em campos enviados pelo navegador.
4. Nunca transforme erro, status desconhecido ou configuração ausente em sucesso.
   Responda com erro observável e registre somente contexto não sensível.
5. Webhooks devem usar o corpo bruto, assinatura em tempo constante, idempotência,
   validação de payload e estados fechados; não aplicar migrações/deploy automaticamente.
6. Mudanças de banco são aditivas, revisáveis e devem indicar a verificação remota
   necessária. Não execute produção.
7. Preserve acessibilidade móvel, consentimento de analytics e URLs canônicas.
8. Prefira módulos pequenos e funções puras testáveis; não duplicar regras de domínio.

## Validação

- Foco: `npm run lint`, `npm run typecheck` e testes diretamente relacionados.
- Entrega: `npm run verify`; fluxos críticos também usam `npm run test:e2e`.
- Relate comando, resultado e warnings legados. Não altere testes só para mascarar falha.

## Fluxo spec-driven adaptado ao Copilot

1. **Antes de agir:** liste o pedido, os contratos afetados e o estado atual da árvore.
   Diferencie pedido confirmado, suposição e decisão pendente.
2. **Dimensione a mudança:** correção local ou documentação não precisa de artefatos
   adicionais. Feature grande, mudança arquitetural ou integração crítica deve usar
   `docs/specs/<feature>/` com `prd.md`, `adr.md`, `design.md`, `spec.md` e
   `tasks.md`, vinculados aos documentos atuais do projeto.
3. **Antes do impacto:** procure conflitos com `PRODUCT.md`,
   `docs/architecture.md`, decisões existentes e fluxos críticos. Interrompa
   e pergunte antes de alterar escopo, contrato público, banco ou regra de pagamento.
4. **Planeje rastreabilidade:** cada história relevante recebe um ID `AC-xxx`,
   um teste observável e uma tarefa correspondente. Use marcadores
   `@spec:AC-xxx` nos testes diretamente ligados ao critério.
5. **Execute em ciclos curtos:** explique o próximo passo, edite somente os arquivos
   necessários e preserve mudanças já presentes no worktree.
6. **Ao entregar:** informe critérios atendidos, arquivos alterados, testes executados,
   warnings legados e verificações não realizadas. Explícite configuração ausente,
   migração remota pendente ou deploy não autorizado como pendência, nunca como sucesso.

## Política de MCP

1. Não iniciar, configurar ou consultar MCPs automaticamente no início da tarefa.
2. Trabalhar primeiro com arquivos, terminal, testes e ferramentas nativas disponíveis.
3. Consultar `docs/mcp-catalog.md` antes de escolher uma integração externa.
4. Usar MCP somente quando ele seja necessário para o resultado da tarefa atual.
5. A ativação exige confirmação do usuário quando puder iniciar processo, acessar
   serviço externo, consultar dados remotos, modificar infraestrutura ou escrever
   banco, arquivo ou nuvem.
6. Preferir ferramentas já instaladas no workspace e o menor conjunto necessário;
   não chamar MCPs relacionados apenas por estarem registrados.
7. `.vscode/settings.json` define `chat.mcp.autostart` como `never`. MCP global
   também deve ser desativado no gerenciador de servidores do VS Code, pois
   integradores independentes podem ignorar o auto-start do workspace.
