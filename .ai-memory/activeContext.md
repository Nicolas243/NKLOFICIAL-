# Contexto Ativo (Portal NKL)

## Foco Atual

- **Virada Definitiva Stripe Live `nkloficial` (`acct_1UcBBKI4kUNNokuF`) & Organização `.env.local` (2026-11-26):**
  - **`.env.local` higienizado:** 53 chaves ativas sem duplicidade, 35 variáveis legadas (`Buymeacoffee`, `MERCADOPAGO_*`, duplicatas minúsculas) preservadas comentadas em `# 9. Arquivo Legado`, chaves Live `nkloficial` ativas e Sandbox `TEST_BACKUP_*` isolado para testes.
  - **Catálogo, Webhook e Vercel Production Live:** removidos 3 preços órfãos copiados do sandbox e provisionados na conta Live `acct_1UcBBKI4kUNNokuF` (`nkloficial`) todos os **12 produtos / 33 preços**, cupons `nkl_idioma_30`/`nkl_idioma_50` e webhook `we_1UgAYZI4kUNNokuFEco8FYwc` (`https://nkloficial.com.br/api/payments/stripe-webhook`, 13 eventos), com `--write-env-local` e sincronização das 6 variáveis para Vercel Production.
  - **Próximas ações externas:** ver `docs/CHECKLIST-MESTRE-NKL.md` (Cloudflare Email Routing, Google Search Console, afiliados, Amazon KDP e NotebookLM; Prioridade 1 Stripe Live concluída).

- **Cloudflare DNS & Email Routing pré-configurados via MCP (2026-11-26):**
  - Zona `a9a32df7401d381a84426bfc7d9bb338` (`nkloficial.com.br`, `pending` aguardando delegação Registro.br de `cloe`/`doug.ns.cloudflare.com`): os 4 registros (`A @` x2, `CNAME www`, `CNAME track`) foram alterados para `proxied: false` (`DNS only`) e os registros do Resend (`send`, `resend._domainkey`, `_dmarc`) preservados.
  - Email Routing pré-configurado: destino `ni2co3san9@gmail.com` verificado e regras `contato@nkloficial.com.br` e `suporte@nkloficial.com.br` ativas (`enabled: true`). Falta apenas rodar `POST /email/routing/dns` assim que a zona ficar `active`.

- **Web Push VAPID (Item 10) + Auditoria Redirects/Sitemap (2026-11-26):**
  - Chaves VAPID (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:contato@nkloficial.com.br`) gravadas no `.env.local`, sincronizadas na Vercel Production e validadas ao vivo no deploy `dpl_HzGuUdSDG79hCekYdj2eRjFJq81x` (`/api/notifications/push/config` retorna `HTTP 200`, `enabled: true`).
  - Auditoria ao vivo em `https://nkloficial.com.br/sitemap.xml`: **115/115 URLs retornam HTTP 200 (0 redirects, 0 erros)** e **0 links internos em `src/` apontam para rotas de redirect** (`next.config.ts` / `src/proxy.ts` possuem apenas 301s legados intencionais e HTTP->HTTPS 308).
  - Zona Cloudflare `a9a32df7401d381a84426bfc7d9bb338` segue `pending` na transição de NS do Registro.br; subagente do Chrome aguardando `chrome://inspect/#remote-debugging` ativo para auditar o Search Console.

## Pendencias Somente Manuais do Usuario (Contas Externas)

1. **Checklist Consolidado:** acompanhar `docs/CHECKLIST-MESTRE-NKL.md` (habilitar `chrome://inspect/#remote-debugging` para inspeção no Search Console + 1 clique/aviso quando Cloudflare virar `active` + afiliados/KDP/NotebookLM).
