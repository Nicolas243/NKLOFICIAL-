---
id: progress
tags: [progresso, checklist, milestones, pre-deploy]
links: [activeContext, projectBrief, techContext, decisionsLog]
updated: 2026-11-24
---

# Progress

Estado do trabalho. Contexto corrente em [[activeContext]]; decisoes em [[decisionsLog]];
gates de qualidade em [quality.md](../docs/quality.md); roteiro executivo em [ROADMAP-DEPLOY.md](../docs/ROADMAP-DEPLOY.md).

## Baseline concluido

- [x] Auth, catalogo de cordas, luthiers, professores, agendamento e reviews.
- [x] Catalogo de renda extra `/programas` com hubs, editorial e links de afiliados.
- [x] Checkout Stripe de guias (logado e convidado) com webhook idempotente.
- [x] Bucket privado `guide-assets-private` + marca d'agua PDF/XLSX/HTML com `encryptedCpf`.
- [x] Inventario publicitario (migracoes 0042/0043) e mural de parceiros (placeholder).
- [x] Fundacao do Quiz de Negocios (migracao 0046_quiz_engine) e IA na Pratica (0047).
- [x] MCP local 9router via `fetch()` nativo, sem dependencia de Cline (commit 8a897e7).
- [x] Snapshot limpo + e-books pagos movidos para `private-assets/guias/` (commit 5729383).
- [x] Gates de baseline: lint, typecheck e `test:deepseek-mcp` 48/48 verdes.

## Overnight concluido e integrado em `master`

