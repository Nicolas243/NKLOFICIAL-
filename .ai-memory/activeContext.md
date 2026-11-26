# Contexto Ativo (Portal NKL)

## Foco Atual
- **Feedback Chinês Já, Script Seguro Stripe NKL, Funis 3 Opções & Upgrade Analytics (2026-11-26):**
  - **"Sugerir site" contextual (`/sugerir`):** `getSuggestionHref(pathname)` (`src/lib/income-portal.ts`) roteia por área (`idiomas`, `ia`, `renda-extra`, `musica`, `geral`) para `/sugerir` (`src/app/sugerir/page.tsx`) usando `submitPartnerSuggestion` com prefixo `[Área | Origem]`.
  - **Mandarim (`/blog/aprender/chines`):** adicionada ferramenta gratuita em português *Chinês Já — Pinyin com tons e áudio* (`https://www.chinesja.com.br/p/pinyin-com-tons-e-audio-converter.html`) tanto na seção `Pinyin com áudio` quanto como recurso #1.
  - **Stripe NKL seguro (`scripts/migrate-stripe-account.mjs`):** provisionada a conta Sandbox `acct_1UbswFItNBn1daZu` (`Área restrita de nkloficial`) com produto/preços/cupons/webhook; trava `assertLiveProductionSafety` impediu sobrescrever Produção Live (`acct_1UZsOzQzOKRNmIif`) com chaves `sk_test_`.
  - **Funis 3 opções (Decoy Pricing):** Renda Extra (`R$ 19` / `R$ 39*` / `R$ 247` 11 arquivos), 6 Idiomas (`R$ 27` / `R$ 47*` / `R$ 297` Passaporte 6 Idiomas + Renda Extra) e IA na Prática (`R$ 39/mês` / `R$ 99*` / `R$ 397` Passe Total 6 SKUs) com entregáveis reais validados no servidor e webhook.
  - **Analytics & Admin:** `getPortalAnalyticsArea` (8 áreas), UTM super-properties no PostHog/Clarity, `select_pricing_tier`, `begin_checkout`, `purchase` para logados e convidados com valor real (`amountCents / 100`) e KPIs digitais adicionados em `/admin`.

## Pendencias Somente Manuais do Usuario (Contas Externas)
1. **Troca definitiva Stripe NKL -> Produção:** quando ativar a conta Live `nkloficial` e tiver `pk_live_...` + `sk_live_...` em `.env.local`, rodar `npm run stripe:provision -- --sync-vercel-prod` e depois `vercel deploy --prod --yes`.
2. **Plugins Antigravity / Afiliados / Cloudflare / Search Console:** ver `docs/CHECKLIST-OFFLINE-NKL.md`.
