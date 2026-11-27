# Contexto Ativo (Portal NKL)

## Foco Atual

- **Otimização CWV (LCP/FCP/INP), Auto-Scroll de Tags & Auditoria 100% `cancel_url` Stripe (2026-11-27):**
  - `/programas`: trocado de `force-dynamic` para ISR (`revalidate = 300`), eliminada tripla serialização RSC enxugando props de `IncomeWizard` (`WizardProgram`) e `ProgramCompare` (`CompareProgram`) com parsing de query params no cliente.
  - `ParallaxBackground` e `PrivacyScripts`: `PortalHomeParallax` via `next/dynamic(..., { ssr: false })` + `requestIdleCallback`; AdSense, GA4 e Clarity em `strategy="lazyOnload"` + `posthog-js` em `requestIdleCallback`.
  - Anti rage-click em `/programas`: seleção de tags `DISCOVERY_TAGS`, Categoria ou Dificuldade rola suavemente até `#programs-grid` (`cardsResultsRef`), exibe badge `Filtro ativo` + `Limpar filtros`, e pills informativas usam `pointer-events-none select-none`.
  - Stripe `cancel_url`: 100% dos fluxos (`ai-offer-checkout`, `guide-checkout-button`, `guide-subscription-button`, `ProductCheckoutClient`, `/programas/anuncie`, `/dashboard/luthier/planos`, `/checkout/[bookingId]`) retornam exatamente à página de origem via `cancelPath`.
- **Livro KDP Digital + Físico (`npm run amazon:book`, 2026-11-27):** EPUB (`46.110` palavras), Paperback 6x9" PDF (`174` pág., `48.263` palavras) e capas prontas em `private-assets/amazon-book/`.

## Pendencias Somente Manuais do Usuario (Contas Externas)

1. **Checklist Consolidado:** ver `docs/CHECKLIST-MESTRE-NKL.md` (Search Console Item 5 e publicação dos arquivos KDP em `private-assets/amazon-book/`).
