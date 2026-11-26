# Contexto Ativo (Portal NKL)

## Foco Atual
- **Auditoria Completa 20 Pontos SEO, Fatos e CWV concluida (2026-11-26):**
  - 404 real HTTP `404` restaurado em rotas dinamicas (`/programas/[slug]`, `/catalogo/[id]`) removendo `loading.tsx` que forcava streaming `200`.
  - Redirecionamentos `301` sem cadeia em `next.config.ts` (`/comparador`, `/musica`, `/anuncie`, `/anuncie/contrato`, `/blog/renda-extra`).
  - `/comparar` convertido para Server Component + `comparar-client.tsx`; `<title>` unico sem duplicacao `| Portal NKL` e `rel="canonical"` proprio em todas as paginas publicas (removido `canonical: '/'` vazando do `layout.tsx`).
  - `Organization` JSON-LD com `sameAs` (`instagram.com/nkloficial/`, `tiktok.com/@nkloficial`, `youtube.com/@nkloficial`); links `#` de navegacao corrigidos; rodape conectado sem paginas orfas; alts descritivos; `<AuthorBio />` factual (`NKL_oficial`) nos artigos; `display: 'swap'`, `priority` nos 4 primeiros cards da home, cache 5m no `sitemap.xml` e bootstrap WebGL adiado em 1 rAF para INP.

## Pendencias Somente Manuais do Usuario (Browser / Contas Externas)
1. **Google Search Console:** testar URLs da lista de Inspecao de URL, reenviar sitemap e remover propriedade nao verificada `sc-domain:nkloficial.com` se desejar.
2. **Afiliados, Cloudflare Email Routing, Amazon KDP e NotebookLM:** checklist em `docs/CHECKLIST-OFFLINE-NKL.md`.
