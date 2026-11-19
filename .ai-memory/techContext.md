---
id: techContext
tags: [stack, comandos, env, mcp, ferramentas, qualidade]
links: [projectBrief, systemPatterns, decisionsLog, progress]
updated: 2026-11-19
---

# Tech Context - Stack, Comandos e Contrato de Ambiente

Complementa [[projectBrief]] (produto) e [[systemPatterns]] (invariantes). Setup completo:
[setup.md](../docs/setup.md); gates de qualidade e falhas conhecidas:
[quality.md](../docs/quality.md); catalogo MCP: [mcp-catalog.md](../docs/mcp-catalog.md).

## Stack exata

- Next.js 16.4.5 (App Router, Turbopack). APIs diferem do treino: ler
  `node_modules/next/dist/docs/` antes de codar (bloco Next.js em `AGENTS.md`).
- React 19.2.8; TypeScript strict (`tsc --noEmit`); Tailwind CSS v4 (`@tailwindcss/postcss`).
- Drizzle ORM 0.45 + drizzle-kit 0.31; schema em `src/db/schema.ts`; migracoes em `drizzle/`.
- Supabase: Auth (`@supabase/ssr`), Postgres, Storage (bucket privado `guide-assets-private`).
- Stripe (checkout, assinaturas, webhooks); Resend (e-mail transacional);
  Upstash Redis (`@upstash/ratelimit`); Daily.co (salas de aula); Vercel Analytics.
- Playwright 1.62 (e2e em `e2e/`); testes unitarios com `tsx --test` / `node:test`.
- Node.js >= 22 (campo `engines`).
- MCP local `portal-nkl-deepseek`: servidor stdio em `tools/deepseek-mcp.ts` que chama o
  gateway local 9router via `fetch()` nativo (`/v1/chat/completions`, `/v1/models`);
  fallback legado Cline opcional. Ver [[decisionsLog]].

## Mapa de diretorios

- `src/app`: rotas e route handlers; `src/actions`: Server Actions; `src/lib`: dominio puro;
  `src/components`: UI; `src/db`: schema/conexao; `src/content/guias`: fonte markdown de e-books.
- `drizzle/`: migracoes SQL aditivas; `tools/`: MCP, orquestrador e video factory;
  `scripts/`: geracao/upload de guias; `private-assets/` (gitignored): e-books pagos.
- `.ai-memory/`: memoria persistente; `.agents/skills/`: skills de projeto.

## Comandos canonicos

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor local |
| `npm run lint` / `npm run lint -- --quiet` | ESLint 9 (config Next) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run verify` | lint + typecheck + build (gate de entrega) |
| `npm run test:e2e` | Playwright (fluxos criticos; baseline em quality.md) |
| `npm run test:deepseek-mcp` | Testes do MCP local / router / orquestrador |
| `npm run test:video-factory` | Testes da video factory |
| `npm run guides:generate` / `npm run guides:upload` | Gera e envia ativos de guias |
| `node .agents/skills/ai-memory-graph/scripts/memory-graph.mjs build` | Reindexa memoria |

## Contrato de ambiente (somente nomes, nunca valores)

Valores vivem em `.env.local` ou no provedor de deploy. Referencia: `.env.example`.

- Banco/Supabase: `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` (server-only).
- Checkout convidado: `GUEST_CHECKOUT_ENCRYPTION_KEY` (criptografia de CPF).
- Anuncios: `AD_PROMOTIONAL_PRICE_CENTS`, `AD_STANDARD_PRICE_CENTS`, `AD_PROMOTION_END_DATE`.
- E-mail: `EMAIL_DELIVERY_MODE`, `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `MATERIAL_ADMIN_EMAIL`.
- App/SEO/analytics: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CLARITY_PROJECT_ID`,
  `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` (carregados apos consentimento).
- Seguranca: `CRON_SECRET`, `ADMIN_BOOTSTRAP_SECRET`, `WEBHOOK_SECRET`.
- Stripe: `STRIPE_API_KEY`, `STRIPE_SECRET_KEY` (fallback legado), `STRIPE_RESTRICTED_KEY_FOR_AGENTS`,
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `AI_ONE_TIME_STRIPE_PRICE_ID`, `AI_SUBSCRIPTION_STRIPE_PRICE_ID`.
- Rate limit: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. Video: `DAILY_API_KEY`.
- 9router: `NINE_ROUTER_PROVIDER_ID`, `NINE_ROUTER_BASE_URL`, `NINE_ROUTER_API_KEY`,
  `NINE_ROUTER_ORQUESTRADOR_MODEL`, `NINE_ROUTER_WORKER_MODEL`, `NINE_ROUTER_REVIEWER_MODEL`,
  `NINE_ROUTER_ALL_ALIAS`, `NINE_ROUTER_MAX_WORKERS` (1-3), `NINE_ROUTER_RETRY_LIMIT` (0-1).
- Legado Cline (opcional): `CLINE_PROVIDER_ID`, `CLINE_MODEL_ID`, `CLINE_API_KEY`, `CLINE_BASE_URL`.

Configuracao ausente nunca vira sucesso: falhar com erro observavel (ver [[systemPatterns]]).
