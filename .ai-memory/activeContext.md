# Contexto Ativo (Portal NKL)

## Foco Atual

- **Estratégia 3 Preços Universal + Catálogo Completo 12 Produtos Stripe (2026-11-26):**
  - **3 preços em todas as frentes:** `ProductCheckoutClient` agora oferece 3 opções em IA (`R$ 39/mês`, `R$ 99`*, `R$ 397` Passe Total) e em todos os guias/Bússola/Idiomas (`R$ 19/39/247` ou `R$ 27/47/297`); `/programas/anuncie` ganhou presets (`1` / `3`* / `10` cotas); e `/dashboard/luthier/planos` exibe Gratuito (`R$ 0`), Premium Mensal (`R$ 49,90/mês`*) e Mestre Luthier Anual (`R$ 479/ano`, 20% OFF).
  - **Catálogo Stripe 12 produtos / 33 preços (`scripts/migrate-stripe-account.mjs`):** provisionamento duplo idempotente validado no Sandbox `acct_1UbswFItNBn1daZu` (`12` produtos, `33` preços, cupons `30%`/`50%` e webhook 13 eventos).
  - **Pendência para virar para `nkloficial` Live:** `.env.local` ainda aponta `STRIPE_SECRET_KEY` para `Buymeacoffee` (`acct_1UZsOzQzOKRNmIif`); aguardando NKL_OFICIAL colar `pk_live_` / `sk_live_` da `nkloficial` em `.env.local` para rodar `npm run stripe:provision -- --sync-vercel-prod` e `vercel deploy --prod --yes`.

## Pendencias Somente Manuais do Usuario (Contas Externas)

1. **Troca definitiva Stripe NKL -> Produção:** quando ativar a conta Live `nkloficial` e tiver `pk_live_...` + `sk_live_...` em `.env.local`, rodar `npm run stripe:provision -- --sync-vercel-prod` e depois `vercel deploy --prod --yes`.
2. **Ações consolidadas:** seguir `docs/CHECKLIST-MESTRE-NKL.md` (Cloudflare Email Routing, plugins Stripe/Cloudflare/Vercel, Google Search Console, afiliados, Amazon KDP, NotebookLM e VAPID opcional).
