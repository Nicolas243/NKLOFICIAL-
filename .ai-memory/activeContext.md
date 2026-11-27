# Contexto Ativo (Portal NKL)

## Foco Atual

- **Correção Layout Mobile (`390px`, 2026-11-27):** adicionados `w-full max-w-full overflow-x-clip` em `<main>` (`layout.tsx`) e `w-full min-w-0` nos containers raiz (`/programas`, `/catalogo`, `/comparar`, `/metodologia`, hubs e comparativos) eliminando overflow horizontal (`978px` -> `390px`); busca + botão `Filtros` alinhados na mesma linha no mobile.
- **Busca Compacta + Faixa Única de Atalhos (`/programas` & `/catalogo`, 2026-11-27):** em `/programas`, os 6 blocos pré-cards (Dados do levantamento, Mapa prático, Bússola de Negócios, Como escolher, Guias de escolha e Explore por objetivo) viram uma única linha de botões clicáveis acima da barra de pesquisa + botão `Filtros e ordenação` abrindo pop-up modal.
- **3 Frentes de Escala Entregues (2026-11-27):**
  - **Frente 1 — NotebookLM & Vídeos dos Entregáveis:** `npm run nlm:sources` gerou `15` pacotes (`source.md`, `notebooklm-prompt.txt`, `video-manifest.json`, `30` capas `1920x1080`/`1080x1920`, `INDEX-PRODUCAO.md`, `run-notebooklm-batch.ps1`) + `npm run nlm:render` (`15` `captions.srt` e `metadata-upload.json`) em `private-assets/notebooklm-packs/`; `src/lib/ai-course.ts` e `/ia/curso/[moduleSlug]` prontos para `videoEmbedUrl`/`audioUrl`.
  - **Frente 2 — Publicador Multiplataforma (`tools/social-publisher/` + `/admin/publicador`):** 12 canais (`bluesky`, `threads`, `mastodon`, `x`, `youtube`, `tiktok`, `instagram`, `facebook`, `bilibili`, `kwai`, `postiz`, `webhook`), geração de copy em PT-BR com 9router (`NKL-OPERARIOS`) + fallback offline, `docker-compose.postiz.yml` e estúdio protegido em `/admin/publicador`.
  - **Frente 3 — Distribuição Ampla do Livro (`npm run book:multiplatform`):** 5 kits em `private-assets/book-multiplatform/` (`01-uiclap-fisico`, `02-clube-de-autores`, `03-google-play-livros`, `04-draft2digital-apple-kobo-global`, `05-venda-direta-hotmart-portal-nkl`), com PDF `16x23cm` de `186` pág., lombada `11.89mm` (90g), PDF tela `231` pág. e EPUB edição ampla.
- **GEO + `/sitemap.xml` Blindado em Produção (`828d5c3`):** `sitemap.xml` em ISR (`PRERENDER`/`HIT`), bypass no `proxy.ts`, redirects `301` e IndexNow (`258` URLs HTTP `200`).

## Pendencias Somente Manuais do Usuario (Contas Externas)

1. **Checklist Consolidado:** ver `docs/CHECKLIST-MESTRE-NKL.md` (reenviar `sitemap.xml` no GSC, importar Bing Webmaster Tools, instalar `Gyan.FFmpeg` + autenticar `notebooklm login`, preencher tokens OAuth/App Password no `.env.local` e subir kits do livro nas lojas).
