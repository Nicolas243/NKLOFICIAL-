# Arquitetura

## Runtime

- Next.js 16.4.5 com App Router e Turbopack.
- React 19.2.8 e TypeScript strict.
- Tailwind CSS v4 e `lucide-react`.
- Server Actions para operações de domínio e Route Handlers para integrações HTTP.

## Dados e autenticação

- Supabase fornece Auth, Storage e PostgreSQL.
- Drizzle ORM acessa o PostgreSQL por `DATABASE_URL`.
- Clientes Supabase browser/server/proxy ficam em `src/lib/supabase/`.
- Autorização é aplicada nas actions; não há migração de RLS documentada como padrão atual.

## Fronteiras

- `src/app/`: rotas, páginas e handlers.
- `src/components/`: UI reutilizável e componentes client.
- `src/actions/`: operações server-side e validações de domínio.
- `src/db/`: schema e conexão Drizzle.
- `drizzle/`: migrações SQL versionadas.
- `src/scripts/`: seeds e manutenção.
- `public/`: assets públicos, incluindo logos de parceiros.
- `public/guias/`: materiais editoriais entregues após a captura de lead.

## Produtos e rotas públicas

- **NKL Música**: home, catálogo de cordas, diretórios, aulas, notícias e recursos para músicos.
- **Renda Extra — catálogo canônico**: `/programas`, incluindo `/programas/[slug]`, `/programas/iniciantes` e `/programas/dolar`.
- **Renda Extra — compatibilidade histórica**: `/blog/renda-extra` continua disponível para links antigos, mas aponta semanticamente para `/programas`.
- **Renda Extra — produto digital**: `/guias/renda-extra` é a landing page do Guia Definitivo de Renda Extra e não deve ser confundida com o catálogo.
- **Inventário publicitário em validação**: `/anuncie` é uma prévia estática do
  Mural NKL e de três faixas horizontais. Nesta fase não há cobrança, upload,
  publicação automática, medição de leads ou alteração de banco.

As regras de reconhecimento de contexto ficam centralizadas em `src/lib/income-portal.ts`. Novas telas da área de Renda Extra devem reutilizar essa fonte em vez de repetir comparações de pathname.

Música e Renda Extra usam uma conta única. O parâmetro `area=music|income` no
login apenas fornece contexto temporário para a entrada: Música mantém o
onboarding musical existente, enquanto Renda Extra não exige instrumento ou
experiência musical. Essa escolha não cria um perfil separado nem altera
autorização.

## Regras de integração

- O Stripe é o gateway ativo para compras únicas, assinaturas e reservas. O
  endpoint `/api/payments/stripe-webhook` valida `stripe-signature` antes de
  alterar dados e registra IDs de evento em `stripe_webhook_events` para
  idempotência. Dados e colunas históricas do Mercado Pago são preservados,
  mas não são usados para novos pagamentos.
- Pagamentos do guia usam `guide_purchase:<uuid>` no webhook principal; assinaturas usam `guide_subscription:<uuid>` e o handler dedicado `/api/payments/subscription-webhook`.
- Cron deve validar `CRON_SECRET`.
- Links de afiliados devem preservar a URL cadastrada e ser tratados como conteúdo editorial sujeito a mudança.
- Google Analytics, Microsoft Clarity, PostHog e AdSense são recursos não essenciais e só são carregados após consentimento explícito; GA4 e PostHog registram pageviews explicitamente em cada mudança de rota do App Router.
- Migrações devem ser aditivas, revisáveis e testadas localmente; não aplicar automaticamente em produção.
- Os materiais pagos ficam no bucket privado `guide-assets-private`; o endpoint `/api/downloads/guide` libera URLs assinadas por 60 segundos e aplica cota atômica de oito tentativas.
- Compras convidadas usam token opaco com hash e expiração, CPF criptografado por
  `GUEST_CHECKOUT_ENCRYPTION_KEY` e a mesma personalização do fluxo autenticado.
  A tabela `guide_download_attempts` limita cada material a duas tentativas independentes;
  o webhook Stripe continua sendo a autoridade para `approved` e `active`.
- A recuperação convidada em `/api/payments/guide-access/recover` responde de forma genérica
  para não enumerar pedidos. Em local usa modo `preview`; produção exige Resend configurado.
- Antes de aplicar `drizzle/0032_guide_sales_offers.sql` e `drizzle/0033_guide_download_quota.sql` em produção, confirme no Supabase as tabelas `guide_purchases`, `guide_subscriptions` e `guide_offer_events`, além do histórico real de migrações. O arquivo `drizzle/meta/_journal.json` não deve ser tratado como prova suficiente do estado remoto.
- `drizzle/0034_partner_affiliate_links.sql` é uma migração de dados versionada: antes de executá-la em um ambiente remoto, confirme no Supabase o histórico aplicado e os seis slugs-alvo em `partner_programs`; aplique o SQL revisado uma única vez pelo fluxo aprovado de migrações (sem `push` cego) e verifique depois os seis `affiliate_url` e `updated_at`. Em ambiente local, use um banco descartável ou autorizado e registre a consulta de verificação; não aplicar em produção sem aprovação.
- O catálogo público usa páginas individuais em `/programas/[slug]`, hubs em `/programas/iniciantes`
  e `/programas/dolar`, JSON-LD de página/lista e links de afiliado com `rel="sponsored"`.