- [x] Home base `/` + musica em `/musica/naipe_cordas` + shell unificado (`feat/home-base-music-move`).
- [x] Funil de e-books, downloads 403, recuperacao e 5 idiomas "Em breve" (`feat/guides-funnel-downloads`).
- [x] IA na Pratica, Quiz de Negocios, LGPD, paridade Drizzle (`feat/ia-quiz-compliance`).
- [x] Anuncios, saved programs, Micro1 e SEO (`feat/ads-catalog-seo`).
- [x] Memoria `.ai-memory/` + skill `ai-memory-graph` + protocolo cross-IDE (`feat/memory-second-brain`).
- [x] Integrar branches em `master`, alinhar E2E do mural (`e2e/ad-previews.spec.ts`) e validar `npm run verify` + 199 testes unitarios + 46 testes E2E Playwright.
- [x] Roteiro executivo pre-deploy documentado em [ROADMAP-DEPLOY.md](../docs/ROADMAP-DEPLOY.md).
- [x] Sincronizacao cross-IDE nao destrutiva (`tools/ide-mcp-manifest.json`, `scripts/sync-ide-configs.mjs`, `ide:sync` / `ide:doctor` / `ide:extensions`).
- [x] Refatoracao visual, copy humana (zero jargoes) e contraste dark 60/30/7/3 + light anti-ofuscamento da pagina inicial (`/`) com filtro rapido por area.
- [x] Ajustes finos da home (`/`): tema claro em cinza-ardosia, 3 botoes de apoio lado a lado em `375px`, capas visuais 16:9 em todos os 15 cards e parallax interativo mouse/toque/scroll.
- [x] Upgrade DesignRush/IFF + midia editorial na home (`/`): simulacao fluida Euleriana 2D em canvas, barra sticky wayfinding com progresso, Bento strip factual, Roda interativa do Portal, contador de apoiadores (`0`) e 12/14 capas fotograficas `.jpg` (`guia-renda-extra.svg` e `idioma-chines.svg` mantidos ate reset da cota).
- [x] Motor fluido GPU WebGL2/WebGL1 (`webgl-fluid-engine.ts`) e fallback Canvas2D (`fluid-simulation.ts`) com adveccao dt-independente, `stirBurst` no clique, arraste e rolagem, composicao transparente calibrada para Tema Claro (`#c4d2e4`) e Tema Escuro (`#090b10`), + traducao simples, perguntas criativas e coluna `O que NKL_OFICIAL precisa fazer para finalizar` em [ROADMAP-DEPLOY.md](../docs/ROADMAP-DEPLOY.md).
- [x] Limpeza de diagnosticos do workspace (~376 problemas de IDE zerados: CSS legado `AntigoNKL`, `globals.css`/`style.css`, `eslint.config.mjs`, `tsconfig.json`, `.vscode/settings.json`, `equipe_nkl.py`), regeneracao de 15 capas 960x540 em `public/images/areas/` (mantendo `idioma-chines.jpg`), desbloqueio do fluido e parallax no Windows (`PortalFluidToggle` + remocao de trava passiva `reduced-motion`) e deslocamento hidrodinamico por cards/divs no scroll (`displaceRect`).
- [x] Vercel Speed Insights integrado: `@vercel/speed-insights/next` (`<SpeedInsights />`) montado em `src/app/layout.tsx`, `_vercel` ignorado no matcher de `src/proxy.ts` e transparência tecnica atualizada em `src/app/privacidade/page.tsx`.
- [x] Calibracao visual e fisica do fluido/parallax (`webgl-fluid-engine.ts`, `fluid-simulation.ts`, `portal-home-parallax.tsx`, `globals.css`): tinta premultiplicada Porter-Duff (evita estouro branco no escuro ao girar o mouse), cores escuras no tema claro e claras no tema escuro, `SPLAT_RADIUS_BASE` reduzido para `0.0014`, velocidade reduzida (`SIM_SPEED_SCALE = 0.55`, `LERP_FACTOR = 0.055`) e teste unitario `src/components/home/__tests__/fluid-simulation.test.ts`.
- [x] Obstaculos solidos reais na simulacao fluida (`fluid-obstacles.ts`, `webgl-fluid-engine.ts`, `fluid-simulation.ts`, `portal-home-parallax.tsx`): mascara de retangulos arredondados via `uObstacles` + condicoes Neumann/free-slip + sincronizacao reativa (`obstaclesDirty`) garantindo colisao nas bordas e zero vazamento por tras dos cards/divs, validado por 5 testes unitarios.
- [x] Home & Roadmap 2.1 P1 (Telemetria do Funil): capas editorial `idioma-chines.jpg` e `guia-renda-extra.jpg` regeneradas, card `nkl-cordas` atualizado para `NKL Cordas — Violino (outros em breve)` e eventos `track_select`, `install_cta_click`, `install_prompt_accepted` e `offer_cta_click` integrados em `analytics.ts`, `PortalTrackSelector`, `InstallFunnelClient` e `OfferCheckoutCta` (GA4 + PostHog + Vercel Analytics com gate LGPD).
- [x] **Fase B Remota — Banco de Dados e Storage (`vgogceknmqdqzzpztkrr`)**: confirmadas `0042`–`0045` ja ativas (`partner_programs` 45 linhas, `ad_inventory_slots` 10 slots); aplicadas na ordem `0041_saved_partner_programs`, `0046_quiz_engine` (`business_profiles` 6 perfis), `0047_ai_learning_product` e `0048_user_entitlements` (RLS `relrowsecurity=true` nas 7 tabelas + politica `user_entitlements_select_own`); aplicado `REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;` (zerando warnings `0028`/`0029`); upload concluido dos 11/11 ativos em `guide-assets-private` via `npm run guides:upload`.
- [x] **Fase C — Stripe Live e Variaveis na Vercel (`nkloficial/portal-nkl`)**: corrigida propagacao exata de `productSlug` no checkout (`product-checkout-client.tsx`, `create-ai-checkout`, `create-guide-checkout`, `guide.ts`, testes unitarios `13/13`); provisionados produto `prod_VgX0id233sZwnv`, precos `price_1Uf9woQzOKRNmIifJbahYlE0` (`R$ 99`) e `price_1Uf9woQzOKRNmIifqjA4yfZ1` (`R$ 39/mês`), cupons `nkl_idioma_30` (30%) / `nkl_idioma_50` (50%), webhook `we_1Uf9wpQzOKRNmIifj8PgQnwE` (13 eventos); sincronizados `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `AI_ONE_TIME_STRIPE_PRICE_ID`, `AI_SUBSCRIPTION_STRIPE_PRICE_ID` e `STRIPE_WEBHOOK_SECRET` na Vercel e removidas as 8 vars legadas (`HOTMART_*` / `MERCADOPAGO_*`).
- [x] **Expansao Geral & Fase D (2026-11-24)**: aplicada `drizzle/0049_platform_expansion.sql` (55 oportunidades em `/programas`, 18 perfis na Bussola Top-3, `push_subscriptions.app_scope`); template Resend redesenhado com `NKL.png` e backfill enviado para 22/22 usuarios pendentes; 6 idiomas liberados com `LanguageAiAndPlanner` (4 faixas etarias + planner 90d + upsell 30%/50% no Stripe); `AiPromptLab` + liberacao semanal NotebookLM em `ai-course.ts`; Mural de Parceiros ilimitado por categoria; Push Admin por sub-app; playbooks (`PADRAO-CARDS-IA.md`, `MAPA-AFILIADOS-50-OPORTUNIDADES.md`, `GUIA-CLOUDFLARE-EMAIL-E-NOTEBOOKLM.md`, `EBOOK-50-FORMAS-RENDA-EXTRA-AMAZON.md` + `build-amazon-book.ts`), `npm run verify` (`62/62` unitarios + build) e push/deploy Fase D em `https://nkloficial.com.br`.
- [x] **Polimento Fluido + /programas 55+ + Checklist Offline (2026-11-24)**: colisores fantasma internos com raio real circular/pilula (`buildGhostObstacleRect` + `hasPaintedSurface`), paletas +30% mais vibrantes no WebGL/Canvas2D (`+32%` croma no shader), destaque das 55+ formas reais em `/programas` e guia `docs/CHECKLIST-OFFLINE-NKL.md`.

## Proximas acoes manuais (Contas Externas)

- [ ] **Contas de Afiliados**: abrir cadastros prioritarios de [CHECKLIST-OFFLINE-NKL.md](../docs/CHECKLIST-OFFLINE-NKL.md) e colar links em `/admin`.
- [ ] **Cloudflare Email Routing**: apontar NS do Registro.br para Cloudflare preservando DNS da Vercel/Resend e ativar `@nkloficial.com.br` ([GUIA-CLOUDFLARE-EMAIL-E-NOTEBOOKLM.md](../docs/GUIA-CLOUDFLARE-EMAIL-E-NOTEBOOKLM.md)).
- [ ] **Amazon KDP & NotebookLM**: subir os arquivos gerados em `private-assets/amazon-book/` para KDP (eBook + Paperback 6x9") e publicar audios do NotebookLM.
- [ ] **Limitacao Free tier Supabase / Opcional VAPID**: ativar *Leaked Password Protection* ao migrar para Pro e cadastrar `VAPID_*` se quiser Push OS alem do painel in-app.
