# Roadmap Executivo Pre-Deploy e Evolucao Arquitetural — Portal NKL

**Destinatario:** NKL_OFICIAL (Lideranca Tecnica e de Produto)
**Branch Consolidada:** `master` (commits locais validados; zero push/deploy/migracao remota executados)
**Baseline de Qualidade Verificada Localmente:** `npm run verify` (lint `--quiet` + typecheck + build de producao Next.js 16), 199 testes unitarios Vitest, 48 testes do worker MCP `deepseek-mcp` e 24 testes E2E Playwright verdes.

---

## 1. Resumo Executivo e Estado Atual

Esta consolidacao reflete a integracao completa de 5 frentes de engenharia na branch `master` local, somada ao diagnostico real da infraestrutura remota (Supabase `vgogceknmqdqzzpztkrr` em `sa-east-1` e Vercel `portal-nkl` / `nkloficial.com.br`). Nenhuma alteracao foi empurrada para producao; todas as mudancas remotas dependem de execucao ordenada do checklist na Secao 4 apos aprovacao explicita de NKL_OFICIAL.

### Matriz de Estado: Local Pronto (`master`) vs. Producao Pendente (Supabase / Vercel / Stripe)

| Dominio / Subsistema | Estado Local em `master` (Pronto e Testado) | Estado Remoto em Producao (Pendente de Execucao) | Bloqueador para Release? |
|---|---|---|---|
| **Portal Base Home (`/`) & Shell Global** | Home institucional base implementada sem header tradicional, com atmosfera parallax, cards editoriais dark petrol lidos de `src/lib/portal-areas.ts`. Home musical migrada para `/musica/naipe_cordas` (com redirect em `/musica` e preservacao de `/catalogo`, `/luthiers`, `/professores`, `/comparar`, `/meu-setup`, `/lojas`, `/noticias`). Shell unificado via `getPortalSurface` elimina vazamento de header/footer musical em `/ia*`, `/quiz-negocios`, `/blog/aprender/*` e `/guias/*`. | Deploy da branch `master` na Vercel pendente. | Sim (Deploy Vercel) |
| **Guias & E-books de Idiomas** | Ativos pagos (18 arquivos `.pdf`, `.html`, `.md`) removidos de `public/guias/` e isolados em `private-assets/guias/` (gitignored). Fonte do leitor do e-book de ingles movida para `src/content/guias/ingles-para-ganhar-dinheiro.md`. `/guias/ingles/ebook` convertido em amostra interativa de 5 aulas com bloqueio das aulas 6–100 e funil de conversao. Demais 5 idiomas marcados como `coming-soon` na UI + trava server-side `HTTP 409 coming_soon` no checkout. Nome do ativo de mandarim unificado (`chines-para-ganhar-possibilidades.pdf`). Bug de `HTTP 403` no download autenticado corrigido (`encryptedCpf` + multiplas compras). Ordenacao de recuperacao corrigida (`desc`). `/perfil` e `/guias/renda-extra/sucesso` filtrados por ativos adquiridos + validacao UUID. Slugs YouGlish corrigidos e `/blog/aprender/italiano` traduzido para PT-BR. `POST /api/materials` desacoplado de pastas ignoradas e sem vazamento de PDF pago (entrega `guia-renda-extra-nkl.pdf` com `pdf-lib`). | Bucket privado `guide-assets-private` no Supabase contem apenas os 5 ativos de Renda Extra de novembro. Falta enviar `ingles-para-ganhar-dinheiro.pdf` via `npm run guides:upload` antes de liberar vendas do guia de ingles em producao. | Sim (Upload Storage) |
| **IA na Pratica (`/ia`)** | Rota `POST /api/payments/create-ai-checkout` implementada com validacao server-side de Price IDs. Webhook Stripe (`ai_one_time` e `ai_subscription`) provisionando e sincronizando `ai_access_grants` (`active`, `past_due`, `canceled`). Componente `AiOfferCheckout` interativo conectado em `/ia` e `/ia/oferta`. `revalidatePath` corrigido para `/ia/curso`, `/ia/prompts` e `/ia/ferramentas`. Diagnostico de 4 eixos e links/prompts reais em `/ia/resultado`. Migracao local `drizzle/0047_ai_learning_product.sql` numerada com `ON DELETE CASCADE`. | Aplicar `drizzle/0047_ai_learning_product.sql` no Supabase remoto. Criar produtos/precos na Stripe e configurar `AI_ONE_TIME_STRIPE_PRICE_ID` e `AI_SUBSCRIPTION_STRIPE_PRICE_ID` na Vercel (`Production`). | Sim (DB + Env Stripe) |
| **Quiz de Negocios (`/quiz-negocios`, `/resultado`)** | Motor `src/lib/quiz-engine.ts` corrigido: eixo `social` pontuando corretamente, 50 perguntas com escalas de score monotonicas e coerentes (`15 -> 45 -> 75 -> 100`), fallback resiliente `try/catch` quando `OPENAI_API_KEY` falha ou expira, consentimento LGPD obrigatorio antes do envio, links na Home, `/programas` e `sitemap.ts`. Migracao local `drizzle/0046_quiz_engine.sql` com `ON DELETE CASCADE`. | Aplicar `drizzle/0046_quiz_engine.sql` no Supabase remoto. Verificar `OPENAI_API_KEY` na Vercel se desejar analise enriquecida por LLM alem do motor deterministico. | Sim (DB Migration) |
| **Inventario Publicitario & Mural (`/programas/anuncie`, `/mural-de-parceiros`, `/admin`)** | Fechado bypass de moderacao: reenvio de criativo em campanha `active` volta para `pending_review` e libera `slotNumber` ate nova aprovacao; webhooks de reembolso/disputa limpam `slotNumber`. Removido vazamento de dados de clientes na pagina publica `/admin` para nao-admins. Corrigido calculo do botao multi-slot no checkout. Reserva de slot protegida por `pg_advisory_xact_lock` transacional. Criada vitrine publica `/mural-de-parceiros` com anuncios aprovados e CTA para `/programas/anuncie`. | Tabela `ad_campaigns` (`0042_ad_inventory.sql`) ja existe no banco remoto. Pendente apenas deploy do codigo na Vercel. | Nao (Apenas Deploy) |
| **Renda Extra, Salvos & Micro1 (`/programas`)** | Eliminado N+1 em `getUserSavedPrograms` (uso de `inArray`). Corrigida ressurreicao de programas removidos via `localStorage` para usuarios logados e restaurado salvamento local para visitantes sem login. Card Micro1 na listagem reflete contagem real filtrada; fetcher Micro1 com timeout de 8s (`AbortSignal.timeout`) e paginacao resiliente a falhas parciais. | A tabela `saved_partner_programs` (`drizzle/0041_saved_partner_programs.sql`) **nao foi aplicada** no Supabase remoto (historico remoto saltou da `0040` para `0042`). | Sim (Aplicar `0041`) |
| **Conformidade LGPD (`src/lib/compliance.ts`)** | Exportacao e anonimizacao expandidas para cobrir `quiz_leads`, `quiz_sessions`, `ai_access_grants`, `ai_onboarding_responses`, `ai_lesson_progress`, `ad_campaigns`, `guide_purchases`, `guide_download_events` e `saved_partner_programs`. | Depende das tabelas `0041`, `0046` e `0047` existirem no Supabase remoto para que `exportUserData` e `deleteUserAccount` executem sem erro de relacao inexistente. | Sim (Migracoes `0041`, `0046`, `0047`) |
| **Segundo Cerebro (`.ai-memory/`) & MCP 9router** | `.ai-memory/` estruturado + skill `ai-memory-graph` (BFS ponderado <10ms) + protocolo sincronizado em `AGENTS.md`, `CLAUDE.md` e `.github/copilot-instructions.md`. Servidor MCP `portal-nkl-deepseek` desacoplado do Cline, conectado direto a `http://127.0.0.1:20128/v1` com `fetch()` nativo, `search_workspace`, leitura por faixa de linhas, `ask_nkl_worker` e `list_nkl_models`. | Ferramentas estritamente locais de desenvolvimento; nao requerem provisionamento na Vercel. | Nao |
| **Seguranca Supabase & Higiene de Segredos** | Auditoria concluida sem expor segredos. Identificados 2 alertas no Supabase Security Advisor, variaveis legadas na Vercel e chave hardcoded em script Python local nao rastreado. | Revogar `EXECUTE` publico em `public.rls_auto_enable()`, ativar *Leaked Password Protection* no Supabase Auth, rotacionar chave OpenAI exposta em `equipe_nkl.py` e limpar envs legadas. | Recomendado P0 antes/junto ao deploy |

