# Contexto Ativo (Portal NKL)

## Foco Atual
- **Auditoria Stripe, Tooling (Plugins/CLI/MCP/Extensoes) e Higiene Pos-SEO concluida (2026-11-26):**
  - Webhook Stripe atualizado em `src/lib/stripe/webhook-helpers.ts` (`extractStripeInvoiceSubscriptionId`) e `src/lib/stripe/webhook.ts` para suportar faturas `2026-10-28.endive` (`invoice.parent.subscription_details.subscription`) e formato legado, preservar/normalizar e-mail no `guide_purchases` e sincronizar `businessDirectory.planType` em `processPremiumSubscription`.
  - `buildGuidePurchaseCheckoutParams` (`src/lib/stripe/guide.ts` + `create-guide-checkout/route.ts`) agora preenche `customerEmail` automaticamente no Checkout Stripe.
  - Titulo duplicado `| E-book Portal NKL` corrigido em `src/components/language-ebook-preview.tsx` e arquivo duplicado `googlea9035dd53b94a78b.html` removido da raiz (mantido `public/googlea9035dd53b94a78b.html`).
  - Servidor oficial `stripe` (`https://mcp.stripe.com`) adicionado em `tools/ide-mcp-manifest.json` e sincronizado via `npm run ide:sync` para VS Code, Cursor, Claude Code e Antigravity.

## Pendencias Somente Manuais do Usuario (Plugins / Contas Externas)
1. **Antigravity Plugins:** adicionar `Stripe` + `Cloudflare` via Marketplace e concluir login no `vercel-plugin`.
2. **CLI / Local Env:** rodar `vercel env pull .env.local` se quiser testar checkout de IA/convidado localmente e `stripe switch` caso prefira CLI fora do modo sandbox.
3. **Google Search Console, Afiliados, Cloudflare Email Routing e Amazon KDP:** ver `docs/CHECKLIST-OFFLINE-NKL.md`.
