# Estado Atual — Portal NKL (Relatório de Contexto)

> Relatório base gerado em 01/09/2026; a seção de atualização abaixo registra a revisão mais recente.
> Branch `master` · HEAD `0400e8b` · Stack: Next.js 16.4.5 (App Router) + TypeScript + Supabase + Drizzle ORM.
> Não foram lidos `node_modules/`, `.next/`, `dist/`, `out/` nem artefatos de build/log.

## Atualização desta revisão

- A landing de Renda Extra usa cabeçalho próprio, prioriza a assinatura de R$ 19/mês e oferece a escolha entre Stripe e Hotmart após um único CTA quando o link Hotmart está configurado.
- O verificador da oferta avulsa de R$ 39 inicia automaticamente ao carregar a página.
- O fundo musical global agora usa três camadas de paralaxe com `translate3d`, símbolos discretos e respeito a `prefers-reduced-motion`.
- O seed do catálogo foi executado de forma idempotente para 118 cordas. Os links foram normalizados para `mercado_livre`, `shopee`, `amazon` e `ebay`, usando busca de fallback quando ainda não existe link afiliado autenticado.
- `npm run typecheck`, `npm run lint` e `npm run build` passaram; permanecem 12 avisos legados em `AntigoNKL`.
- A integração de links afiliados autenticados nos painéis externos e a auditoria do Google Ads continuam bloqueadas por sessão externa não disponível nesta execução.
- O botão de vídeo do catálogo agora abre o pop-up diretamente. Quando não há ID de YouTube cadastrado, o pop-up oferece uma busca contextual em português em vez de carregar um player indisponível.
- Os cliques de saída para afiliados são enviados como `outbound_click` e as aberturas do pop-up como `video_open`, respeitando a presença do `gtag` após o consentimento.
- A verificação final desta revisão passou em `npm run verify`; o build ainda emite apenas os avisos conhecidos de acesso dinâmico a arquivos e diretórios sem dados de lojas/professores.
- A página de detalhe de oportunidades ganhou cache de 5 minutos e `loading.tsx` para reduzir consultas repetidas entre conteúdo e metadados e mostrar uma resposta visual imediata.
- O catálogo inicial permanece focado em descoberta, sem o bloco de estratégias. As visualizações secundárias
  exibem um roteiro fechado e copiável até o primeiro saque para cada oportunidade; estratégias de múltiplos
  caminhos aparecem apenas em modelos editoriais específicos, como canal dark, UGC, Creator Space e afiliados
  de marketplaces. Compartilhar, criar lembrete e instalar o app também estão disponíveis na página individual.
- Os modais de oportunidade, vídeo e instalação agora fecham com `Escape`, preservam o `overflow` anterior
  da página e permitem fechamento pelo backdrop quando aplicável.
- No catálogo, “Comece pela sua situação” fica minimizado por padrão, o espaço extra antes dos cards
  foi reduzido e o parallax do tema claro ganhou contraste sem alterar a intensidade do tema escuro.
- O botão e o lembrete de instalação desaparecem após confirmação do evento de instalação, entrada
  em modo standalone ou marcador de instalação já reconhecido. A paleta foi suavizada em cerca de 25%
  para reduzir fadiga visual mantendo legibilidade.
- A medição opcional agora inclui Microsoft Clarity, PostHog e Vercel Analytics, inicializados somente após consentimento. Os provedores cobrem tanto a área de Renda Extra quanto a área musical; o PostHog registra a área contextual para separar os relatórios.
- Os arquivos `public/googlea9035dd53b94a78b.html` e
  `public/blog/renda-extra/googlea9035dd53b94a78b.html` atendem às duas possíveis
  URLs informadas pelo Google Search Console; o segundo corresponde ao caminho
  `/blog/renda-extra/`.

## 1. Visão Geral e Stack

- **Framework:** Next.js `16.3.1` (App Router, build Turbopack), React `19.2.8` / React DOM `19.2.8`.
- **Linguagem:** TypeScript `~5` (strict; alias `@/*` → `src/*`; plugin `next` no `tsconfig.json`).
- **Estilo:** Tailwind CSS v4 (`@tailwindcss/postcss`), theming dark/light via `next-themes ^0.4.6`, ícones `lucide-react ^1.33.0`.
- **Supabase:** `@supabase/ssr ^0.12.4` + `@supabase/supabase-js ^2.112.3`.
- **Banco/ORM:** `drizzle-orm ^0.45.2` + `drizzle-kit ^0.31.10` + driver `postgres` (postgres-js) `^3.4.9` — conexão direta via `DATABASE_URL`.
- **Qualidade/Test:** ESLint 9 (`eslint-config-next`), Playwright `^1.62.1` (`npm run test:e2e`), scripts `dev/build/start/lint`.
- **Scripts utilitários:** `src/scripts/*.ts` via `tsx` (ETL do legado + seeds).
- **CI/CD:** `.github/workflows/production.yml` presente.