---

## 2. Roadmap de Melhorias por Area do Site

Priorizacao classificada por impacto de negocio e risco operacional:
- **P0 (Bloqueador / Pre-Deploy ou Pos-Deploy Imediato):** seguranca, integridade de pagamento/entrega, migracoes de banco e eliminacao de erros 4xx/5xx.
- **P1 (Alta Alavancagem — Ciclo de 7 a 14 dias):** conversao de funil, retencao, automacao operacional e SEO estrutural.
- **P2 (Expansao & Refinamento — Ciclo de 15 a 45 dias):** novas features, gamificacao, expansao editorial e internacionalizacao.

---

### 2.1 Portal Base Home (`/`) & Shell Global

A nova Home Base posiciona o Portal NKL como ecossistema multivertical (Musica, Renda Extra, IA Aplicada, Idiomas, Negocios e Publicidade), governado por `src/lib/portal-areas.ts` e `src/lib/portal-surface.ts`.

| Prioridade | Dimensao | Recomendacao Tecnica e de Produto | Arquivos / Rotas Alvo |
|---|---|---|---|
| **P0** | **Tecnico / Deploy** | Validar em staging/preview da Vercel a renderizacao de `src/components/home/portal-base-home.tsx` e os redirecionamentos de `/musica` -> `/musica/naipe_cordas`, garantindo zero regressao de cache em CDN para a rota raiz `/`. | `src/app/page.tsx`, `src/app/musica/page.tsx`, `src/lib/portal-areas.ts` |
| **P1** | **UX & Navegacao Cross-Vertical** | Introduzir um seletor compacto de vertical ("Trocar Area: Musica / Renda Extra / IA / Idiomas / Negocios") no `PortalVerticalHeader` (`src/components/layout/portal-vertical-shell.tsx`) para permitir transicao entre verticais em 1 clique sem exigir retorno manual a `/`. | `src/components/layout/portal-vertical-shell.tsx`, `src/lib/portal-surface.ts` |
| **P1** | **Conversao / Funil** | Instrumentar eventos de clique por card da Home Base (`portal_area_click` com metadados `area_id`, `status`, `destination_href`) no Microsoft Clarity / Analytics para medir a taxa de distribuicao de trafego entre Musica, Renda Extra, IA, Idiomas e Quiz. | `src/components/home/portal-base-home.tsx` |
| **P1** | **SEO & Structured Data** | Adicionar schema JSON-LD `WebSite` e `ItemList` na Home Base (`/`) descrevendo as verticais oficiais do Portal NKL, fortalecendo sitelinks organicos no Google para `nkloficial.com.br`. | `src/app/page.tsx`, `src/app/layout.tsx` |
| **P2** | **Acessibilidade & Performance** | Auditar contraste WCAG AA nos badges sobrepostos aos cards dark petrol (`#08171E` / `#0D222C`) e garantir que o efeito parallax de `PortalBaseHome` respeite integralmente `prefers-reduced-motion: reduce` em dispositivos moveis de entrada. | `src/components/home/portal-base-home.tsx`, `src/app/globals.css` |
| **P2** | **Conteudo Dinamico** | Exibir contadores vivos discretos nos cards da Home Base (ex.: numero de programas auditados em Renda Extra, vagas abertas na Micro1, slots disponiveis no Mural de Parceiros) usando cache ISR de 1 hora (`revalidate = 3600`). | `src/lib/portal-areas.ts`, `src/app/page.tsx` |

