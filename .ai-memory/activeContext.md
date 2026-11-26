# Contexto Ativo (Portal NKL)

## Foco Atual

- **Virada Definitiva Stripe Live `nkloficial` (`acct_1UcBBKI4kUNNokuF`) & Organização `.env.local` (2026-11-26):**
  - **`.env.local` higienizado:** 53 chaves ativas sem duplicidade, 35 variáveis legadas (`Buymeacoffee`, `MERCADOPAGO_*`, duplicatas minúsculas) preservadas comentadas em `# 9. Arquivo Legado`, chaves Live `nkloficial` ativas e Sandbox `TEST_BACKUP_*` isolado para testes.
  - **Catálogo, Webhook e Vercel Production Live:** removidos 3 preços órfãos copiados do sandbox e provisionados na conta Live `acct_1UcBBKI4kUNNokuF` (`nkloficial`) todos os **12 produtos / 33 preços**, cupons `nkl_idioma_30`/`nkl_idioma_50` e webhook `we_1UgAYZI4kUNNokuFEco8FYwc` (`https://nkloficial.com.br/api/payments/stripe-webhook`, 13 eventos), com `--write-env-local` e sincronização das 6 variáveis para Vercel Production.
  - **Próximas ações externas:** ver `docs/CHECKLIST-MESTRE-NKL.md` (Cloudflare Email Routing, Google Search Console, afiliados, Amazon KDP e NotebookLM; Prioridade 1 Stripe Live concluída).

## Pendencias Somente Manuais do Usuario (Contas Externas)

1. **Cloudflare / Search Console / Afiliados / KDP / NotebookLM:** seguir prioridades 2–4 em `docs/CHECKLIST-MESTRE-NKL.md`.