## 2. Topologia de Rotas (Next.js App Router)

**Públicas / marketing (SSR):**
- `/` — Home: 3 queries paralelas (top cordas por `communityScore`, luthiers premium `planType='premium'`, últimas notícias).
- `/catalogo` e `/catalogo/[id]` — catálogo facetado (busca, core material, faixa de preço, paginação; client `catalog-client.tsx`).
- `/comparar` — comparador canônico de cordas · `/recomendados` (`recommended-client.tsx` + `src/data/recomendados.ts`).
- `/guia-de-cordas` · `/clinica` · `/lojas` · `/professores` · `/luthiers` + `/luthiers/[id]` · `/contatos` · `/meu-setup`.
- `/fisica-do-som` — página canônica de física do som.
- `/importacao` — fluxo de importação com URL ASCII.
- `/noticias` e `/noticias/anunciar`.
- `/sitemap.ts` (SEO) · `/error.tsx` e `/not-found.tsx` global.

**Auth e conta:**
- `/login` (`login-form.tsx`) · `/registro` (`registro-form.tsx`).
- `/perfil` · `/perfil/avaliacoes` · `/perfil/notificacoes` · `/perfil/privacidade`.

**Painéis:**
- `/admin` — métricas (MRR, membros, leads), publicar/excluir notícias, botão "Promover a Admin".
- `/dashboard/luthier` e `/dashboard/luthier/planos`.

**Route Handlers (API):**
- `GET /api/cron/sync-subscriptions` — protegido por `Authorization: Bearer CRON_SECRET`; rebaixa `subscriptions` vencidas para `past_due` e sincroniza `user_profiles.planType`/`business_directory.planType` para `free`.
- `POST /api/webhooks/gateway` — valida `x-gateway-signature`; upsert de `subscriptions` por `gatewaySubscriptionId`; sincroniza o plano do perfil e da vitrine.
- 👉 Sem Route Handler de auth callback (fluxo 100% password + Server Actions).

**Proxy (substitui middleware, convenção Next 16):**
- `src/proxy.ts` — bypass em `/api/*` (stateless, `Cache-Control: no-store`); aplica `updateSession()` do `@supabase/ssr` nas demais rotas. Matcher ignora estáticos/imagens.

## 3. Estado do Supabase

- **Clientes (`@supabase/ssr`) em 3 camadas:**
  - `src/lib/supabase/client.ts` → `createBrowserClient` (URL + ANON_KEY).
  - `src/lib/supabase/server.ts` → `createServerClient` + `cookies()` (setAll silencioso em Server Components; o proxy absorve cookies).
  - `src/lib/supabase/middleware.ts` → `updateSession` (patch de cookies entre request/response), invocado pela `src/proxy.ts`.
- **Server Actions:** TODO o fluxo autenticado passa por `src/actions/*.ts` (`'use server'`). O app **não usa `.from()` nem RPC do cliente Supabase** — Auth (signIn/signUp/getUser) e Storage são Supabase; o Postgres é acessado só via Drizzle (`src/db/index.ts` — `postgres(DATABASE_URL, { prepare: false })`).
- **Projeto linkado:** `vgogceknmqdqzzpztkrr` ("NKL"). Hostname do Storage hardcoded no `next.config.ts` (remotePatterns `/storage/v1/object/public/**`).
- **Storage:** bucket `public-assets` — usado em `news-admin.ts` (caps ≤5MB) e `portfolio.ts`.
- **Database Drizzle (15 `pgTable`):** `users`, `user_profiles`, `strings_catalog`, `news_events`, `business_directory`, `news_feed`, `news_suggestions`, `string_reviews`, `subscriptions`, `notifications`, `favorite_strings`, `favorite_luthiers`, `luthier_reviews`, `luthier_leads`, `luthier_portfolio`. `relations()` completas (com `relationName` para autores/alvos duplicados).
- **Migrations aplicáveis (4):** `0000` (business_directory, news_events/news_feed, strings_catalog, users), `0001` (user_profiles), `0002` (favoritos/leads/portfolio/reviews/notificações/subscriptions; re-aponta `business_directory.user_id` → `user_profiles.id`; adiciona `affiliate_links`, `bio`, `plan_type`), `0003` (news_suggestions).
- **ETL/Seed:** `consolidate-legacy-data.ts` (UPSERT idempotente por `name`, chunks de 50, transacional), `seed-catalog-sql.ts` (gera `seed-output.sql`), `seed-news.ts`, `seed-catalog.ts`.
- **Segurança:** nenhuma migration cria política RLS (`grep "create policy"/rls` = 0); autorização manual por `role` dentro de cada action. Sem tipos gerados do Supabase — tipagem 100% via Drizzle (`$inferSelect/$inferInsert`).

