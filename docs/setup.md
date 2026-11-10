# Setup e recuperação

## Comandos canônicos

```powershell
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
npm run verify
npm run test:e2e
```

O servidor local padrão usa `http://localhost:3000`. Verifique `/api/health` quando a alteração envolver banco ou configuração.

## Ambiente

- `.env.local` é local e contém segredos; nunca o exibir ou versionar.
- `.env.example` documenta nomes de variáveis, não valores.
- O worker MCP e a rede auxiliar exigem Node.js 22 ou superior e são
  destinados ao uso local via transporte stdio.
- A aplicação local usa `DATABASE_URL`, Supabase e outras integrações conforme a funcionalidade.
- A rota `/api/health/config` informa apenas se as variáveis obrigatórias estão configuradas, sem retornar valores secretos. Use-a depois do deploy para detectar drift de ambiente.
- Não executar migrações, seeds ou sincronizações contra produção sem autorização específica.

## Recuperação

1. pare apenas o processo local criado para a tarefa;
2. preserve o working tree e compare `git diff` antes de qualquer restauração;
3. consulte o backup da sessão se documentos de contexto precisarem ser recuperados;
4. reproduza o problema com o menor comando possível;
5. corrija a causa e repita o gate correspondente.

## Deploy

Deploy não faz parte do setup automático. Primeiro valide localmente, obtenha aprovação e só então execute o procedimento da plataforma com os segredos já configurados.

Para produção na Vercel:

1. Configure as variáveis de `.env.example` no projeto e no ambiente `Production`, sem colar segredos em commits ou logs.
2. Verifique `/api/health/config` e `/api/health` após o deploy.
3. Configure no Mercado Pago o webhook de pagamento único em `/api/payments/webhook` e o webhook de assinaturas em `/api/payments/subscription-webhook`.
4. Configure `SUPABASE_SERVICE_ROLE_KEY` apenas no ambiente local e na Vercel. Essa chave é usada exclusivamente no servidor para gerar URLs assinadas do bucket privado.
5. Confirme no Supabase o schema remoto antes de aplicar `drizzle/0032_guide_sales_offers.sql` e `drizzle/0033_guide_download_quota.sql`; não execute `push` ou `migrate` cegamente.
6. Para `drizzle/0034_partner_affiliate_links.sql`, confirme primeiro o histórico remoto e os slugs `montink-embaixador`, `pawns-app`, `fiverr`, `attapoll`, `afiliados-b2b-tubebuddy-make` e `flambra`. Aplique o arquivo revisado uma única vez pelo fluxo aprovado de migrações (ou pelo SQL Editor autorizado quando esse for o procedimento do ambiente), sem alterar o arquivo para “forçar” uma segunda execução. Verifique com `SELECT slug, affiliate_url, updated_at FROM partner_programs WHERE slug IN (...);` e registre o resultado; esta tarefa não aplica a migração.
7. Depois de confirmar o schema, envie os cinco ativos pagos para o Storage privado com `npm run guides:upload`. O script procura primeiro em `Conteudo de novembro/` e depois na raiz para também localizar `Guia Essencial Renda Extra 2027 _ Portal NKL.pdf`; nenhum ativo deve ser copiado para `public/`.
8. Após o deploy, valide a compra sandbox, a página de sucesso, um download de cada ativo e o bloqueio ao atingir a cota de dez tentativas.

## Alternativa Hotmart

1. Crie dois produtos na Hotmart: um produto avulso de R$ 39 e uma assinatura mensal de R$ 19.
2. Copie os links públicos de checkout para `HOTMART_GUIDE_CHECKOUT_URL` e `HOTMART_SUBSCRIPTION_CHECKOUT_URL`.
3. Copie os IDs dos produtos para `HOTMART_GUIDE_PRODUCT_ID` e `HOTMART_SUBSCRIPTION_PRODUCT_ID`.
4. Gere um token exclusivo no webhook da Hotmart e configure-o em `HOTMART_WEBHOOK_TOKEN`.
5. Aponte o webhook para `https://SEU_DOMINIO/api/payments/hotmart-webhook` e habilite eventos de aprovação, reembolso, chargeback, cancelamento e assinatura.
6. Configure a página de confirmação da Hotmart para retornar ao endereço público de sucesso com `provider=hotmart` e o identificador da transação no parâmetro `payment_id`. A entrega só é liberada depois que o webhook criar ou aprovar o registro correspondente.

O webhook valida o token, filtra o produto pelo ID configurado e grava a compra ou assinatura de forma idempotente. Os arquivos continuam no bucket privado; a Hotmart fornece o checkout e o evento de pagamento, enquanto o Portal NKL controla a cota e a entrega.

## Setup do toolkit

O escopo aplicado e as decisões de compatibilidade estão em [docs/toolkit-setup.md](./toolkit-setup.md). A revisão consultada foi registrada para evitar misturar instruções de versões diferentes.

## Worker MCP e rede NKL

O comando `npm run deepseek:mcp` inicia o worker local pelo transporte MCP
stdio. O processo não abre listener HTTP; o host MCP deve iniciá-lo com o
diretório raiz deste repositório. O worker mantém o workspace fixo e só expõe
os leitores seguros de listagem e leitura de arquivos.

Para habilitar a rede combinada, configure em `.env.local` os grupos completos
`CLINE_*` e `NINE_ROUTER_*` documentados em `.env.example`. O Cline permanece
como coordenador principal; `NKL-ORQUESTRADOR`, `NKL-OPERARIOS` e `NKL-REVISOR`
são aliases auxiliares enviados ao endpoint OpenAI-compatible do 9router.
`Alll` é literal e é resolvido pelo gateway. Configuração parcial falha
explicitamente, sem fallback silencioso.

O fluxo executa no máximo três operários em paralelo, tenta novamente um papel
falho uma vez e marca o trabalho restante como fallback do coordenador. A
revisão é obrigatória; se o revisor não estiver disponível, a resposta fica
`incomplete`. Não há cache automático na primeira versão.

Nenhum agente pode editar arquivos, executar shell/testes, acessar a web,
usar MCP externo, fazer deploy ou criar subagentes/equipes. Nunca coloque
valores de chaves, conteúdo de `.env.local` ou respostas de provedor em
prompts, logs, commits ou documentação.

Exemplo de registro MCP local, sem segredos:

```json
{
  "mcpServers": {
    "portal-nkl-deepseek": {
      "command": "npm",
      "args": ["run", "deepseek:mcp"],
      "cwd": "C:\\caminho\\para\\portal-nkl"
    }
  }
}
```

Valide alterações com:

```powershell
npm run test:deepseek-mcp
npx tsx --test tools/nkl-router-runner.test.ts tools/nkl-subagent-orchestrator.test.ts
```
