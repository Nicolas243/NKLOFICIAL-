# Arquitetura

## Runtime

- Next.js 16.3.1 com App Router e Turbopack.
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

## Regras de integração

- Webhooks devem validar assinatura antes de alterar dados.
- Cron deve validar `CRON_SECRET`.
- Links de afiliados devem preservar a URL cadastrada e ser tratados como conteúdo editorial sujeito a mudança.
- Migrações devem ser aditivas, revisáveis e testadas localmente; não aplicar automaticamente em produção.
