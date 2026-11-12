# Rede de subagentes NKL via 9router

## Intenção

Transformar o worker local do Portal NKL em um orquestrador econômico de agentes
somente leitura. O orquestrador usará um único endpoint OpenAI-compatible do
9router e selecionará aliases por função, sem copiar chaves para o repositório,
logs, prompts ou resultados.

## Objetivos

- Usar `NKL-ORQUESTRADOR` para decompor tarefas e sintetizar respostas.
- Usar `NKL-OPERARIOS` para pesquisas, exploração e análises independentes.
- Usar `NKL-REVISOR` para revisar resultados quando a tarefa exigir validação.
- Preservar o transporte local MCP stdio e o workspace fixo do worker.
- Minimizar tokens por meio de fan-out limitado, envelopes compactos, citações
  de arquivos em vez de cópia repetida e revisão condicional.
- Manter a primeira versão estritamente somente leitura.

## Não objetivos

- Não permitir edição, shell, testes disparados pelo agente, deploy, migrações,
  web fetch, MCP externo, equipes persistentes ou exposição de HTTP.
- Não enviar histórico completo da conversa para cada agente.
- Não assumir que os nomes visuais dos modelos são IDs individuais: os três
  aliases são enviados como `model` ao mesmo endpoint do 9router.
- Não executar chamadas reais durante os testes automatizados.

## Contrato de roteamento

O 9router será configurado por variáveis de ambiente sem valores versionados.
O endpoint informado pelo usuário é `http://localhost:20128/dashboard`; como
o contrato é "igual ao Cline", o worker reutilizará o formato de transporte e
autenticação já suportados pelo Cline, sem assumir que `/dashboard` seja uma
rota HTTP de geração:

- `NINE_ROUTER_BASE_URL`: endpoint OpenAI-compatible.
- `NINE_ROUTER_API_KEY`: chave do gateway.
- `NINE_ROUTER_ORCHESTRATOR_MODEL`: padrão `NKL-ORQUESTRADOR`.
- `NINE_ROUTER_WORKER_MODEL`: padrão `NKL-OPERARIOS`.
- `NINE_ROUTER_REVIEWER_MODEL`: padrão `NKL-REVISOR`.

`Alll` é um alias literal do 9router. O gateway é responsável por resolver
`Alll`, round-robin, fallback e o painel fusion/juiz configurado pelo usuário.
O worker não manterá uma segunda lista de provedores nem tentará adivinhar
quais modelos individuais estão ativos.

## Ativação e precedência

O modo combinado usa sempre o Cline e o 9router na mesma tarefa:

- o Cline é o coordenador principal;
- `NKL-ORQUESTRADOR`, `NKL-OPERARIOS` e `NKL-REVISOR` são auxiliares do
  9router;
- quando ambos os conjuntos de configuração estão válidos, `CLINE_*` tem
  precedência para o coordenador e `NINE_ROUTER_*` é usado para os auxiliares;
- configuração parcial ou inválida falha explicitamente, sem fallback
  silencioso para um modo que produziria uma rede incompleta.

## Fluxo

1. `delegate_to_deepseek` recebe uma tarefa não vazia.
2. O orquestrador classifica a tarefa e gera um plano compacto com:
   objetivo, arquivos-alvo, perguntas para os operários, orçamento e critério
   de revisão.
3. O worker executa no máximo **3 operários** em paralelo.
   Cada operário recebe somente a pergunta, limites, manifestos/citações
   necessários e as ferramentas seguras de leitura.
4. Os operários retornam JSON compacto com conclusão, evidências, incertezas
   e caminhos/linhas; resultados idênticos ou repetidos são deduplicados.
5. O revisor recebe apenas o plano e os resultados compactos. A revisão é
   **obrigatória em toda tarefa**, usando `NKL-REVISOR` e o fusion/juiz do
   gateway quando configurado.
6. O orquestrador sintetiza a resposta final com evidências, incertezas e
   status. Nenhum agente recebe permissão para alterar o workspace.

Para tarefas simples, o orquestrador pode reduzir o fan-out, mas a revisão
continua obrigatória. Não haverá limite artificial agregado de tokens que
prejudique a qualidade; haverá apenas limites de segurança de tempo,
iterações, tamanho de entrada/saída e no máximo três operários. Se um agente
falhar, outro agente elegível será tentado; se a tentativa também falhar, o
coordenador Cline executará a parte restante e marcará a origem do resultado.

## Economia de tokens

- Limites por papel: contexto, iterações, saída e deadline configuráveis, sem
  teto agregado fixo de tokens na primeira versão.
- Envelopes estruturados; sem repetir arquivos inteiros entre papéis.
- Leitura sob demanda por caminho e limite de bytes.
- Fan-out paralelo limitado e sem subagentes recursivos.
- Deduplicação por tarefa normalizada e caminhos consultados.
- Sem cache na primeira versão. Reutilização manual futura será uma decisão
  explícita do orquestrador, nunca automática.
- O revisor recebe somente divergências e evidências relevantes.

## Segurança e falhas

- O processo continua local via MCP stdio; não abre listener.
- O workspace permanece fixo no repositório atual.
- `.env*`, credenciais, certificados, `.git`, `node_modules`, `.next` e
  `supabase/.temp/**` continuam bloqueados pelos leitores existentes.
- Chaves só entram na configuração do cliente HTTP/Cline e nunca em prompts,
  resultados, stdout, stderr ou artefatos.
- Cada chamada tem timeout, cancelamento aguardado e descarte garantido.
- Falhas de configuração, autenticação, limite, timeout ou provedor retornam
  status estruturado e não são convertidas em conclusão.
- O worker não usa `enableSpawnAgent` nem `enableAgentTeams`; a rede é
  orquestrada explicitamente pelo processo para manter custos e permissões
  previsíveis.

## Compatibilidade e migração

O worker atual de modelo único será mantido como componente de compatibilidade
durante a migração, mas o modo combinado será o caminho padrão quando as
variáveis `NINE_ROUTER_*` e `CLINE_*` obrigatórias estiverem presentes. Não
haverá fallback silencioso se apenas um dos lados estiver configurado. O
runtime permanece Node.js 22+, compatível com `@cline/sdk`.

Antes de habilitar o novo modo, a correção pendente de timeout/dispose do
worker atual deve estar aprovada em revisão. Depois, serão adicionados testes
com mocks para roteamento, fan-out, deduplicação, redaction, falhas e limites;
nenhum teste usará uma chave ou chamada de produção.

## Abordagens consideradas

1. **Gateway 9router único com Cline coordenador — escolhido.** Menos
   conexões, uma chave, aliases funcionais e fallback/round-robin
   centralizados. Mantém o Cline como responsável por assumir a tarefa quando
   auxiliares falharem, ao custo de depender do contrato do gateway.
2. **Perfis nativos Cline por agente.** Integração mais próxima do Cline, mas
   exige manter configurações por agente e dificulta controlar o orçamento
   agregado e o fallback entre muitos provedores.
3. **Híbrida com chamadas diretas por papel.** Dá controle máximo por modelo,
   mas duplica transporte, tratamento de falhas, redaction e observabilidade;
   não é adequada ao objetivo de gastar menos tokens e manter uma chave.
