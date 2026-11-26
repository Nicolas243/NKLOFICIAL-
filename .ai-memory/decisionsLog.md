---
id: decisionsLog
tags: [adr, decisoes, descartes, historico]
links: [projectBrief, techContext, systemPatterns, activeContext]
updated: 2026-11-24
---

# Decisions Log - ADRs Concisos

Formato fixo de 3 linhas por entrada: Decisao / Motivo / Descartado. Entradas mais
recentes no topo. Contexto: [[systemPatterns]], [[techContext]], [[projectBrief]].

## ADR-019 (2026-11-26) Webhook Stripe `2026-10-28.endive`, Checkout Email & Manifesto Stripe MCP
- Decisao: adicionar `extractStripeInvoiceSubscriptionId` em `webhook-helpers.ts` lendo `parent.subscription_details.subscription` antes de `invoice.subscription`, preservar e normalizar `email` em `processGuidePurchase`, sincronizar `businessDirectory.planType` em `processPremiumSubscription`, pre-preencher `customerEmail` em `buildGuidePurchaseCheckoutParams`, remover o sufixo duplicado `| E-book Portal NKL` em `language-ebook-preview.tsx` e incluir `"stripe"` (`https://mcp.stripe.com`) em `tools/ide-mcp-manifest.json`.
- Motivo: eventos da conta Stripe live usam a versao `2026-10-28.endive` (onde o ID de assinatura na fatura fica aninhado em `parent.subscription_details`), e unificar o MCP do Stripe cross-IDE acelera futuras atualizacoes e diagnosticos de pagamentos.
- Descartado: depender apenas de `invoice.subscription` legado ou configurar MCP Stripe manualmente fora do manifesto compartilhado.

## ADR-018 (2026-11-26) Auditoria SEO 20 Pontos: 404 Real, 301s, SSR /comparar, Canonicals Unicos, sameAs & AuthorBio
- Decisao: remover `src/app/loading.tsx` e `src/app/programas/[slug]/loading.tsx` para restaurar HTTP `404` real em rotas dinamicas (`notFound()`), centralizar redirecionamentos `301` (`/musica`, `/anuncie`, `/anuncie/contrato`, `/blog/renda-extra`, `/comparador`) em `next.config.ts`, converter `/comparar` em Server Component + cliente, remover `canonical` do `layout.tsx`, preencher titulos/canonicals unicos, adicionar `sameAs` em `Organization`, zerar orfas no `footer.tsx` e montar `<AuthorBio />` factual (`NKL_oficial`).
- Motivo: `loading.tsx` forcava streaming `200` com `<meta noindex>` (Soft 404), `canonical` no root `layout.tsx` vazava `/` para rotas filhas sem canonical, `next/navigation redirect()` emitia `307`, titulos replicavam `| Portal NKL` e `/comparar` dependia de fetch client-side.
- Descartado: manter `loading.tsx` com wrapper condicional ou inventar biografias/redes nao verificadas em `sameAs`.

## ADR-017 (2026-11-24) Saneamento Supabase 0050, Build Phase Segura na Vercel, IDE Clean & 5 Pilares SEO Renda Extra
- Decisao: aplicar `0050_performance_fk_indexes_and_rls_policies.sql` (24 indices de FK + policies restritivas `deny_direct_client_access` em 37 tabelas Drizzle server-only), isolar placeholders de env apenas em `NEXT_PHASE === 'phase-production-build'` com `/*turbopackIgnore: true*/` nos `readFile` locais, suprimir scans de docs/HTML/skills em `.vscode/settings.json`, e implantar os 5 pilares SEO (`SearchAction`, `FAQPage`, 8 hubs ISR, malha interna `/programas/[slug]` e `sitemap.ts` sem redirect).
- Motivo: zerar 61 avisos acionaveis do Supabase Advisor, corrigir falha `/api/ads/click` em Vercel Preview builds sem expor segredos de producao, eliminar 238 falsos positivos na IDE e concentrar autoridade semantica de `renda extra` no Google.
- Descartado: desabilitar validacao Zod de env em runtime, abrir politicas RLS permissivas para `anon` ou replicar secrets de producao em Preview.

