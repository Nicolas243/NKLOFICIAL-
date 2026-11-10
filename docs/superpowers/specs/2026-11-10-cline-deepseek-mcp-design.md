# Worker local do DeepSeek via MCP

## Intenção

Permitir que tarefas auxiliares de engenharia sejam executadas por um agente Cline usando o modelo DeepSeek disponível na conta/API do usuário, sem expor chaves, sem publicar um endpoint e sem alterar o agente principal do Copilot.

## Objetivos

- Criar um worker local baseado em `@cline/sdk`/`ClineCore`, com servidor MCP separado usando o SDK oficial de MCP.
- Configurar o provedor por variáveis de ambiente, sem gravar segredos no repositório.
- Expor o worker como uma ferramenta MCP local para o host de agentes.
- Restringir o agente ao repositório atual e a tarefas de apoio somente leitura, como exploração e revisão.
- Manter comandos destrutivos, deploy e alterações de produção bloqueados por padrão.
- Retornar resultado, status e erros de forma estruturada.

## Não objetivos

- Substituir o agente principal do Copilot.
- Criar um serviço remoto ou uma API pública.
- Compartilhar histórico completo ou credenciais com o DeepSeek além do prompt e dos arquivos necessários à tarefa.
- Delegar automaticamente toda tarefa sem uma política explícita.

## Abordagens consideradas

1. **Worker local acionado por comando** — simples e seguro, mas exige iniciar cada tarefa manualmente e não aparece como ferramenta integrada.
2. **Worker local exposto como MCP — escolhido** — mantém o processo local, permite que o host chame uma ferramenta focada e reutiliza as ferramentas de workspace do Cline. O custo é configurar transporte, limites e política de aprovação.
3. **Perfil `.cline/agents/`** — integra bem à extensão Cline, mas não permite que o agente principal deste ambiente o invoque diretamente.

## Arquitetura escolhida

- `@cline/sdk` e o SDK oficial de servidor MCP serão adicionados como dependências locais do worker.
- Um comando TypeScript local iniciará `ClineCore` em modo `local`, com `cwd` fixo no repositório atual. O MCP não aceitará diretório arbitrário de chamadas externas.
- O provedor será selecionado por:
  - `CLINE_API_KEY` para a chave já existente;
  - `CLINE_BASE_URL` para o endpoint compatível já existente, opcional quando o provedor embutido não exigir URL;
  - `CLINE_PROVIDER_ID`, com padrão seguro `openai-compatible` para o endpoint local atual;
  - `CLINE_MODEL_ID` para o identificador exato do DeepSeek, sem assumir que o nome visual “DeepSeek V4 Flash” seja o ID da API.
- O transporte MCP será stdio, para que o host inicie o worker como processo filho e não haja porta de rede.
- A ferramenta pública terá uma operação de tarefa focada, somente leitura, com prompt e limite de iterações. O worker retornará um `CallToolResult` válido, contendo texto, `structuredContent` com estado/uso e erro explícito quando aplicável.
- `editor`, `apply_patch`, `run_commands`, `fetch_web_content`, `skills`, spawn, equipes e MCPs configurados serão desabilitados na primeira versão. O worker registrará apenas ferramentas customizadas `list_workspace_files` e `read_workspace_file`, com limites e bloqueio de arquivos sensíveis. Não haverá edição, testes por comando, deploy, migração ou acesso a `.env*`.
- O código fará validação de caminhos dentro do workspace, timeout, cancelamento e descarte (`dispose`) do ClineCore.

## Segurança e operação

- Nunca imprimir, testar ou incluir valores de `CLINE_API_KEY` em logs, testes, commits ou respostas.
- O `.env.local` continuará ignorado pelo Git.
- O worker falhará explicitamente quando `CLINE_API_KEY` ou `CLINE_MODEL_ID` estiverem ausentes; `CLINE_BASE_URL` será exigido somente para `openai-compatible`.
- O servidor não será implantado na Vercel nem exposto na internet.
- O worker lerá somente arquivos permitidos dentro do repositório, rejeitando traversal, symlink escape, `.env*`, credenciais, certificados, `.git`, `node_modules`, `.next` e `supabase/.temp/**`.
- O processo emitirá somente JSON-RPC MCP no stdout; diagnósticos irão para stderr. Uma solicitação será processada por vez.
- O agente receberá as ferramentas customizadas por `extraTools`; as políticas da sessão removerão todas as ferramentas built-in, mantendo somente essas duas leituras seguras.
- A integração será validada primeiro com configuração sem segredo e depois com uma tarefa somente leitura controlada.

## Testes e entrega

- Teste de configuração sem revelar segredos.
- Teste de transporte MCP, JSON-RPC inválido e formato estruturado de resposta.
- Teste de recusa de caminho fora do workspace, symlink escape, arquivos secretos e operação perigosa.
- Typecheck/lint do worker e `npm run verify` do portal, se a alteração afetar o bundle ou scripts compartilhados.
- Documentação do comando de configuração e uso local.

## Decisões do implementador

- O ID exato do modelo será obrigatório em `CLINE_MODEL_ID`; o worker não fará suposições silenciosas.
- A primeira versão será somente local/stdio e single-task; equipes persistentes e execução paralela ficam fora do escopo inicial.
- O worker ficará permanentemente vinculado ao repositório atual; para outro repositório será necessária uma alteração explícita de configuração e revisão de segurança.
- A leitura de `.env.local` servirá apenas para detectar configuração ausente; valores nunca serão retornados ou enviados ao modelo.