---

### 2.2 Musica — Naipe de Cordas (`/musica/naipe_cordas` e ecossistema musical)

A vertical musical permanece o nucleo historico de autoridade comunitaria do Portal NKL (violino, viola, violoncelo, contrabaixo, luthiers, professores, comparador, fisica do som e guia de cordas).

| Prioridade | Dimensao | Recomendacao Tecnica e de Produto | Arquivos / Rotas Alvo |
|---|---|---|---|
| **P0** | **SEO & Canonical URLs** | Verificar tags `<link rel="canonical">` em `/musica/naipe_cordas` e nas sub-rotas (`/catalogo`, `/luthiers`, `/professores`, `/guia-de-cordas`, `/fisica-do-som`, `/comparar`, `/meu-setup`, `/lojas`, `/noticias`) para assegurar que a mudanca da home musical nao dilua autoridade indexada anteriormente em `/`. | `src/app/musica/naipe_cordas/page.tsx`, `src/app/sitemap.ts` |
| **P1** | **Conversao / Marketplace de Professores** | Conectar o funil de `/professores` e `/agendar/[teacherId]` a notificacoes transacionais via Resend (confirmacao imediata ao aluno e alerta ao professor), reduzindo perda de leads em agendamentos de aulas. | `src/app/professores/page.tsx`, `src/app/agendar/[teacherId]/page.tsx`, `src/lib/email/` |
| **P1** | **Conteudo & Lead Magnet** | Revisar o fluxo de captura de e-mail do material gratuito de musica em `POST /api/materials` para garantir que usuarios da vertical `/musica/naipe_cordas` recebam um guia especifico de cordas/setup (separado do PDF de Renda Extra) com rastreamento de origem (`source: 'musica'`). | `src/app/api/materials/route.ts`, `src/components/home/home-page.tsx` |
| **P1** | **UX / Busca Unificada Musical** | Adicionar atalho de busca rapida (`Ctrl+K` ou barra fixa no topo de `/musica/naipe_cordas`) integrando instrumentos do `/catalogo`, profissionais de `/luthiers` e `/professores`, e artigos de `/fisica-do-som`. | `src/app/musica/naipe_cordas/page.tsx`, `src/components/layout/header.tsx` |
| **P2** | **Retencao / Meu Setup** | Permitir exportacao e compartilhamento publico por URL curta do setup montado em `/meu-setup` e `/comparar` (gerando card OpenGraph dinamico para compartilhamento em grupos de WhatsApp e orquestras). | `src/app/meu-setup/page.tsx`, `src/app/comparar/page.tsx` |
| **P2** | **Acessibilidade** | Garantir navegacao completa por teclado (`Tab`, `Enter`, `Escape`) e atributos `aria-expanded` nos filtros interativos de `/catalogo` e nas tabelas comparativas de `/guia-de-cordas`. | `src/app/catalogo/page.tsx`, `src/app/guia-de-cordas/page.tsx` |

---

### 2.3 Renda Extra & Catalogo (`/programas`, Micro1, Salvos, Experimentos)

Hub de monetizacao por afiliacao, curadoria de plataformas globais de trabalho remoto/IA e captura de intencao do usuario.

| Prioridade | Dimensao | Recomendacao Tecnica e de Produto | Arquivos / Rotas Alvo |
|---|---|---|---|
| **P0** | **Banco de Dados (Bloqueador)** | Aplicar `drizzle/0041_saved_partner_programs.sql` no Supabase de producao antes do deploy. Sem essa tabela, `getUserSavedPrograms` e `toggleSavedProgram` falharao para usuarios autenticados em producao. | `drizzle/0041_saved_partner_programs.sql`, `src/app/actions/saved-programs.ts` |
| **P1** | **Conversao / Sincronizacao Guest -> Auth** | Quando um visitante anonimo que salvou programas no `localStorage` fizer login ou criar conta, oferecer ou executar merge automatico unico dos slugs locais para `saved_partner_programs` no banco, limpando a chave local em seguida para evitar perda da curadoria pessoal. | `src/components/programs/saved-programs-context.tsx`, `src/app/actions/saved-programs.ts` |
| **P1** | **Tecnico / Resiliencia Micro1** | Adicionar cache persistente de fallback (ex.: ultimo snapshot valido em Redis/Upstash ou JSON estatico de contingencia) no `src/lib/micro1-jobs-fetcher.ts` para que, se o endpoint externo da Micro1 exceder o timeout de 8s, a vitrine `/programas/micro1` continue exibindo vagas recentes em vez de lista vazia. | `src/lib/micro1-jobs-fetcher.ts`, `src/app/programas/micro1/page.tsx` |
| **P1** | **Conversao & Afiliados** | Auditar todos os `affiliate_url` ativos na tabela `partner_programs` em producao (confirmando aplicacao e integridade de `0034_partner_affiliate_links.sql` e `0044_new_income_programs.sql`) e registrar cliques de saida (`outbound_affiliate_click`) por slug para identificar os 20% de programas que geram 80% da receita. | `src/app/programas/[slug]/page.tsx`, `drizzle/0034_partner_affiliate_links.sql`, `drizzle/0044_new_income_programs.sql` |
| **P2** | **SEO Programatico** | Expandir `generateMetadata` e dados estruturados (`FAQPage` / `SoftwareApplication` / `JobPosting` quando aplicavel) nas paginas individuais `/programas/[slug]` e hubs tematicos (`/programas/hub/[slug]`). | `src/app/programas/[slug]/page.tsx`, `src/app/programas/hub/[slug]/page.tsx` |
| **P2** | **UX / Filtros & Comparacao** | Adicionar filtro combinavel por "Moeda de Pagamento (USD/EUR/BRL)", "Requisito de Idioma" e "Tempo ate 1o Saque" em `/programas`, com persistencia via query string (`?moeda=USD&nivel=iniciante`) para URLs compartilhaveis. | `src/app/programas/page.tsx`, `src/components/programs/` |

