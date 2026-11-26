# Contexto Ativo (Portal NKL)

## Foco Atual

- **Virada Definitiva Stripe Live `nkloficial` (`acct_1UcBBKI4kUNNokuF`) & Organização `.env.local` (2026-11-26):**
  - **`.env.local` higienizado:** 53 chaves ativas sem duplicidade, 35 variáveis legadas (`Buymeacoffee`, `MERCADOPAGO_*`, duplicatas minúsculas) preservadas comentadas em `# 9. Arquivo Legado`, chaves Live `nkloficial` ativas e Sandbox `TEST_BACKUP_*` isolado para testes.
  - **Catálogo, Webhook e Vercel Production Live:** removidos 3 preços órfãos copiados do sandbox e provisionados na conta Live `acct_1UcBBKI4kUNNokuF` (`nkloficial`) todos os **12 produtos / 33 preços**, cupons `nkl_idioma_30`/`nkl_idioma_50` e webhook `we_1UgAYZI4kUNNokuFEco8FYwc` (`https://nkloficial.com.br/api/payments/stripe-webhook`, 13 eventos), com `--write-env-local` e sincronização das 6 variáveis para Vercel Production.
  - **Próximas ações externas:** ver `docs/CHECKLIST-MESTRE-NKL.md` (Cloudflare Email Routing, Google Search Console, afiliados, Amazon KDP e NotebookLM; Prioridade 1 Stripe Live concluída).

- **Cloudflare DNS & Email Routing pré-configurados via MCP (2026-11-26):**
  - Zona `a9a32df7401d381a84426bfc7d9bb338` (`nkloficial.com.br`, `pending` aguardando delegação Registro.br de `cloe`/`doug.ns.cloudflare.com`): os 4 registros (`A @` x2, `CNAME www`, `CNAME track`) foram alterados para `proxied: false` (`DNS only`) e os registros do Resend (`send`, `resend._domainkey`, `_dmarc`) preservados.
  - Email Routing pré-configurado: destino `ni2co3san9@gmail.com` verificado e regras `contato@nkloficial.com.br` e `suporte@nkloficial.com.br` ativas (`enabled: true`). Falta apenas rodar `POST /email/routing/dns` assim que a zona ficar `active`.

## Pendencias Somente Manuais do Usuario (Contas Externas)

1. **Checklist Consolidado:** acompanhar `docs/CHECKLIST-MESTRE-NKL.md` (1 clique final na Cloudflare após propagação DNS + Google Search Console + afiliados/KDP/NotebookLM).
