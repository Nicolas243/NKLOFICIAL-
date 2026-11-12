# Contexto rápido para agentes de IA — Portal NKL

## Identidade do produto

O Portal NKL é uma aplicação web brasileira que combina:

1. portal musical para músicos, luthiers, professores e lojas;
2. catálogo editorial de oportunidades de renda extra, trabalho remoto e afiliados.

O foco é celular, acessibilidade, leitura clara e operação segura. O portal não é empregador,
não garante renda e não representa as plataformas externas listadas.

## Rotas e domínios

- `/` — home musical e menu radial;
- `/catalogo` — catálogo técnico de cordas;
- `/luthiers`, `/professores`, `/lojas` — diretórios profissionais;
- `/programas` — catálogo de oportunidades, filtros, avaliações, hubs e links externos;
- `/programas/[slug]` — página indexável de cada oportunidade, com dados editoriais e JSON-LD;
- `/programas/iniciantes` e `/programas/dolar` — hubs temáticos para triagem;
- `/blog/renda-extra` — conteúdo editorial de renda extra;
- `/dashboard` — recursos do usuário autenticado;
- `/admin` — moderação, leads e operações administrativas;
- `/termos`, `/privacidade`, `/reembolso` — documentos legais públicos.

## Regras de negócio importantes

- Links de afiliados podem gerar comissão para o Portal sem custo adicional necessariamente.
- Valores, moedas, idiomas e notas das oportunidades são referências editoriais; nunca prometer
  contratação, aprovação, volume de trabalho ou pagamento.
- Avaliações da comunidade aceitam nota de 0 a 10 e remuneração opcional por hora, dia, semana ou
  trabalho.
- Dados enviados por usuários devem ser validados no servidor e conteúdo abusivo pode ser moderado.
- Serviços de terceiros possuem cadastro, cobrança, privacidade e reembolso próprios.
- O guia de captura fica em `public/guias/guia-renda-extra-nkl.pdf` e o formulário usa o endpoint
  Formspree já existente; o download só aparece depois da confirmação do envio.
- Pagamentos do Portal usam Stripe Checkout; não tratar integração externa como disponível sem
  confirmar as variáveis de ambiente e o fluxo vigente.

## Arquitetura técnica

- Next.js 16.4.5, App Router, React 19.2.8, TypeScript strict e Tailwind CSS v4.
- PostgreSQL/Supabase com Drizzle ORM.
- Auth, Storage e clientes browser/server em `src/lib/supabase/`.
- Páginas e route handlers em `src/app/`; componentes em `src/components/`;
  server actions em `src/actions/`; schema e conexão em `src/db/`; migrações em `drizzle/`.
- O layout global está em `src/app/layout.tsx`.
- O consentimento de Analytics/AdSense está em `src/components/privacy-scripts.tsx`.
- A verificação opcional do Google Ads usa `NEXT_PUBLIC_GOOGLE_ADS_VERIFICATION` no layout.
- O schema `partner_programs` possui campos editoriais estruturados para pros, contras, requisitos,
  métodos de pagamento, remuneração e `last_verified_at`; as migrações `drizzle/0027...sql` e
  `drizzle/0028...sql` ainda precisam ser aplicadas localmente antes de sincronizar dados.

## Integrações e segredos

As variáveis são lidas por `src/env.ts` e devem existir apenas em `.env.local` ou no provedor de
deploy. Nunca imprimir, copiar ou inventar valores. Integrações relevantes incluem Supabase,
PostgreSQL, Stripe, Upstash Redis, Daily, Google Analytics, Google AdSense e Formspree.

## Segurança e privacidade

- Não confiar em validação somente no cliente.
- Webhooks devem validar assinatura antes de alterar dados.
- Endpoints de cron devem validar `CRON_SECRET`.
- Preservar rate limiting, autorização server-side e proteção de segredos.
- Analytics e publicidade não essencial só carregam após consentimento explícito.
- Consultas de titular devem passar pelo canal de contato e confirmar identidade quando necessário.
- Não afirmar conformidade legal plena sem revisão de advogado brasileiro; os documentos públicos são
  uma base operacional transparente e devem acompanhar a implementação real.

## Validação obrigatória

```bash
npm run lint
npm run typecheck
npm run build
npm run verify
npm run test:e2e
```

Antes de mexer em produção, validar localmente, revisar migrações, verificar `.env.local` e obter
aprovação explícita. Não publicar, migrar produção ou alterar infraestrutura como efeito colateral
de uma tarefa local.