---

### 2.4 Guias & E-books de Idiomas (Ingles + 5 Idiomas em Breve + Funil)

Vertical de venda direta de infoprodutos proprios com protecao antipirataria (bucket privado + marca d'agua PDF/HTML com CPF e cota de downloads).

| Prioridade | Dimensao | Recomendacao Tecnica e de Produto | Arquivos / Rotas Alvo |
|---|---|---|---|
| **P0** | **Infraestrutura Storage (Bloqueador)** | Executar `npm run guides:upload` apontando para o Supabase de producao para enviar `private-assets/guias/ingles-para-ganhar-dinheiro.pdf` ao bucket privado `guide-assets-private`, e garantir que a oferta `guia-ingles-dinheiro` (`drizzle/0045_english_ebook_guide_offer.sql`) esteja ativa em `guide_offers` e `guide_assets`. | `scripts/upload-private-guides.ts`, `drizzle/0045_english_ebook_guide_offer.sql` |
| **P0** | **Seguranca / Verificacao Pos-Deploy** | Confirmar via `curl -I https://nkloficial.com.br/guias/ingles-para-ganhar-dinheiro.pdf` que o retorno em producao e `HTTP 404` (nenhum ativo pago servido estaticamente em `public/guias/`). | `public/guias/`, `.gitignore`, `.vercelignore` |
| **P1** | **Conversao / Captura de Demanda (5 Idiomas `coming-soon`)** | Nas paginas de Espanhol, Italiano, Frances, Alemao e Mandarim (`/guias/[idioma]`), substituir o estado estatico de "Em breve" por uma lista de espera segmentada por idioma (`waitlist_language`), priorizando a producao editorial dos 5 e-books pela demanda real medida. | `src/lib/language-guides.ts`, `src/components/guides/language-guide-landing.tsx` |
| **P1** | **Funil da Amostra de Ingles (`/guias/ingles/ebook`)** | Adicionar barra de progresso fixa no leitor da amostra gratuita ("Voce concluiu X de 5 aulas gratuitas") e CTA contextual ao final da Aula 5 levando direto ao modal de checkout pre-selecionado em `/guias/ingles#comprar`. | `src/app/guias/ingles/ebook/page.tsx`, `src/lib/english-ebook.ts` |
| **P1** | **UX de Pos-Compra & Recuperacao** | Incluir na pagina `/guias/renda-extra/sucesso` e no e-mail transacional do Resend um aviso claro sobre a cota de downloads e um link direto para `/perfil` ou recuperacao por token convidado, reduzindo tickets de suporte por limite de tentativas. | `src/app/guias/renda-extra/sucesso/page.tsx`, `src/app/api/guides/download/[assetId]/route.ts` |
| **P2** | **Conteudo & Audio Interativo** | Quando os 5 idiomas restantes forem liberados para venda, replicar o modelo de amostra de 5 aulas (`src/content/guias/`) com widgets de pronuncia YouGlish calibrados pelos slugs ja corrigidos em `src/lib/language-learning.ts`. | `src/lib/language-learning.ts`, `src/app/blog/aprender/[lang]/page.tsx` |

---

### 2.5 IA na Pratica (`/ia`)

Produto educacional recorrente e avulso focado em aplicacao pratica de IA para produtividade e renda, com diagnostico inicial, trilha de aulas, biblioteca de prompts e curadoria de ferramentas.

| Prioridade | Dimensao | Recomendacao Tecnica e de Produto | Arquivos / Rotas Alvo |
|---|---|---|---|
| **P0** | **Banco & Stripe Env (Bloqueador)** | Aplicar `drizzle/0047_ai_learning_product.sql` no Supabase remoto e configurar `AI_ONE_TIME_STRIPE_PRICE_ID` e `AI_SUBSCRIPTION_STRIPE_PRICE_ID` no painel da Vercel (`Production`). Sem esses Price IDs, `/api/payments/create-ai-checkout` retorna `HTTP 503 ai_checkout_not_configured`. | `drizzle/0047_ai_learning_product.sql`, `src/app/api/payments/create-ai-checkout/route.ts`, `src/lib/ai-product-access.ts` |
| **P1** | **Conversao / Ponte Diagnostico -> Checkout** | Conectar o resultado do diagnostico em `/ia/resultado` ao componente `AiOfferCheckout`, destacando dinamicamente qual modulo de `/ia/curso` e qual pacote de `/ia/prompts` resolvem o eixo mais fraco diagnosticado no usuario. | `src/app/ia/resultado/page.tsx`, `src/components/ia/ai-offer-checkout.tsx` |
| **P1** | **Retencao / Gestao de Assinatura** | Adicionar em `/perfil` e no topo de `/ia/curso` um botao "Gerenciar Assinatura" integrado ao **Stripe Customer Portal** (`stripe.billingPortal.sessions.create`), permitindo que assinantes atualizem cartao em caso de `past_due` ou cancelem sem atrito manual. | `src/app/perfil/page.tsx`, `src/app/api/payments/` |
| **P1** | **E-mail Transacional de Boas-Vindas** | Disparar e-mail automatico via Resend no webhook `checkout.session.completed` (`product_type: ai_one_time` ou `ai_subscription`) com link direto para `/ia/curso` e instrucoes de primeiro acesso. | `src/app/api/payments/stripe-webhook/route.ts`, `src/lib/email/` |
| **P2** | **UX & Produto (`/ia/prompts` e `/ia/ferramentas`)** | Adicionar botao "Copiar Prompt com Variaveis Preenchidas" (inputs rapidos de nicho/objetivo antes de copiar) em `/ia/prompts` e persistir progresso de aulas concluidas em `ai_lesson_progress` com barra visual por modulo em `/ia/curso`. | `src/app/ia/prompts/page.tsx`, `src/app/ia/curso/page.tsx` |

---

### 2.6 Quiz de Negocios (`/quiz-negocios` e `/resultado`)

Motor de diagnostico empresarial e triagem de maturidade em 50 perguntas distribuido em 5 eixos (`operacao`, `comercial`, `financeiro`, `digital`, `social`).

| Prioridade | Dimensao | Recomendacao Tecnica e de Produto | Arquivos / Rotas Alvo |
|---|---|---|---|
| **P0** | **Banco de Dados (Bloqueador)** | Aplicar `drizzle/0046_quiz_engine.sql` no Supabase de producao antes do deploy para criar `quiz_leads` e `quiz_sessions` com `ON DELETE CASCADE`. | `drizzle/0046_quiz_engine.sql`, `src/app/api/quiz/submit/route.ts` |
| **P1** | **UX & Taxa de Conclusao (50 Perguntas)** | Persistir as respostas parciais do usuario em `sessionStorage` / `localStorage` a cada pergunta respondida em `/quiz-negocios`, permitindo retomar o diagnostico do ponto exato em caso de fechamento acidental da aba no celular. | `src/app/quiz-negocios/page.tsx` |
| **P1** | **Conversao / Cross-Sell Inteligente em `/resultado`** | Mapear automaticamente o eixo de menor pontuacao em `/resultado` para uma oferta concreta do ecossistema NKL: score baixo em `digital`/`operacao` -> `/ia/oferta`; score baixo em `comercial`/`social` -> `/programas/anuncie` ou guias de comunicacao/idiomas. | `src/app/resultado/page.tsx`, `src/lib/quiz-engine.ts` |
| **P1** | **Entrega de Relatorio por E-mail** | Enviar o resumo executivo dos 5 eixos e o plano de acao gerado em `/resultado` para o e-mail capturado em `quiz_leads` (quando `consentGiven = true`) via Resend, criando canal direto de nutricao B2B. | `src/app/api/quiz/submit/route.ts`, `src/lib/email/` |
| **P2** | **Visualizacao & Exportacao PDF** | Renderizar grafico radar SVG leve (zero dependencia pesada) dos 5 eixos em `/resultado` e permitir download do diagnostico em PDF timbrado NKL. | `src/app/resultado/page.tsx` |

---

### 2.7 Inventario Publicitario & Mural (`/programas/anuncie`, `/mural-de-parceiros`, `/admin`)

Sistema self-service de venda de 10 slots publicitarios por assinatura mensal Stripe com moderacao editorial obrigatoria e reserva atomica de slots.

| Prioridade | Dimensao | Recomendacao Tecnica e de Produto | Arquivos / Rotas Alvo |
|---|---|---|---|
| **P0** | **Verificacao de Fluxo em Producao** | Validar apos deploy que `/admin` exibe a fila de moderacao exclusivamente para administradores autenticados (`isAdminUser`), que `/mural-de-parceiros` lista apenas campanhas `active` com criativo aprovado e que o lock `pg_advisory_xact_lock` opera sem erro no pooler do Supabase. | `src/app/admin/page.tsx`, `src/app/mural-de-parceiros/page.tsx`, `src/lib/ad-inventory.ts` |
| **P1** | **Operacao & SLA de Moderacao (Notificacoes)** | Disparar e-mail via Resend para `MATERIAL_ADMIN_EMAIL` sempre que um anunciante enviar ou substituir um criativo (`pending_review`), e enviar e-mail automatico ao anunciante quando o admin aprovar (`active`) ou rejeitar (`rejected`, incluindo `rejectionReason`). | `src/app/api/ads/submit-material/route.ts`, `src/app/actions/admin-ads.ts` |
| **P1** | **Conversao & Prova Social** | Exibir nos slots livres (entre os 10 disponiveis) em `/mural-de-parceiros` e nos banners de `/programas` um card placeholder discreto "Slot #X Disponivel — Anuncie sua marca aqui a partir de R$ 19,90/mes" apontando para `/programas/anuncie`. | `src/app/mural-de-parceiros/page.tsx`, `src/components/ads/` |
| **P2** | **Metricas para o Anunciante (Retencao de Assinatura)** | Contabilizar impressoes agregadas e cliques de saida (`rel="sponsored nofollow"`) por `campaignId` para exibir ao anunciante, aumentando a percepcao de ROI e reduzindo churn mensal da assinatura do slot. | `src/lib/ad-inventory.ts`, `src/app/mural-de-parceiros/page.tsx` |

---

### 2.8 Frentes Futuras (`docs/engenharia-no-cotidiano/`, `tools/nkl-video-factory.ts`)

Ativos estrategicos ja modelados no repositorio para expansao de topo de funil (geracao automatizada de video curto/longo) e nova vertical editorial/educacional.

| Prioridade | Dimensao | Recomendacao Tecnica e de Produto | Arquivos / Rotas Alvo |
|---|---|---|---|
| **P1** | **Governanca da Video Factory (`tools/nkl-video-factory.ts`)** | Manter `nkl-video-factory` estritamente como pipeline CLI local (`workspace/video-factory/runs/` ignorado no Git) com gate humano triplo (`content`, `clip`, `metadata`) e `--dry-run` obrigatorio ate que o adaptador oficial da YouTube Data API v3 seja autenticado com conta Google isolada de producao. | `tools/nkl-video-factory.ts`, `docs/setup.md` |
| **P2** | **Nova Vertical: Engenharia no Cotidiano** | Estruturar a vertical planejada em `docs/engenharia-no-cotidiano/` (prompts e roteiros de serie ja documentados) como area `coming-soon` ou ativa no registro central `src/lib/portal-areas.ts` (seguindo `docs/portal-area-registry.md`), conectando os episodios produzidos pela `nkl-video-factory` a artigos interativos e calculadoras praticas no portal. | `docs/engenharia-no-cotidiano/`, `src/lib/portal-areas.ts`, `docs/portal-area-registry.md` |
| **P2** | **Automacao Editorial Assistida por 9router** | Utilizar o worker local `portal-nkl-deepseek` (`ask_nkl_worker` / `delegate_to_deepseek`) para gerar rascunhos de manifests JSON da `nkl-video-factory` a partir dos guias e artigos de `/fisica-do-som` e `docs/engenharia-no-cotidiano/`, mantendo revisao humana final. | `tools/deepseek-mcp.ts`, `tools/nkl-video-factory.example.json` |

---

## 3. Melhorias Transversais (Seguranca, Performance/CWV, Observabilidade, LGPD, Higiene & Segundo Cerebro)

### 3.1 Seguranca de Banco de Dados, Segredos e Superficie de Ataque

1. **Correcao Imediata dos 2 Alertas do Supabase Security Advisor (P0):**
   - **Alerta 1 (`rls_auto_enable` exposta via RPC):** A funcao `public.rls_auto_enable()` possui `SECURITY DEFINER` e atualmente pode ser invocada via Data API por `anon` e `authenticated`. Executar no SQL Editor do Supabase:
     ```sql
     REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
     ```
   - **Alerta 2 (Auth Leaked Password Protection desativado):** No painel do Supabase (`Authentication > Attack Protection` ou `Auth > Security`), habilitar **Leaked Password Protection** (integracao HaveIBeenPwned) para impedir cadastro de senhas vazadas.
2. **Rotacao e Remocao de Credencial Exposta em Script Local (P0):**
   - O arquivo local nao rastreado `equipe_nkl.py` na raiz do workspace contem uma chave `sk-proj-...` hardcoded na linha 7. Embora **nunca tenha sido commitado no Git**, essa chave deve ser **revogada/rotacionada imediatamente** no painel da OpenAI e o arquivo `equipe_nkl.py` deve ser removido ou refatorado para ler `os.environ["OPENAI_API_KEY"]`.
3. **Saneamento de Variaveis de Ambiente (Vercel & `.env.local`) (P1):**
   - **Na Vercel (`portal-nkl`):** Remover variaveis legadas de gateways descontinuados (`HOTMART_*` e `MERCADOPAGO_*`) para reduzir superficie de exposicao; a Stripe e a unica autoridade de pagamento do sistema.
   - **No `.env.local`:** Limpar chaves duplicadas (ex.: `STRIPE_WEBHOOK_SECRET` declarado duas vezes) mantendo apenas uma definicao canonica por variavel conforme `.env.example`.

### 3.2 Performance e Core Web Vitals (CWV)

1. **Separacao Clara entre Rotas Dinamicas e Estaticas/ISR (P1):**
   - Rotas de conteudo editorial e vitrines publicas (`/`, `/musica/naipe_cordas`, `/blog/aprender/*`, `/fisica-do-som`, `/guia-de-cordas`, `/mural-de-parceiros`) devem priorizar renderizacao estatica ou ISR (`revalidate`), evitando chamadas desnecessarias a `cookies()` no nivel superior da pagina que forcam SSR dinamico a cada request.
2. **Otimizacao de Fontes, Imagens e Paralelismo de Dados (P1):**
   - Garantir que todas as imagens de criativos publicitarios enviadas para o bucket `public-assets` e renderizadas em `/mural-de-parceiros` utilizem dimensoes explicitas (`width`/`height` ou `aspect-ratio` fixo) para manter **CLS (Cumulative Layout Shift) = 0.00**.
   - Manter `Promise.all` nas consultas independentes de Server Components (como ja aplicado em `/programas` e `/perfil`) para minimizar TTFB e LCP.

### 3.3 Observabilidade, Healthchecks e Tracing em Producao

1. **Monitoramento Ativo de Drift via `/api/health` e `/api/health/config` (P0):**
   - Estender `/api/health/config` (ou validar no checklist pos-deploy) para reportar presenca booleana (sem expor valores) de `AI_ONE_TIME_STRIPE_PRICE_ID` e `AI_SUBSCRIPTION_STRIPE_PRICE_ID`, permitindo detectar em 1 segundo se o checkout de `/ia` esta pronto em producao.
2. **Instrumentacao de Fluxos Criticos de Receita (P1):**
   - Adicionar logs estruturados JSON com `requestId`, `flow` (`guide_checkout`, `ai_checkout`, `ad_checkout`, `stripe_webhook`, `guide_download`, `quiz_submit`) e `durationMs` nas rotas de API criticas, facilitando auditoria nos logs da Vercel sem jamais registrar CPF, tokens ou payloads brutos de clientes.
   - Configurar alertas de erro 5xx e falhas de entrega no webhook da Stripe (`https://nkloficial.com.br/api/payments/stripe-webhook`) e no painel do Resend (`MATERIAL_ADMIN_EMAIL`).

### 3.4 Conformidade LGPD (`src/lib/compliance.ts`)

1. **Cobertura Integral Verificada (P0):**
   - `src/lib/compliance.ts` foi atualizado para exportar (`exportUserData`) e anonimizar/excluir (`deleteUserAccount`) registros de todas as tabelas com dados pessoais: `user_profiles`, `guide_purchases`, `guide_download_events`, `saved_partner_programs`, `ad_campaigns`, `quiz_leads`, `quiz_sessions`, `ai_access_grants`, `ai_onboarding_responses` e `ai_lesson_progress`.
   - As migracoes `0046_quiz_engine.sql` e `0047_ai_learning_product.sql` incluem `ON DELETE CASCADE` nas chaves estrangeiras para `user_profiles(id)` e tabelas-pai, garantindo integridade referencial em solicitacoes de exclusao de conta.
2. **Invariante de Protecao de CPF (P0):**
   - `GUEST_CHECKOUT_ENCRYPTION_KEY` jamais deve ser alterada ou removida na Vercel sem rotina de recriptografia, pois protege os CPFs (`encrypted_cpf`) necessarios para validar e estampar marca d'agua nos downloads de guias adquiridos sem login.

### 3.5 Higiene de Repositorio, Drizzle Journal e Segundo Cerebro (`.ai-memory/`)

1. **Sincronizacao do Drizzle `_journal.json` (P1):**
   - Atualmente `drizzle/meta/_journal.json` registra entradas apenas ate `0011_add_performance_indexes`, enquanto o diretorio `drizzle/` possui migracoes numeradas sequencialmente ate `0047_ai_learning_product.sql`. Antes de utilizar comandos automaticos do `drizzle-kit migrate` em pipelines futuros, alinhar `drizzle/meta/_journal.json` ou manter a politica canonica documentada de aplicacao SQL controlada e auditada por arquivo.
2. **Limpeza de Diretorios Vazios e Artefatos Legados Localmente (P1):**
   - Remover diretorios vazios residuais de gateways antigos dentro de `src/app/api/payments/` (ex.: `create-checkout/`, `create-preference/`, `hotmart-webhook/`, `mercadopago-webhook/`, `verify-payment/` — que nao contem arquivos e sao vestigios pre-Stripe).
   - Arquivar ou mover para fora do repositorio a pasta local `AntigoNKL/` e arquivos de rascunho na raiz (`*.mp4`, `*.zip`, `*.diff`, `nul`, `equipe_nkl.py`), que ja estao devidamente bloqueados no `.gitignore` e `.vercelignore`, mantendo o workspace enxuto.
3. **Disciplina Jidoka do Segundo Cerebro (`.ai-memory/`) (P0 Continuo):**
   - Toda entrega futura deve iniciar pela consulta ao grafo (`node .agents/skills/ai-memory-graph/scripts/memory-graph.mjs query "<termos>"`) e encerrar atualizando `.ai-memory/activeContext.md` (<80 linhas), `.ai-memory/progress.md`, `.ai-memory/decisionsLog.md` e reconstruindo o indice (`node .agents/skills/ai-memory-graph/scripts/memory-graph.mjs build`) no mesmo commit atomico.

---

## 4. Checklist Seguro e Ordenado ate o Deploy em Producao

> **REGRA DE OURO:** Execute as fases abaixo estritamente na ordem **A -> B -> C -> D**. Nao avance para a proxima fase se qualquer verificacao da fase anterior falhar. Nunca imprima valores de `.env.local` no terminal.

---

### Fase A — Pre-Flight Local, Seguranca de Segredos e Validacao Final em `master`

1. **Rotacionar a chave exposta no script local nao rastreado:**
   - Acessar o dashboard da OpenAI, revogar a chave contida em `equipe_nkl.py` e remover o arquivo local ou substituir por leitura de variavel de ambiente.
2. **Conferir limpeza da arvore Git e ausencia total de segredos ou PDFs pagos rastreados:**
   ```powershell
   git status --short
   git log -5 --oneline
   git ls-files public/guias/
   ```
   - **Resultado esperado:** `git ls-files public/guias/` deve listar **apenas** `public/guias/guia-renda-extra-nkl.pdf` (nenhum dos 18 arquivos pagos de idiomas pode estar em `public/guias/`).
3. **Executar a bateria completa de verificacao local:**
   ```powershell
   npm run verify
   npx vitest run
   npm run test:deepseek-mcp
   node .agents/skills/ai-memory-graph/scripts/memory-graph.mjs build
   ```
   - **Resultado esperado:** Exit code `0` em todos os comandos (lint sem warnings, typecheck limpo, build Next.js 16 concluido, 199 testes unitarios e 48 testes MCP verdes).

---

### Fase B — Banco de Dados (Supabase `vgogceknmqdqzzpztkrr`) e Storage Privado

1. **Inspecionar o estado atual das tabelas no Supabase remoto (somente leitura) antes de aplicar:**
   No SQL Editor do projeto Supabase `NKL` (`vgogceknmqdqzzpztkrr`), confirmar quais tabelas das migracoes pendentes ainda nao existem:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
     AND table_name IN (
       'saved_partner_programs',
       'quiz_leads',
       'quiz_sessions',
       'ai_access_grants',
       'ai_onboarding_responses',
       'ai_lesson_progress'
     );
   ```
2. **Aplicar as 3 migracoes pendentes de schema na ordem exata (transacional e idempotente):**
   - **Passo B2.1:** Aplicar `drizzle/0041_saved_partner_programs.sql` (cria `saved_partner_programs`, indices e politicas RLS).
   - **Passo B2.2:** Aplicar `drizzle/0046_quiz_engine.sql` (cria `quiz_leads` e `quiz_sessions` com `ON DELETE CASCADE` e RLS).
   - **Passo B2.3:** Aplicar `drizzle/0047_ai_learning_product.sql` (cria `ai_access_grants`, `ai_onboarding_responses` e `ai_lesson_progress` com `ON DELETE CASCADE` e RLS).
   - **Passo B2.4 (Verificacao de Dados de Catalogo e Oferta de Ingles):** Confirmar se os dados de `drizzle/0044_new_income_programs.sql` e a oferta `guia-ingles-dinheiro` de `drizzle/0045_english_ebook_guide_offer.sql` ja constam em `partner_programs`, `guide_offers` e `guide_assets` (nota: no historico do Supabase a migracao remota `0045` foi nomeada `0045_restore_prolific`; portanto, verificar com `SELECT slug FROM guide_offers WHERE slug = 'guia-ingles-dinheiro';` e, se ausente, aplicar `drizzle/0045_english_ebook_guide_offer.sql` e `drizzle/0044_new_income_programs.sql`).
3. **Corrigir os 2 Alertas do Supabase Security Advisor:**
   - No SQL Editor do Supabase:
     ```sql
     REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
     ```
   - No Dashboard do Supabase (`Authentication > Attack Protection`): ativar **Leaked Password Protection**.
4. **Enviar o PDF pago de Ingles para o bucket privado `guide-assets-private`:**
   - Garantir que `private-assets/guias/ingles-para-ganhar-dinheiro.pdf` esta presente localmente e executar:
     ```powershell
     npm run guides:upload
     ```
   - Confirmar no Supabase Dashboard (`Storage > guide-assets-private`) que o objeto `ingles-para-ganhar-dinheiro.pdf` (junto aos 5 ativos de novembro) consta no bucket privado.

---

### Fase C — Configuracao de Variaveis na Vercel (`portal-nkl`) e Stripe

1. **No Dashboard da Stripe (modo Live/Production):**
   - Criar (ou localizar) o produto **IA na Pratica — Acesso Completo** com dois precos:
     - Compra unica (`one_time`) -> copiar o `price_...` para `AI_ONE_TIME_STRIPE_PRICE_ID`.
     - Assinatura recorrente (`recurring`) -> copiar o `price_...` para `AI_SUBSCRIPTION_STRIPE_PRICE_ID`.
   - Confirmar que o endpoint de webhook `https://nkloficial.com.br/api/payments/stripe-webhook` esta ativo e escutando os eventos:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `charge.refunded`
     - `charge.dispute.created`
2. **No Dashboard da Vercel (`portal-nkl > Settings > Environment Variables`):**
   - Adicionar para o ambiente `Production` (e `Preview` se aplicavel):
     - `AI_ONE_TIME_STRIPE_PRICE_ID`
     - `AI_SUBSCRIPTION_STRIPE_PRICE_ID`
   - Confirmar que as variaveis criticas permanecem intactas em `Production`:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `DATABASE_URL`
     - `GUEST_CHECKOUT_ENCRYPTION_KEY` (NUNCA alterar)
     - `STRIPE_SECRET_KEY` (ou `STRIPE_API_KEY`)
     - `STRIPE_WEBHOOK_SECRET`
     - `RESEND_API_KEY`
     - `EMAIL_DELIVERY_MODE` (`resend`)
     - `EMAIL_FROM`
     - `MATERIAL_ADMIN_EMAIL`
     - `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`
   - Remover variaveis legadas nao utilizadas: `HOTMART_*` e `MERCADOPAGO_*`.

---

### Fase D — Push, Deploy na Vercel, Smoke Test Pos-Deploy e Plano de Rollback

1. **Publicar a branch `master` (somente apos aprovacao explicita de NKL_OFICIAL):**
   ```powershell
   git push origin master
   ```
2. **Verificacao Imediata de Saude Pos-Deploy (Smoke Test Automatizado e Manual):**
   Assim que o deploy da Vercel atingir estado `Ready` em `https://nkloficial.com.br`:
   ```powershell
   curl.exe -s https://nkloficial.com.br/api/health
   curl.exe -s https://nkloficial.com.br/api/health/config
   curl.exe -I https://nkloficial.com.br/guias/ingles-para-ganhar-dinheiro.pdf
   ```
   - **Criterios de aprovacao obrigatorios:**
     1. `/api/health` retorna `HTTP 200` com `status: "ok"` e banco conectado.
     2. `/api/health/config` retorna `HTTP 200` sem variaveis criticas faltando.
     3. `/guias/ingles-para-ganhar-dinheiro.pdf` retorna `HTTP 404` (confirmando que o PDF pago nao esta exposto estaticamente).
     4. `/` renderiza a nova Portal Base Home com os cards das verticais.
     5. `/musica/naipe_cordas` renderiza a home musical completa e `/musica` redireciona corretamente.
     6. `/guias/ingles/ebook` exibe as 5 aulas gratuitas e o bloqueio de conversao para as aulas 6–100.
     7. `/guias/espanhol` (e demais 4 idiomas) exibe selo "Em breve" sem botao de compra ativo, e `POST /api/payments/create-guide-checkout` para `guia-espanhol-possibilidades` retorna `HTTP 409 coming_soon`.
     8. `/ia` e `/ia/oferta` abrem sessao do Stripe Checkout ao clicar nos botoes de compra unica ou assinatura.
     9. `/quiz-negocios` exige checkbox LGPD, processa as 50 perguntas e renderiza `/resultado` com os 5 eixos (`operacao`, `comercial`, `financeiro`, `digital`, `social`).
     10. `/mural-de-parceiros` carrega sem erro e `/admin` nao vaza dados de clientes para visitantes anonimos.
3. **Plano de Rollback (Contingencia em Caso de Incidente Critico):**
   - **Camada de Aplicacao (Vercel — Tempo de recuperacao < 60 segundos):**
     - No painel da Vercel (`Deployments`), selecionar o deployment anterior estavel e acionar **Instant Rollback**, ou executar via CLI:
       ```powershell
       npx vercel rollback
       ```
   - **Camada de Banco de Dados (Supabase):**
     - As migracoes `0041_saved_partner_programs.sql`, `0046_quiz_engine.sql` e `0047_ai_learning_product.sql` sao **100% aditivas** (criam novas tabelas independentes e nao alteram nem removem colunas existentes). Um rollback de codigo na Vercel nao exige `DROP TABLE` imediato no banco e nao interrompe o funcionamento da versao anterior.
   - **Camada de Pagamentos (Stripe):**
     - Caso o checkout de `/ia` precise ser pausado emergencialmente sem rollback completo do portal, basta remover temporariamente `AI_ONE_TIME_STRIPE_PRICE_ID` e `AI_SUBSCRIPTION_STRIPE_PRICE_ID` na Vercel e redeployar: a vertical `/ia` retorna automaticamente ao modo informativo seguro (`HTTP 503 ai_checkout_not_configured`) sem afetar vendas de Guias ou Anuncios.
