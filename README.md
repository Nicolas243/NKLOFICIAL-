# Portal NKL

Documentação operacional:

- [Visão do produto](./PRODUCT.md)
- [Arquitetura](./docs/architecture.md)
- [Onboarding](./docs/onboarding.md)
- [Setup e recuperação](./docs/setup.md)
- [Qualidade](./docs/quality.md)

**Marketplace B2B que conecta músicos a luthiers** — catálogo técnico de cordas com avaliações da comunidade, diretório de profissionais, dashboard comercial com assinaturas Premium e ecossistema de favoritos ("Meu Setup").

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack, Server Actions) + React 19 (Optimistic UI) |
| ORM | Drizzle ORM (PostgreSQL) |
| Banco / Auth / Storage | Supabase |
| Estilo | Tailwind CSS v4 |
| Qualidade | TypeScript strict (sem `any`), ESLint `--max-warnings=0` |

## Arquitetura de Dados

O schema Drizzle (`src/db/schema.ts`) é organizado em domínios:

- **Catálogo** — `strings_catalog` (encordoados com métricas técnicas) e `string_reviews` (avaliações com upsert anti-duplicidade via unique composta `string_id + user_id`).
- **B2B Directory** — `user_profiles` (RBAC: `user` / `luthier` / `admin`) e `business_directory` (dados comerciais: WhatsApp, plano, bio, FK estrita para `user_profiles`).
- **Assinaturas / Paywall** — `subscriptions` (espelho do gateway: status, período) sincronizada com `plan_type`; recursos premium (portfólio, métricas de leads) bloqueados no plano gratuito.
- **Notificações** — `notifications` in-app com gatilhos silenciosos (leads, avaliações) e badge no header.
- **Analytics** — `luthier_leads` (rastreamento de cliques no WhatsApp) alimentando o MRR/leads do dashboard admin.
- **Favoritos** — tabelas associativas com PK composta (`favorite_strings`, `favorite_luthiers`).
- **Conteúdo** — `news_feed` gerenciado pelo CMS de admin.

### Fronteiras de Integração

| Endpoint | Segurança | Função |
|---|---|---|
| `POST /api/webhooks/gateway` | `x-gateway-signature` (`GATEWAY_WEBHOOK_SECRET`) | Recebe eventos do gateway, atualiza `subscriptions` e sincroniza `plan_type` |
| `GET /api/cron/sync-subscriptions` | `Authorization: Bearer` (`CRON_SECRET`) | Rebaixa assinaturas expiradas (`active` + período vencido → `past_due` + plano `free`) |

## Setup Local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar o ambiente
cp .env.example .env.local
#    Preencha DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
#    (obtidos no painel do Supabase).

# 3. Rodar em desenvolvimento
npm run dev
```

O Supabase Storage requer o bucket **público `public-assets`** (uploads de portfólio, capas de notícias e avatares, pastas `luthiers/`, `news/`).

## Comandos de Verificação (Metodologia Zero-Defeitos)

Todo commit **deve** passar pela tríade de homologação — o pipeline `.github/workflows/production.yml` (Node 20, `ubuntu-latest`) aplica os mesmos gates em `push`/`pull_request` para `main`:

```bash
npx eslint src/ --max-warnings=0   # 0 warnings tolerados
npx tsc --noEmit                   # tipagem estrita, sem asserções soltas
npm run build                      # build de produção (Turbopack)
```

Utilitários de manutenção:

```bash
npx drizzle-kit push    # sincroniza o schema com o Postgres (usar com cautela)
npm run seed            # popula dados de demonstração (src/db/seed.ts)
```
