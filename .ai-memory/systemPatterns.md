---
id: systemPatterns
tags: [arquitetura, seguranca, pagamentos, stripe, webhook, drizzle, lgpd, storage, roteamento]
links: [projectBrief, techContext, decisionsLog]
updated: 2026-11-19
---

# System Patterns - Arquitetura e Invariantes de Seguranca

Invariantes que nenhuma entrega pode violar. Contexto de produto em [[projectBrief]];
stack em [[techContext]]; historico de escolhas em [[decisionsLog]]. Fonte longa:
[architecture.md](../docs/architecture.md) e [design.md](../docs/design.md).

## Registro central da home

- `src/lib/portal-areas.ts` e a unica fonte dos cards da home `/` (campos `id`, `title`,
  `description`, `href`, `category`, `status: active | coming-soon`, `featured`, `label`).
- Nova area, produto, curso, idioma ou parceria: atualizar o registro e
  [portal-area-registry.md](../docs/portal-area-registry.md). Proibido card isolado no componente.

## Roteamento por vertical (shell)

- `src/lib/income-portal.ts` define `INCOME_PORTAL_ROUTES`, `isIncomePortalPath()` e
  `isIncomeCatalogPath()`: decidem qual shell (header/footer/parallax) envolve a rota.
- Musica vive em `/musica/naipe_cordas`; sub-rotas legadas (`/catalogo`, `/luthiers`,
  `/professores`, ...) continuam validas. Mudanca de URL exige redirect e sitemap atualizado.
- `/programas` e o catalogo canonico de renda extra; `/blog/renda-extra` so compatibilidade.

## Pagamentos (Stripe)

- Preco e calculado e validado no servidor (`src/lib/pricing.ts`, `src/lib/ad-inventory.ts`);
  nunca confiar em valores enviados pelo navegador.
- Webhook: corpo bruto, verificacao de assinatura em tempo constante, idempotencia via tabela
  `stripe_webhook_events`, validacao de payload e estados fechados. Status desconhecido = erro.
- Reserva de slots de anuncio: checagem de disponibilidade e insercao na mesma transacao
  (evitar TOCTOU acima de 10 slots); liberacao de slot tratada no webhook.

## Ativos pagos e marca d'agua

- E-books pagos fora de `public/`: fonte em `private-assets/guias/` (gitignored) e
  `src/content/guias/`; distribuicao pelo bucket privado `guide-assets-private`
  (`src/lib/guide-assets.ts`, `src/lib/guide-storage.ts`) com URL assinada de curta duracao.
- Personalizacao server-side de PDF/XLSX/HTML com marca d'agua por comprador
  (`src/lib/guide-personalizer.ts`); CPF armazenado somente como `encryptedCpf`
  (`GUEST_CHECKOUT_ENCRYPTION_KEY`), nunca em claro, log ou URL.
- Download autenticado: dono da compra ou acesso convidado validado; cota de downloads e
  tentativas registradas (`guide_download_attempts`).

## Banco e migracoes

- Drizzle: migracoes SQL aditivas e revisaveis em `drizzle/`; numeracao sem colisao.
- Nunca `drizzle-kit push` cego nem migracao remota sem aprovacao; indicar verificacao remota
  necessaria como pendencia.
- RLS e suspensao de contas existem (migracao 0016); respeitar em novas tabelas.

## Validacao e erros

- Toda entrada externa validada (Zod preferido), autenticada e autorizada no servidor.
- Erro, configuracao ausente ou status desconhecido nunca viram sucesso; logar apenas
  contexto nao sensivel.

## LGPD e privacidade

- Consentimento antes de analytics (Clarity/PostHog); acoes de conformidade em
  `src/actions/compliance.ts` (exportacao/exclusao de dados do titular).
- Minimizar PII; proibido gravar segredos ou PII em `.ai-memory/`, logs, testes ou prompts.

## Memoria de agentes

- `.ai-memory/` e a memoria persistente cross-IDE; consulta por grafo via skill
  `ai-memory-graph` (indice `.ai-memory/graph-index.json`). Protocolo em `AGENTS.md`.
