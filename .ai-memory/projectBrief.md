---
id: projectBrief
tags: [produto, visao, verticais, portal-nkl, rotas]
links: [techContext, systemPatterns, decisionsLog, activeContext, progress]
updated: 2026-11-19
---

# Project Brief - Portal NKL

Portal brasileiro multivertical: comunidade musical (cordas, luthiers, professores)
somada a oportunidades digitais (renda extra, IA aplicada, idiomas e negocios).
Fonte canonica de produto e publico: [PRODUCT.md](../PRODUCT.md). Arquitetura detalhada:
[architecture.md](../docs/architecture.md). Stack em [[techContext]]; invariantes em
[[systemPatterns]].

## Visao

- Uma home base (`/`) que funciona como hub de verticais, alimentada por registro
  central (ver [[systemPatterns]] e [portal-area-registry.md](../docs/portal-area-registry.md)).
- Cada vertical tem shell proprio (header/footer/parallax) sem duplicar dominio.
- Monetizacao: produtos digitais (guias/e-books), assinatura IA, inventario de anuncios,
  links de afiliados e marketplace de professores. Stripe e a autoridade de pagamento.
- Publico: musicos, luthiers, professores, iniciantes em renda extra digital e
  pequenos negocios brasileiros. Conformidade LGPD obrigatoria.

## Verticais e rotas publicas

| Vertical | Rotas principais | Observacoes |
|---|---|---|
| Portal Base Home | `/` | Grid de areas lido de `src/lib/portal-areas.ts` |
| Musica | `/musica/naipe_cordas` (nova home musical), `/catalogo`, `/luthiers`, `/professores`, `/guia-de-cordas`, `/fisica-do-som`, `/comparar`, `/meu-setup`, `/lojas`, `/noticias` | Sub-rotas existentes preservadas (ver [[decisionsLog]]) |
| Renda Extra | `/programas`, `/programas/micro1`, hubs de programas | `/blog/renda-extra` e apenas compatibilidade |
| IA na Pratica | `/ia`, `/ia/oferta`, `/ia/curso`, `/ia/prompts`, `/ia/ferramentas` | Rotas privadas fora do sitemap |
| Quiz de Negocios | `/quiz-negocios`, `/resultado` | Triagem de negocios, motor em `src/lib/quiz-engine.ts` |
| Idiomas | `/blog/aprender/*`, `/guias/*` (ingles, espanhol, italiano, frances, alemao, chines) | Ingles ativo; 5 idiomas `coming-soon` |
| Inventario Publicitario | `/programas/anuncie`, `/anuncie`, `/mural-de-parceiros` | 10 slots, moderacao editorial manual |

## Produtos pagos

- Guias/e-books de idiomas e Guia Renda Extra: checkout Stripe (com ou sem login),
  entrega por URL assinada de bucket privado com marca d'agua personalizada.
- IA na Pratica: compra unica ou assinatura (Price IDs via env, ver [[techContext]]).
- Anuncios: assinatura mensal por slot, preco calculado no servidor.

## Fronteiras de escopo

- Sem deploy, migracao remota ou mudanca de infraestrutura sem aprovacao explicita.
- Estado corrente e frentes em andamento: [[activeContext]]; checklist: [[progress]].
