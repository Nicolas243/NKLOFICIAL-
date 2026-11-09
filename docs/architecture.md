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

As regras de reconhecimento de contexto ficam centralizadas em `src/lib/income-portal.ts`. Novas telas da área de Renda Extra devem reutilizar essa fonte em vez de repetir comparações de pathname.

## Regras de integração

- Webhooks devem validar assinatura antes de alterar dados.
- Pagamentos do guia usam `guide_purchase:<uuid>` no webhook principal; assinaturas usam `guide_subscription:<uuid>` e o handler dedicado `/api/payments/subscription-webhook`.
- Cron deve validar `CRON_SECRET`.
- Links de afiliados devem preservar a URL cadastrada e ser tratados como conteúdo editorial sujeito a mudança.
- Google Analytics e AdSense são recursos não essenciais e só são carregados após consentimento explícito.
- Migrações devem ser aditivas, revisáveis e testadas localmente; não aplicar automaticamente em produção.
- Os materiais pagos ficam no bucket privado `guide-assets-private`; o endpoint `/api/downloads/guide` libera URLs assinadas por 60 segundos e aplica cota atômica de oito tentativas.
- Antes de aplicar `drizzle/0032_guide_sales_offers.sql` e `drizzle/0033_guide_download_quota.sql` em produção, confirme no Supabase as tabelas `guide_purchases`, `guide_subscriptions` e `guide_offer_events`, além do histórico real de migrações. O arquivo `drizzle/meta/_journal.json` não deve ser tratado como prova suficiente do estado remoto.
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