## 4. Principais Componentes

- `header.tsx` + hook `use-smart-header.ts` — header adaptativo (scroll/auto-hide).
- `radial-menu.tsx` (~252 linhas) — menu radial "pizza" da home (geometria complexa; **WIP não commitado**).
- `curtain-intro.tsx` — intro/cortina animada no load.
- `parallax-background.tsx` — fundo parallax global.
- `footer.tsx` · `theme-provider.tsx`/`theme-toggle.tsx` (dark/light).
- `favorite-button.tsx` · `notification-bell.tsx` — estado do usuário logado.
- `premium-checkout-button.tsx` · `copy-coupon-button.tsx` · `whatsapp-lead-button.tsx` — CTAs de monetização/lead.
- `privacy-actions.tsx` — LGPD (export + exclusão lógica).
- Client pages: `catalog-client.tsx` · `recommended-client.tsx` · `login-form.tsx` · `registro-form.tsx` · `news-form.tsx` · `suggest-news-modal.tsx`.

## 5. Dívida Técnica e Pendências

- **BUG de identidade (crítico):** `registerWithProfile` insere em `user_profiles` **sem `id`** (usa `defaultRandom`), enquanto as demais actions buscam por `supabase.auth.getUser().user.id`. O perfil criado fica órfão do uid do Supabase → favorites/compliance/portfolio/leads/pagamentos falham para recém-registrados.
- **Duplicidade de tabelas de usuário:** `users` (migração 0000) órfã — nenhum código a usa (só `news_events` tem FK). O padrão real é `user_profiles` (23 arquivos).
- **Tabela morta:** `news_events` só existe no schema; nenhuma action lê/grava (o app usa `news_feed`/`news_suggestions`).
- **Signup/login não sincronizam perfil:** `login` e `signup` não criam/atualizam `user_profiles`; `signup` nem chama `registerWithProfile`.
- **Checkout Premium:** `startPremiumCheckout` cria uma sessão real do Stripe e o webhook confirma a assinatura.
- **Secrets ausentes no `.env.local`:** `CRON_SECRET` e `GATEWAY_WEBHOOK_SECRET` não configurados → cron responde 401 em dev; webhook aceita payload sem assinatura (modo dev documentado no código).
- **Sem RLS no Postgres:** dependência total do gating manual nas actions; qualquer action sem check de role vira vetor de acesso.
- **FKs `ON DELETE no action` em todo o grafo:** exclusão real de `user_profiles` impossível; `deleteUserAccount` (LGPD) contorna com anonimização lógica, mas `subscriptions`/`luthier_*` não são tocados (restos identificáveis).
- **Aliases legados de rota:** `/fisica do som` e `/importação` são tratados pelo `src/proxy.ts` e redirecionados para `/fisica-do-som` e `/importacao`; não criar novas pastas com espaço ou acento.
- **e2e defasado:** `critical-path.spec.ts` espera H1 "Portal NKL" na home; a home atual renderiza "O Cuidado Oculto por trás da Voz do Instrumento" → a suíte deve falhar.
- **Artefatos/lixo fora do código-fonte:** `nul` (arquivo-lixo de redirect no Windows, untracked, contém stderr de `dir`), `seed-output.sql` (SQL gerado, 138KB), `schema_backup.txt`, `write_profile.py` (vazio). Backups e dumps que estavam dentro de `src/` foram removidos na auditoria estrutural.
- **WIP não commitado:** `globals.css`, `curtain-intro.tsx`, `radial-menu.tsx` modificados no working tree.
- **Herança legada no repo:** `AntigoNKL/` (site estático HTML/JS/imagens) e `public/NKL/` (assets duplicados) — candidatos a mover/remover do monorepo do app.
- **Config hardcoded:** hostname do Supabase fixo no `next.config.ts` (~`vgogceknmqdqzzpztkrr`) em vez de env.
- **`/api/*` fora do matcher do proxy:** decisão intencional (stateless para webhooks/cron com auth própria), mas qualquer futuro handler "protegido por sessão" dependerá de auth manual.
- **Sem tipagens Supabase geradas:** sem `Database` type; erros de schema só explodem em runtime (sem guard em compile-time).