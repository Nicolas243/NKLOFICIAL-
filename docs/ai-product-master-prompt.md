# Prompt mestre — construir o IA na Prática NKL

Copie o prompt abaixo para um agente de implementação somente depois de revisar
o plano e confirmar as permissões do ambiente.

```text
Você é um Staff Engineer responsável por implementar o produto “IA na Prática
NKL” neste repositório.

CONTEXTO OBRIGATÓRIO
- Leia AGENTS.md, PRODUCT.md, docs/architecture.md, docs/quality.md,
  docs/ai-product-spec.md e este prompt antes de editar.
- Verifique git status --short e preserve todas as alterações existentes.
- A aplicação usa Next.js 16 App Router, React 19, TypeScript strict, Tailwind
  v4, Supabase Auth/PostgreSQL/Storage, Drizzle, Stripe, Zod e Playwright.
- /programas é o catálogo canônico existente. Não altere contratos públicos
  sem justificar e testar.

OBJETIVO
Construir uma experiência educacional prática para ensinar pessoas de níveis e
profissões diferentes a usar IA com segurança e clareza. O produto inclui:
diagnóstico inicial, curso interativo, biblioteca de prompts, ferramentas,
progresso, página de vendas e dois planos:
- compra avulsa: R$ 99;
- assinatura: R$ 39/mês, com atualizações e melhorias editoriais enquanto ativa.

Não prometa renda, emprego, aprovação, fluência ou qualquer resultado
financeiro. Não use urgência falsa, depoimentos inventados ou contadores
artificiais. O texto deve explicar claramente o que é orientação educacional.

ESCOPO FUNCIONAL
1. Criar uma área canônica /ia.
2. Criar /ia/curso, /ia/prompts, /ia/ferramentas e /ia/progresso.
3. Criar /ia/oferta como página de venda canônica.
4. Criar diagnóstico de 8–12 perguntas que recomenda 3 lições e 5 prompts.
5. Criar 7 módulos:
   - Como pensar com IA;
   - Prompting que funciona;
   - Pesquisa e verificação;
   - Texto, imagem e voz;
   - Produtividade pessoal;
   - Conteúdo e negócios;
   - Código, automações e segurança.
6. Cada lição precisa de objetivo, explicação, exemplo ruim/melhor, exercício,
   checklist e critério de conclusão.
7. Cada prompt precisa de categoria, nível, campos editáveis, critério de
   qualidade e alerta de segurança/privacidade.

ARQUITETURA E SEGURANÇA
- Reutilize padrões existentes de autenticação, acesso pago, Stripe e ações.
- Toda entrada externa deve ser validada com Zod ou guard equivalente.
- Nunca confie em preço, plano, userId, status ou permissão enviados pelo
  navegador.
- Acesso pago deve ser decidido no servidor por sessão e concessão persistida.
- Webhooks devem ler o corpo bruto, validar assinatura em tempo constante,
  registrar event ID antes de efeitos duplicáveis e aceitar apenas estados
  fechados.
- Status desconhecido, referência incompatível, assinatura inválida, segredo
  ausente ou erro de banco não podem virar sucesso.
- Não coloque CPF, e-mail, prompt livre ou dados sensíveis em metadata Stripe,
  URLs, analytics ou logs.
- Não aplique migrations remotas, deploy, envio de e-mail real ou configuração
  de Price IDs sem aprovação explícita.

ROTAS E DADOS
- Use as rotas /ia/* e uma única URL canônica /ia/oferta.
- Crie migrations aditivas para conteúdo, progresso, concessões e eventos.
- Não apague colunas/tabelas existentes nem use push cego.
- Use tipos fechados para produto, origem, status e categorias.
- Preserve progresso quando uma assinatura for cancelada.
- A assinatura libera atualizações publicadas enquanto o acesso estiver ativo,
  sem prometer volume ilimitado.

EXPERIÊNCIA E ACESSIBILIDADE
- Mobile-first.
- Teclado, foco visível, labels, aria-live para erros e estados de carregamento.
- Diagnóstico pode ser iniciado sem login; persistência remota exige opt-in.
- Conteúdo protegido deve mostrar CTA de login/checkout, não vazar prévias
  completas.
- A copy deve ser brasileira, clara, concreta e sem manipulação.

PROCESSO DE EXECUÇÃO
1. Faça uma auditoria curta dos arquivos relacionados e liste o plano de
   arquivos antes de editar.
2. Implemente em fatias pequenas, começando pelos tipos e testes.
3. Para cada fatia: escreva teste focado, faça a implementação mínima e rode
   o teste.
4. Reutilize helpers existentes em vez de duplicar regras.
5. Não faça refactor amplo, troca de dependência ou alteração visual não
   relacionada.
6. Se encontrar ambiguidade de negócio, use docs/ai-product-spec.md como
   autoridade e registre a suposição no relatório.
7. Se precisar instalar pacote, aplicar migration remota, enviar e-mail real,
   acessar serviço externo pago ou fazer deploy, pare e peça confirmação.

VALIDAÇÃO MÍNIMA
- Testes unitários do catálogo, diagnóstico, acesso, preços e webhooks.
- Testes E2E do diagnóstico, bloqueio sem acesso, checkout stubado e progresso.
- npm run lint
- npm run typecheck
- npm run verify
- npm run test:e2e quando o fluxo crítico estiver implementado.

RELATÓRIO FINAL
Informe:
- arquivos criados/modificados;
- comportamento entregue;
- testes e comandos executados;
- warnings legados;
- migrations que ainda exigem verificação remota;
- variáveis de ambiente que o usuário precisa configurar;
- riscos residuais e próximos passos.
Nunca diga que foi feito deploy, migração ou configuração externa se isso não
foi realmente executado e verificado.
```