## ADR-016 (2026-11-24) Colisores Fantasma Arredondados + Fluido +30% Chroma + Checklist Offline
- Decisao: substituir caixas fixas no fluido por `buildGhostObstacleRect` (colisor menor interno com `rx/ry` ate `0.5` e filtro `hasPaintedSurface` para ignorar wrappers transparentes), elevar saturacao das paletas WebGL/Canvas2D com reforco `+32%` de croma em `DISPLAY_SHADER`, destacar explicitamente `55 formas reais` em `/programas` e consolidar o roteiro manual de afiliados/KDP/Cloudflare em `docs/CHECKLIST-OFFLINE-NKL.md`.
- Motivo: eliminar contornos quadrados ao redor de circulos/cards curvos, remover aparencia acinzentada sem queimar fundo escuro ou perder contraste claro, evidenciar a cobertura completa de renda extra e entregar lista acionavel para operacao offline.
- Descartado: injetar nodes fantasma reais no DOM (overhead de layout/mutation) ou aumentar alpha global no dark mode (lavaria o fundo escuro).

## ADR-015 (2026-11-24) Desbloqueio dos 6 Idiomas, Upsell 30%/50%, Catalogo 55 + Mural Dinamico e Push por Sub-App
- Decisao: liberar os 6 idiomas (`comingSoon: false`) com `LanguageAiAndPlanner` e desconto progressivo automatico no Stripe (`nkl_idioma_30`/`nkl_idioma_50` via contagem de `guide_purchases`), expandir `partner_programs` para 55 (15 cards/pagina + recursos do portal integrados) e `business_profiles` para 18 (Top-3 com playbooks reais), abrir `/mural-de-parceiros` ilimitado agrupado por `businessCategory`, segmentar `push_subscriptions.app_scope` com envio no `/admin`, e gerar livro Amazon KDP em Kindle + 6x9" via `build-amazon-book.ts`.
- Motivo: transformar a entrega de idiomas em pacote completo irresistivel, atender perfis sem capital e com investimento inicial com clareza realista, permitir crescimento ilimitado de anunciantes por area e segmentar comunicados por sub-app instalado.
- Descartado: manter 5 idiomas travados em `coming-soon`, limitar `/mural-de-parceiros` aos 10 slots fixos do in-feed ou acoplar envio de notificacoes exclusivamente a chaves VAPID ausentes.

## ADR-014 (2026-11-24) Propagacao de `productSlug` no Checkout e Provisionamento Stripe Live -> Vercel
- Decisao: propagar `productSlug` explicito de `ProductCheckoutClient` ate `/api/payments/create-ai-checkout`, `/api/payments/create-guide-checkout` e `buildGuidePurchaseCheckoutParams`; criar em `acct_1UZsOzQzOKRNmIif` o catalogo `IA na Prática NKL` (`prod_VgX0id233sZwnv`, 2 precos BRL) + webhook de 13 eventos (`we_1Uf9wpQzOKRNmIifj8PgQnwE`) enviando `STRIPE_WEBHOOK_SECRET` direto em memoria para a Vercel via stdin, e remover as 8 vars legadas Hotmart/MercadoPago.
- Motivo: evitar fallback errado de SKU entre `bussola-negocios`/`pacote-renda-extra` e `ferramenta-ia`/`curso-ia-pratica`, ativar os endpoints de checkout/webhook Live na Vercel sem expor segredos em logs ou historico, e eliminar variaveis mortas.
- Descartado: depender apenas de `offerVariant` legado no webhook ou gravar segredos via argumentos de shell/arquivos temporarios.

## ADR-013 (2026-11-23) Execucao da Fase B Remota + Endurecimento RLS/RPC no Supabase
- Decisao: aplicar apenas as migracoes faltantes `0041`, `0046`, `0047` e `0048` em `vgogceknmqdqzzpztkrr` mantendo `relrowsecurity = true` default-deny nas tabelas acessadas apenas via Drizzle server-side (`user_entitlements` com `user_entitlements_select_own`), revogar `EXECUTE` de `public.rls_auto_enable()` para `PUBLIC, anon, authenticated`, e subir os 11/11 ativos pagos em `guide-assets-private`.
- Motivo: `0042`–`0045` ja estavam aplicadas no banco de producao, o codigo nao consulta essas tabelas via PostgREST no cliente, e o Security Advisor exigia bloqueio imediato da funcao `SECURITY DEFINER` (`0028`/`0029`) antes do upload de todos os guias privados.
- Descartado: re-aplicar `0042`–`0045` manualmente ou abrir politicas `anon`/`authenticated` permissivas em tabelas exclusivas do servidor (`quiz_leads`, `ai_access_grants`).

