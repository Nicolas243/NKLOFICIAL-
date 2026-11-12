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

## Login com Google (configuração manual)

O Google OAuth depende de configuração no Supabase e no Google Cloud; não há
segredo no código ou em arquivos versionados. Quando o provedor estiver
indisponível, use e-mail e senha enquanto conclui esta checklist:

1. No Supabase, abra **Authentication > Providers > Google** e ative o provedor.
2. Crie ou selecione um OAuth Client no Google Cloud e informe o **Client ID** e
   o **Client Secret** nos campos do provider Google do Supabase.
3. No Google Cloud, adicione
   `https://<project-ref>.supabase.co/auth/v1/callback` aos redirect URIs autorizados.
4. No Supabase, em **Authentication > URL Configuration > Redirect URLs**, adicione
   `http://localhost:3000/auth/callback` e a URL equivalente de produção.
5. Teste o login com e-mail/senha e Google, inclusive o retorno ao Guia quando a
   compra exigiu autenticação.
6. Mantenha os segredos somente no `.env.local` ou no gerenciador de variáveis
   do ambiente. Nunca cole Client Secret, chaves Supabase ou tokens em commits,
   documentação pública, logs ou screenshots.

## Ambiente

- `.env.local` é local e contém segredos; nunca o exibir ou versionar.
- `.env.example` documenta nomes de variáveis, não valores.
- A aplicação local usa `DATABASE_URL`, Supabase e outras integrações conforme a funcionalidade.
- O checkout sem login exige `GUEST_CHECKOUT_ENCRYPTION_KEY`; essa chave nunca deve ser
  trocada sem um plano de migração, porque impede descriptografar CPFs já registrados.
- Para testar recuperação local sem enviar e-mails, use `EMAIL_DELIVERY_MODE=preview`.
  Em produção, use `EMAIL_DELIVERY_MODE=resend`, `RESEND_API_KEY` e `EMAIL_FROM`.
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
3. Configure no Stripe o endpoint `/api/payments/stripe-webhook` e copie o
   signing secret para `STRIPE_WEBHOOK_SECRET`. Use o Stripe CLI para
   encaminhar eventos em desenvolvimento.
4. Configure `SUPABASE_SERVICE_ROLE_KEY` apenas no ambiente local e na Vercel. Essa chave é usada exclusivamente no servidor para ler o bucket privado e personalizar os arquivos em memória.
5. Confirme no Supabase o schema remoto antes de aplicar `drizzle/0032_guide_sales_offers.sql`, `drizzle/0033_guide_download_quota.sql` e `drizzle/0037_personalized_guide_assets.sql`; não execute `push` ou `migrate` cegamente.
6. Revise e aplique, somente após aprovação explícita, `drizzle/0038_guest_checkout_access.sql` e
   `drizzle/0039_guest_download_attempts.sql`. A primeira adiciona identidade/token convidado
   e a segunda cria a cota atômica de duas tentativas por material. Esta sessão não aplicou
   nenhuma migration remota.
7. Para `drizzle/0034_partner_affiliate_links.sql`, confirme primeiro o histórico remoto e os slugs `montink-embaixador`, `pawns-app`, `fiverr`, `attapoll`, `afiliados-b2b-tubebuddy-make` e `flambra`. Aplique o arquivo revisado uma única vez pelo fluxo aprovado de migrações (ou pelo SQL Editor autorizado quando esse for o procedimento do ambiente), sem alterar o arquivo para “forçar” uma segunda execução. Verifique com `SELECT slug, affiliate_url, updated_at FROM partner_programs WHERE slug IN (...);` e registre o resultado; esta tarefa não aplica a migração.
8. Depois de confirmar o schema, envie os cinco ativos pagos para o Storage privado com `npm run guides:upload`. O script procura primeiro em `Conteudo de novembro/` e depois na raiz para também localizar `Guia Essencial Renda Extra 2027 _ Portal NKL.pdf`; nenhum ativo deve ser copiado para `public/`.
9. Após o deploy, valide a compra sandbox, a página de sucesso, um download personalizado de cada ativo e o bloqueio na terceira tentativa do mesmo material. O CPF fica restrito ao banco e à marca visual do arquivo; nunca o envie em URLs, logs ou analytics.

Durante o desenvolvimento local, `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` podem ficar
ausentes: as páginas públicas continuam carregando, e as rotas Stripe respondem
`503 stripe_not_configured` até que o checkout seja configurado. Para testar pagamentos,
preencha as duas variáveis com chaves de teste e use o Stripe CLI conforme abaixo.

## Setup do toolkit

O escopo aplicado e as decisões de compatibilidade estão em [docs/toolkit-setup.md](./toolkit-setup.md). A revisão consultada foi registrada para evitar misturar instruções de versões diferentes.

## Stripe CLI

No Windows, instale e configure a CLI com:

```powershell
winget install --id Stripe.StripeCli --source winget
stripe login
stripe agent setup
stripe listen --forward-to http://localhost:3000/api/payments/stripe-webhook
```

Use o `whsec_...` exibido pelo `stripe listen` apenas no `.env.local` durante o desenvolvimento. Em produção, use o signing secret do endpoint configurado no Dashboard da Stripe.