- URLs públicas de SEO são centralizadas em `src/lib/site.ts`: `SITE_URL` usa
  `NEXT_PUBLIC_SITE_URL` sem barras finais e cai para `https://nkloficial.com.br`;
  `absoluteSiteUrl()` é usado em canonical, Open Graph, JSON-LD, sitemap e robots.
- `/programas` é o catálogo canônico. `/blog/renda-extra` continua acessível como alias,
  mas aponta canonical para `/programas` e não é duplicado no sitemap.
- Os hubs editoriais públicos `/programas/celular`, `/programas/sem-investimento`,
  `/programas/trabalho-remoto` e `/programas/pesquisas-remuneradas` filtram somente
  oportunidades existentes no catálogo e exibem estado vazio explícito quando necessário.
- A migração `0027_partner_editorial_fields.sql` adiciona campos estruturados e data de verificação;
  o painel administrativo pode marcar uma oportunidade como verificada sem alterar o conteúdo público.
- A página inicial do catálogo mantém cards focados em descoberta. O roteiro de primeiro saque
  (`src/components/income/program-first-withdrawal.tsx`) e as estratégias de múltiplos caminhos
  (`src/components/income/program-strategies.tsx`) aparecem somente nas visualizações secundárias;
  estratégias só existem para slugs com modelos editoriais realmente distintos.
- As ações de compartilhar, lembrar e instalar o app ficam disponíveis na página individual em
  `src/components/income/program-actions.tsx`; lembretes usam Google Calendar ou `.ics` sem persistir
  dados no Portal NKL. Modais de oportunidade preservam o scroll anterior, fecham com `Escape` e
  permitem fechar pelo backdrop.
- O experimento `program-secondary-cta` existe somente nas visualizações secundárias do catálogo.
  A variante validada por `cta_variant=0|1|2` é persistida no navegador, acompanha os dois caminhos
  de checkout e registra `impression`, `click` e `checkout`; `conversion` é reservado para pagamentos
  confirmados pelos webhooks. Google Analytics e PostHog recebem os eventos somente após consentimento,
  sem e-mail, URL de afiliado ou dados livres; o mínimo de 40 impressões por variante é uma limitação
  operacional, não uma conclusão estatística.
- O experimento separado `guide-page-cta` existe somente em `/guias/renda-extra` e usa as variantes
  `0..4` (pacote de novembro, diagnóstico rápido, ação imediata, oportunidades e proteção/Black Friday).
  A variante válida acompanha os caminhos de compra avulsa e assinatura, sem alterar os preços
  `R$ 39,00` e `R$ 19/mês`. O pacote avulso entrega os cinco materiais de novembro uma vez; a
  assinatura mantém o pacote atual e inclui novos PDFs/guias a partir de 15 de dezembro.
  A comparação registra impressão, clique, checkout e conversão depois de cada variante alcançar
  pelo menos 40 impressões; esse mínimo é uma regra de exposição, não uma conclusão estatística.
- A oferta secundária é uma superfície compacta e retangular exibida somente no modal e na página
  individual da oportunidade; os cards iniciais de `/programas` não a renderizam.
- O disclosure de parceria é um `<details>` fechado por padrão, com o resumo “Sobre links de parceria”,
  e mantém o texto legal acessível quando expandido.
- O convite “Convidar no Buy Me a Coffee” é escopado ao slug da oportunidade correspondente e não é
  renderizado no rodapé nem em oportunidades não relacionadas.
- O compartilhamento global usa `src/lib/share-url.ts` para remover parâmetros de afiliado e
  rastreamento, mantendo somente filtros públicos permitidos; links canônicos externos nunca são
  usados como destino compartilhado. A exceção intencional são os botões de projeto do Alligner,
  que compartilham o URL específico da vaga para preservar a indicação daquele projeto; o botão
  geral do programa continua apontando para `/programas/aligner`.
- As páginas completas e os modais de oportunidades exibem a seção “Como funciona e qual é o
  passo a passo?” com o roteiro de primeiro saque aberto por padrão, além da descrição editorial.
- Os tutoriais são classificados por `src/lib/tutorial-areas.ts`, com sugestões locais e não
  bloqueantes por área. `nkl_tutorial_seen` permanece reservado ao tutorial histórico da home.
- Guias pagos: o checkout exige sessão autenticada, CPF válido e consentimento específico. A compra guarda o vínculo com `user_profiles`, mas o CPF nunca entra em metadados Stripe, URLs, analytics ou logs.
- Entrega personalizada: os originais ficam no bucket privado; o servidor lê o ativo, insere marca visual em todas as páginas/abas e transmite a cópia diretamente. Nenhuma URL assinada ou cópia personalizada é persistida.
