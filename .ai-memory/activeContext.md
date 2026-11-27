# Contexto Ativo (Portal NKL)

## Foco Atual

- **Livro Completo Amazon KDP Digital + Físico Gerado e Validado (2026-11-27):**
  - Pipeline modular `scripts/amazon-book/` (`types.ts`, `chapters-foundation.ts`, `dossier-enricher.ts`, `chapters-scale.ts`, `epub-builder.ts`, `covers-and-pdf.ts`) + `scripts/build-amazon-book.ts` (`npm run amazon:book`) gerando a edição completa a partir dos **57** programas e **18** modelos ao vivo do Supabase.
  - Entregáveis em `private-assets/amazon-book/` (fora do git): `57-formas-renda-extra-kindle.epub` (`46.110` palavras, EPUB 3.0 + NCX válido), `capa-kindle-1600x2560.jpg`, `57-formas-renda-extra-paperback-6x9.pdf` (`174` páginas `6x9"`, `48.263` palavras com caderno pautado e margens espelhadas), `capa-paperback-6x9-completa.pdf` (`12.64" x 9.25"`, lombada `0.3918"`) e `KDP-METADADOS-E-PUBLICACAO.md`.
- **Produção NKL (`dpl_GiYNoqz6PA3fUtEQrxJHPHJSxhHS`):** Cloudflare Email Routing ativo (`status: ready`), Resend/VAPID/Stripe Live 100% operacionais e cards `/programas` corrigidos.

## Pendencias Somente Manuais do Usuario (Contas Externas)

1. **Checklist Consolidado:** ver `docs/CHECKLIST-MESTRE-NKL.md` (Search Console Item 5; upload KDP em `private-assets/amazon-book/` pronto para quando NKL_OFICIAL quiser publicar; Afiliados/NotebookLM adiados).
