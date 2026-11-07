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
- Cron deve validar `CRON_SECRET`.
- Links de afiliados devem preservar a URL cadastrada e ser tratados como conteúdo editorial sujeito a mudança.
- Google Analytics e AdSense são recursos não essenciais e só são carregados após consentimento explícito.
- Migrações devem ser aditivas, revisáveis e testadas localmente; não aplicar automaticamente em produção.
- O catálogo público usa páginas individuais em `/programas/[slug]`, hubs em `/programas/iniciantes`
  e `/programas/dolar`, JSON-LD de página/lista e links de afiliado com `rel="sponsored"`.
- A migração `0027_partner_editorial_fields.sql` adiciona campos estruturados e data de verificação;
  o painel administrativo pode marcar uma oportunidade como verificada sem alterar o conteúdo público.