## ADR-012 (2026-11-22) Obstaculos Solidos DOM na Simulacao Navier-Stokes
- Decisao: rasterizar caixas arredondadas dos cards e blocos visiveis da home em `fluid-obstacles.ts` (`uObstacles` RGBA na GPU + array 1-canal no fallback Canvas2D), aplicando reflexao de divergencia, condicao de Neumann na pressao, deslizamento livre (free-slip) sem penetracao e descarte no shader de exibicao, sincronizando via flag `obstaclesDirty`.
- Motivo: fazer o fluido colidir fisicamente com as bordas dos elementos e escoar ao redor em vez de passar por tras dos containers, sem disparar `getBoundingClientRect` ou uploads WebGL ociosos quando nao ha scroll/resize/mutacao.
- Descartado: recortar apenas com CSS/SVG estatico (sem fisica de deflexao no campo de velocidade) ou varrer o DOM em todo frame mesmo parado.

## ADR-011 (2026-11-20) Fluido Submerso em Cards + Desbloqueio Windows Reduced-Motion + Capas 16:9
- Decisao: desacoplar o fluido/parallax de `prefers-reduced-motion` (que congelava o canvas no Windows quando `SPI_GETCLIENTAREAANIMATION=False`), expor controle explicito `PortalFluidToggle`, adicionar `displaceRect()` em WebGL2/Canvas2D para cards empurrarem o fluido no scroll, substituir 15 capas por arte editorial 960x540 mantendo `idioma-chines.jpg`, e isolar `.worktrees`/`AntigoNKL` nas configs de lint/TS/IDE.
- Motivo: restaurar interatividade continua para visitantes em Windows com animacoes do sistema desligadas, criar sensacao fisica de containers submersos em liquido e eliminar falso-positivos de CSS/TS/Tailwind do workspace.
- Descartado: manter trava automatica por `matchMedia('(prefers-reduced-motion: reduce)')` e apagar worktrees Git.

## ADR-010 (2026-11-20) Marca Portal NKL + Sub-apps por Area + CTA Unico de Conta + Fluido dt-Independente
- Decisao: unificar a marca instalavel principal como `Portal NKL` (removendo `Rumo`), nomear cada sub-app PWA pela sua area (`Renda Extra`, `Musica`, `Idiomas`, `IA na Pratica`), exibir apenas um botao contextual de conta (`Entrar` ou `Minha conta`), e corrigir a dissipacao por `dt` e forca por substep nos motores `webgl-fluid-engine.ts` e `fluid-simulation.ts`.
- Motivo: evitar dupla entrada redundante na barra, alinhar o nome instalado no celular ao dominio escolhido pelo usuario e garantir rastros fluidos visiveis ao mexer com mouse, toque e rolagem tanto no tema claro quanto no escuro.
- Descartado: manter marca separada `Rumo`, botoes simultaneos `Entrar` + `Minha conta` e divisao de velocidade por substeps.

## ADR-009 (2026-11-20) Funil Seletor de Trilha e PWAs isolados (marca substituida por ADR-010)
- Decisao: estruturar a home em 4 trilhas (`src/config/tracks.ts`) levando a `/instalar?trilha=...` -> `/ofertas/[slug]` (`src/config/products.ts`), e servir manifests isolados em `/app/[slug]/manifest.webmanifest` apenas para ferramentas standalone (`bussola-negocios`, `ferramenta-ia`), substituindo a marca raiz Rumo por `Portal NKL` conforme ADR-010.
- Motivo: transformar a entrada por objetivo em um funil claro sem jargao corporativo e permitir instalacao dedicada por aplicativo no celular sem prefixo NKL nem mistura entre ferramentas e e-books estaticos.
- Descartado: manter um unico manifest generico para todas as ferramentas ou links diretos de card pago para fluxos internos sem pagina de oferta.

