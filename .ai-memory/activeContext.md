# Contexto Ativo (Portal NKL)

## Foco Atual

- **Auditoria Completa de Todos os Gateways Stripe + Paridade DB `0051` (2026-11-26):**
  - **Descoberta e correção crítica no banco remoto:** aplicada migração aditiva `drizzle/0051_missing_webhook_and_booking_tables.sql` restaurando `stripe_webhook_events` (`0035`), `teacher_availability`, `student_plan_enrollments`, `class_bookings`, `teacher_reviews`, `entity_reports` (`0011`–`0016`) e colunas de moderação de `business_directory` + índices/RLS `(SELECT auth.uid())` + política `deny_direct_client_access`.
  - **Correções em helpers e checkout:** `resolveGuideProductSlug` agora normaliza sufixos `:essential`/`:vip` e mapeia os 5 idiomas adicionais para `'pacote-idiomas-ia'`; `getStripeReference` aceita `plan === 'vip'` no fallback de IA; `PremiumCheckoutButton` redireciona via `window.location.assign`.
  - **Bateria E2E real (`scripts/test-all-payments-stripe.mjs`):** validou cartões oficiais Stripe (`pm_card_visa`, `pm_card_mastercard` + 4 códigos de recusa) e todos os 7 gateways (webhooks HMAC/Stripe, guias + downloads PDF/XLSX com marca d'água + 30%/50% idiomas, assinatura de guias, IA 3 planos, anúncios 2 cotas, luthier premium e aulas + Daily.co) em Sandbox `acct_1UbswFItNBn1daZu`.

## Pendencias Somente Manuais do Usuario (Contas Externas)

1. **Troca definitiva Stripe NKL -> Produção:** quando ativar a conta Live `nkloficial` e tiver `pk_live_...` + `sk_live_...` em `.env.local`, rodar `npm run stripe:provision -- --sync-vercel-prod` e depois `vercel deploy --prod --yes`.
2. **Ações consolidadas:** seguir `docs/CHECKLIST-MESTRE-NKL.md` (Cloudflare Email Routing, plugins Stripe/Cloudflare/Vercel, Google Search Console, afiliados, Amazon KDP, NotebookLM e VAPID opcional).
