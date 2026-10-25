# Status da Arquitetura

## Escopo da auditoria

Auditoria estática realizada em 24 de outubro de 2026 sobre:

- `src/db/schema.ts`;
- arquivos SQL e journal em `drizzle/`;
- nomes das variáveis presentes em `.env.local`;
- estado da árvore Git.

Nenhum valor de segredo foi incluído neste documento.

## Release Candidate — hardening operacional

O estado atual inclui as migrações `0010_scheduling.sql` até
`0016_suspension_and_rls.sql`, além do bundle idempotente
`drizzle/manual_cloud_sync.sql`. A migração `0016` adiciona conclusão de aulas,
controle de suspensão e políticas RLS para os fluxos de agendamento,
matrículas, avaliações e denúncias.

### Fluxos protegidos

- Três denúncias com status `resolved` suspendem automaticamente o perfil ou
  estabelecimento alvo, bloqueiam novas matrículas de professores e geram
  notificação interna.
- Administradores podem revisar, suspender preventivamente e reabilitar
  entidades pelo painel administrativo.
- Tokens OAuth do Mercado Pago próximos da expiração são renovados usando o
  refresh token armazenado server-side.
- Webhooks de pagamento exigem assinatura HMAC válida.
- Aulas confirmadas são concluídas automaticamente após a janela operacional
  e podem ser marcadas manualmente por um participante.
- Titulares podem exportar seus dados em JSON ou solicitar anonimização pelo
  dashboard, sem exportação de tokens OAuth.

### Checklist de produção

1. Aplicar o conteúdo de `drizzle/manual_cloud_sync.sql` no SQL Editor do
   Supabase Cloud.
2. Configurar as variáveis do Supabase, Mercado Pago, Daily.co, Upstash e
   `CRON_SECRET` na Vercel.
3. Configurar `NEXT_PUBLIC_SITE_URL` e `CRON_SECRET` nos secrets do GitHub
   Actions.
4. Configurar o OAuth do Mercado Pago com redirect URI apontando para
   `/api/payments/mp-callback`.
5. Validar `/api/health`, o webhook assinado e o cron autenticado antes de
   liberar pagamentos em produção.

### Webhook Mercado Pago

Em produção, a URL deve ser exatamente:

`https://SEU_DOMINIO_PUBLICO/api/payments/webhook`

A rota aceita somente notificações com `x-signature`, `x-request-id` e
`data.id` válidos. O segredo correspondente deve ser configurado como
`MERCADOPAGO_WEBHOOK_SECRET` na Vercel. O segredo não deve ser colocado no
frontend, no repositório ou em mensagens de suporte.

## Tabelas implementadas no schema atual

O arquivo `src/db/schema.ts` declara as seguintes 23 tabelas PostgreSQL:

1. `users`
2. `strings_catalog`
3. `news_events`
4. `business_directory`
5. `news_feed`
6. `news_comments`
7. `news_likes`
8. `news_suggestions`
9. `partner_programs`
10. `partner_program_reviews`
11. `partner_suggestions`
12. `user_profiles`
13. `string_reviews`
14. `subscriptions`
15. `notifications`
16. `favorite_strings`
17. `favorite_luthiers`
18. `favorite_businesses`
19. `favorite_professors`
20. `luthier_reviews`
21. `luthier_leads`
22. `luthier_portfolio`
23. `password_change_attempts`

O schema também declara relações Drizzle para entidades de notícias, favoritos e avaliações.

## Status das migrações SQL

### Arquivos presentes

O diretório `drizzle/` contém os arquivos:

- `0000_cool_layla_miller.sql`
- `0001_fat_sunspot.sql`
- `0002_early_namora.sql`
- `0003_sloppy_piledriver.sql`
- `0004_password_change_attempts.sql`
- `0005_favorite_businesses.sql`
- `0006_favorite_professors.sql`
- `0007_news_engagement.sql`
- `0008_partner_programs.sql`
- `0009_partner_program_details.sql`

### Journal local do Drizzle

O arquivo `drizzle/meta/_journal.json` registra somente:

- `0000_cool_layla_miller`
- `0001_fat_sunspot`
- `0002_early_namora`
- `0003_sloppy_piledriver`

As migrações `0004` a `0009` estão presentes como arquivos SQL, mas não aparecem no journal local auditado. Portanto, este repositório não fornece evidência estática suficiente para afirmar que essas migrações foram aplicadas no banco remoto. A confirmação exige acesso ao banco e execução/consulta do mecanismo de migrações do Drizzle.

### Conteúdo relevante das migrações posteriores

- `0004`: tentativas de alteração de senha;
- `0005`: favoritos de empresas e colunas enriquecidas do diretório;
- `0006`: favoritos de professores;
- `0007`: comentários e curtidas de notícias;
- `0008`: programas de parceria, avaliações públicas e sugestões;
- `0009`: atualização das descrições detalhadas dos programas de parceria.

## Variáveis identificadas no `.env.local`

Foram identificados os seguintes nomes de chaves, sem leitura ou exposição dos valores:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NVIDIA_API_KEY`
- `CLINE_API_KEY`
- `CLINE_BASE_URL`
- `GEMINI_APY_KEY`
- `ADMIN_BOOTSTRAP_SECRET`
- `CRON_SECRET`

Observação: `NVIDIA_API_KEY` e `GEMINI_APY_KEY` aparecem repetidas no arquivo de ambiente. A lista acima apresenta cada nome uma única vez.

Também existem variáveis exigidas pelo código de produção que não foram identificadas na leitura do `.env.local`:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`
- `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`

Com a validação fail-fast atual em `src/env.ts`, a ausência dessas chaves impede a inicialização da aplicação em ambientes que carreguem essa configuração.

## Estado do Git no momento da auditoria

A árvore de trabalho estava limpa antes da criação deste documento. A única alteração produzida nesta auditoria é o próprio arquivo `STATUS-ARQUITETURA.md`.

Nenhum commit foi criado automaticamente.
