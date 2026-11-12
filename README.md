# Portal NKL

O Portal NKL é um portal brasileiro com duas frentes: ferramentas e conteúdo para músicos,
luthiers, professores e lojas; e um catálogo editorial de oportunidades digitais e renda extra.
Alguns links de oportunidades são afiliados e podem gerar comissão sem custo adicional para o
visitante. A remuneração, aprovação e disponibilidade são sempre definidas pela plataforma externa.

## Documentação rápida

- [Contexto para agentes de IA](./AI-CONTEXT.md)
- [Catálogo de oportunidades para PDF](./OPORTUNIDADES-RENDA-EXTRA.md)
- [Visão do produto](./PRODUCT.md)
- [Arquitetura](./docs/architecture.md)
- [Onboarding](./docs/onboarding.md)
- [Setup e recuperação](./docs/setup.md)
- [Qualidade](./docs/quality.md)
- [Changelog](./CHANGELOG.md)

## Stack atual

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16.4.5 (App Router, Server Actions) |
| UI | React 19.2.8, TypeScript strict, Tailwind CSS v4 |
| Dados | Drizzle ORM + PostgreSQL/Supabase |
| Auth e Storage | Supabase |
| Integrações | Stripe, Upstash Redis, Daily |
| Deploy | Vercel |

## Áreas principais

- `/` — home musical com menu radial;
- `/catalogo`, `/luthiers`, `/professores` e `/lojas` — catálogo e diretórios;
- `/programas` e `/blog/renda-extra` — oportunidades e conteúdo de renda extra;
- `/programas/[slug]`, `/programas/iniciantes` e `/programas/dolar` — páginas SEO e hubs de triagem;
- `/login`, `/dashboard`, `/admin` — conta, operações e moderação;
- `/termos`, `/privacidade` e `/reembolso` — documentos legais públicos.

## Desenvolvimento local

```bash
npm install
# copie .env.example para .env.local e preencha os valores locais
npm run dev
```

Nunca coloque valores de segredo no código, no README ou em commits. Variáveis são validadas em
`src/env.ts`; consulte `.env.example` para os nomes exigidos.

O formulário de captura de renda extra usa o endpoint Formspree já configurado e entrega
`public/guias/guia-renda-extra-nkl.pdf` após o envio confirmado. A meta opcional de verificação do
Google Ads usa `NEXT_PUBLIC_GOOGLE_ADS_VERIFICATION`.

## Validação

```bash
npm run lint
npm run typecheck
npm run build
npm run verify
npm run test:e2e
```

`npm run lint` pode reportar warnings legados dentro de `AntigoNKL`; eles não devem ser
confundidos com erros novos na aplicação atual. Mudanças de banco devem usar migração versionada
em `drizzle/` e ser verificadas localmente antes de qualquer sincronização de produção.

## Privacidade e segurança

Scripts de Google Analytics e AdSense só são carregados depois do consentimento para recursos não
essenciais. Sessão, segurança, PWA e prevenção de abuso continuam funcionando como recursos
necessários. Webhooks validam assinatura, cron valida `CRON_SECRET` e ações server-side validam
entrada e autorização.
