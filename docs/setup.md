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
6. Depois de confirmar o schema, envie os quatro ativos pagos para o Storage privado com `npm run guides:upload`. A pasta local `Conteudo de novembro/` é ignorada pelo Git e não deve ser copiada para `public/`.
7. Após o deploy, valide a compra sandbox, a página de sucesso, um download de cada ativo e o bloqueio ao atingir a cota de oito tentativas.

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
