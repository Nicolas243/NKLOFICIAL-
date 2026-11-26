# Contexto Ativo (Portal NKL)

## Foco Atual

- **Polimento `/programas`, Hub `/idiomas`, Stripe `/anuncie`, Fluido/Bússola, CTAs Adaptativos & Atlas Admin (2026-11-26):**
  - **Cabeçalho & `/programas`:** logo `44x44` visível (`shrink-0`), links sem aperto (`Início`, `Renda Extra`, `IA`, `Idiomas` -> `/idiomas`, `Bússola`, `Cordas`, `Sugerir`); grade de `/programas` com `PROGRAMS_PER_PAGE = 12` e banner `Anuncie aqui` no índice `6` (múltiplo de 2 e 3, zero linha órfã), cards NKL padronizados ao esqueleto da plataforma, `<SaveProgramButton />` abaixo da nota e `"Acessar plataforma"` completo.
  - **`/programas/anuncie` & Testes Stripe:** URLs sem esquema e `@arroba` normalizados, `assetAltText` opcional, termos aceitos no submit com erro visível e reconciliação imediata em `/anuncie/sucesso`; suíte `scripts/test-all-payments-stripe.mjs` validou `pm_card_visa` (`pi_3UfvmZItNBn1daZu1MTHxZaL` `succeeded`) + 13 fluxos/entregáveis na conta NKL Sandbox (`acct_1UbswFItNBn1daZu`).
  - **Fluido no ecossistema, Bússola dos Sonhos, `/idiomas` & Tradução Semântica:** `PortalHomeParallax variant="ecosystem"` no `ParallaxBackground` (música preserva parallax musical), cópia e cards translúcidos na Bússola (`negócio dos sonhos`), página `/idiomas` com os 6 idiomas e cores cor-a-cor alinhadas semanticamente em `/blog/aprender/ingles` + `language-ebook-preview.tsx`.
  - **CTAs Adaptativos A/B, Atlas Admin & Checklist Mestre:** `AdaptiveCtaLink` (`bussola-cta`, `languages-hub-cta`, `ia-offer-cta`) medido em `/admin`, onde também estão o **Atlas Visual das Áreas**, **Diretório Completo de Entregáveis** e a referência a `docs/CHECKLIST-MESTRE-NKL.md`.

## Pendencias Somente Manuais do Usuario (Contas Externas)

1. **Troca definitiva Stripe NKL -> Produção:** quando ativar a conta Live `nkloficial` e tiver `pk_live_...` + `sk_live_...` em `.env.local`, rodar `npm run stripe:provision -- --sync-vercel-prod` e depois `vercel deploy --prod --yes`.
2. **Ações consolidadas:** seguir `docs/CHECKLIST-MESTRE-NKL.md` (Cloudflare Email Routing, plugins Stripe/Cloudflare/Vercel, Google Search Console, afiliados, Amazon KDP, NotebookLM e VAPID opcional).