## ADR-008 (2026-11-20) Acesso individual por SKU em `user_entitlements` + guard no servidor
- Decisao: isolar cada produto pago por `(user_id, product_slug)` na tabela `user_entitlements` (`drizzle/0048_user_entitlements.sql`, `src/lib/entitlements.ts`), exigir `requireProductAccess(slug)` nas rotas protegidas (`/app/[slug]`, `/quiz-negocios`, `/resultado`, `/ia/curso`, `/ia/resultado`) e liberar/revogar via webhook Stripe (`product_entitlement`).
- Motivo: garantir no servidor que o comprador acesse somente os SKUs adquiridos sem vazamento entre produtos, contas ou rotas diretas nao autenticadas, mantendo `Minha Conta` como hub fiel.
- Descartado: flag unica de assinatura global no perfil ou bloqueio apenas visual no cliente.

## ADR-007 (2026-11-19) Manifesto cross-IDE + sync nao destrutivo
- Decisao: centralizar servidores MCP em `tools/ide-mcp-manifest.json` e sincronizar `.vscode/mcp.json`, `.mcp.json`, `.cursor/mcp.json` e `~/.gemini/config/mcp_config.json` via `scripts/sync-ide-configs.mjs`.
- Motivo: compartilhar MCPs, CLIs (`ide:doctor`) e extensoes (`.vscode/extensions.json`) entre VS Code, Antigravity, Cursor e Claude Code sem apagar configuracoes previas do usuario.
- Descartado: sobrescrever configs globais (`%APPDATA%\Code\User\mcp.json`) ou replicar `${input:clarity-api-token}` fora do VS Code.

## ADR-006 (2026-11-19) Memoria persistente `.ai-memory/` + skill de grafo
- Decisao: memoria cross-IDE versionada em `.ai-memory/` consultada por BFS ponderado (`ai-memory-graph`).
- Motivo: agentes recuperam so os nos conectados relevantes, sem varrer `docs/` inteiro; protocolo unico em AGENTS.md.
- Descartado: memoria apenas em vault externo (nao versionada) e embeddings/vetores (dependencias e custo).

## ADR-005 (2026-11-19) 5 e-books nao ingleses marcados `coming-soon`
- Decisao: espanhol, italiano, frances, alemao e chines exibem "Em breve" no registro e nas paginas.
- Motivo: conteudo ainda nao validado para venda; evitar checkout de produto incompleto.
- Descartado: manter checkout ativo para todos os idiomas e remover as paginas (perda de SEO).

## ADR-004 (2026-11-19) E-books pagos fora de `public/guias/`
- Decisao: arquivos pagos movidos para `private-assets/guias/` (gitignored); fonte do ingles em `src/content/guias/`.
- Motivo: `public/` e servido sem autenticacao; entrega so via bucket privado com marca d'agua.
- Descartado: ofuscar nomes de arquivo em `public/` e bloquear por middleware (seguranca por obscuridade).

## ADR-003 (2026-11-19) Home musical em `/musica/naipe_cordas`
- Decisao: `/` vira hub multivertical; home musical migra para `/musica/naipe_cordas`, preservando sub-rotas existentes.
- Motivo: portal cresceu alem de musica; registro central alimenta a home base.
- Descartado: renomear/mover sub-rotas musicais (quebra de links e SEO) e home unica mista.

## ADR-002 (2026-11-19) MCP local 9router desacoplado do Cline
- Decisao: `tools/deepseek-mcp.ts` chama o 9router com `fetch()` nativo (Node >= 22); Cline vira fallback opcional.
- Motivo: menos dependencias, controle de timeout/retry e workers paralelos limitados (1-3).
- Descartado: manter `@cline/sdk` como caminho principal (acoplamento e falhas em Windows).

## ADR-001 Stripe como autoridade de pagamento
- Decisao: estado de compra so muda via webhook assinado e idempotente (`stripe_webhook_events`).
- Motivo: evitar fraude por redirect de sucesso e duplicidade de eventos.
- Descartado: confirmar compra pela pagina de sucesso no cliente.
