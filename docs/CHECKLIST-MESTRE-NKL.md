# Checklist Mestre NKL_OFICIAL (Ações Manuais Consolidadas)

Lista unificada e priorizada com tudo o que depende apenas das suas contas externas, browser ou aprovações comerciais.

---

## Prioridade 1 — Pagamentos e Conta Própria no Stripe (NKL) [CONCLUÍDO em 2026-11-26]

1. ~~**Ativar a conta `nkloficial` no modo Live (Produção):**~~ CONCLUÍDO (`acct_1UcBBKI4kUNNokuF`, `charges_enabled=true`, `payouts_enabled=true`).
2. ~~**Migrar chaves no `.env.local` e sincronizar Vercel:**~~ CONCLUÍDO (`.env.local` limpo com 53 chaves ativas, 12 produtos e 33 preços provisionados, cupons `nkl_idioma_30`/`50`, webhook `we_1UgAYZI4kUNNokuFEco8FYwc` com 13 eventos e 6 variáveis sincronizadas na Vercel Production).

---

## Prioridade 2 — Domínio, E-mail Próprio e Infraestrutura

3. ~~**Cloudflare Email Routing (`@nkloficial.com.br`):**~~ CONCLUÍDO em 2026-11-26 (`status: "ready"`, `enabled: true` na zona `a9a32df7401d381a84426bfc7d9bb338`; registros `MX`/`SPF`/DKIM ativados automaticamente após propagação de `cloe`/`doug.ns.cloudflare.com`, preservando `send`/`resend._domainkey`/`_dmarc`; regras ativas para `contato@nkloficial.com.br` e `suporte@nkloficial.com.br` encaminhando para `ni2co3san9@gmail.com`).
4. **Conectar Plugins no Antigravity (Opcional):**
   - **Cloudflare MCP:** já autenticado e operacional.
   - **Stripe MCP:** atualmente conectado na conta Sandbox (`acct_1UbswFItNBn1daZu`); reconexão à conta Live `acct_1UcBBKI4kUNNokuF` no MCP é opcional porque a Vercel e o provisionamento usam `sk_live_...` diretamente.
   - **Vercel:** CLI autenticado e operando normalmente no deploy de produção.

---

## Prioridade 3 — Google Search Console, Bing Webmaster Tools, GEO & Segurança

5. **Inspeção de URL e "Página com redirecionamento" no Google Search Console (`https://nkloficial.com.br/`):**
   - Auditoria técnica local/ao vivo concluída em 2026-11-26: **115/115 URLs de `sitemap.xml` retornam HTTP 200 com 0 redirecionamentos e 0 erros**, e há **0 links internos em `src/` apontando para rotas com redirect** (os únicos redirecionamentos ativos são os `301` intencionais de legado em `next.config.ts`/`src/proxy.ts` + HTTP->HTTPS `308`).
   - Arquitetura GEO + IndexNow implantada em 2026-11-27: chave `public/a7f4c92e1b8d40539e6c1a2f8b4d7e03.txt` + `npm run seo:indexnow`, `/llms.txt`, `/llms-full.txt`, `robots.ts` liberando crawlers de IA (`OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Claude-SearchBot`, `ClaudeBot`, `Applebot`, `Google-Extended`), `/metodologia`, BLUF, tabelas SSR, Schema `@graph` (`@id`), `lastmod` honesto no `sitemap.xml` e 22 páginas de comparativos (`/programas/comparar/*` + `/comparar/*`).
   - Faltam apenas estas ações externas no navegador:
     - **Bing Webmaster Tools (1 clique -> alimenta ChatGPT Search e Copilot):** acessar `https://www.bing.com/webmasters`, clicar em **Import from Google Search Console** e confirmar o `sitemap.xml` + status do IndexNow.
     - **Google Search Console:** inspecionar os exemplos de "Página com redirecionamento", conferir `sitemap.xml` atualizado e solicitar indexação das rotas principais (`/`, `/programas`, `/metodologia`, `/idiomas`, `/blog/aprender/ingles`, `/blog/aprender/chines`, `/ofertas/bussola-negocios`, `/ia/oferta`, `/guias/renda-extra`, `/catalogo`, `/comparar`).
6. **Leaked Password Protection no Supabase (Opcional ao fazer upgrade para Pro):**
   - O único `WARN` restante no Supabase Security Advisor (`auth_leaked_password_protection`) exige plano Pro em Authentication -> Attack Protection.

---

## Prioridade 3B — Estratégia Off-Page GEO & Navboost (Itens 8 e 10)

- **Coocorrência e citações fora do site (Item 8):**
  - Publicar links e menções contextuais do Portal NKL (ex.: citando `/metodologia`, `/catalogo` e `/programas`) em comunidades e perfis pertinentes: comentários/respostas construtivas no Reddit (`r/violinist`, `r/brasil`, `r/investimentos`), fóruns de violino/luteria (Maestronet, Orquestra Brasil), descrição de vídeos no YouTube (`@nkloficial`), bio/fixados no TikTok e Instagram, além do próprio livro publicado na Amazon KDP.
- **Sinais de busca pela marca — Navboost (Item 10):**
  - Nos vídeos de YouTube, TikTok e Reels, usar chamada direta incentivando busca exata no Google em vez de só "link na bio": *"Pesquise `Portal NKL cordas` ou `Portal NKL renda extra` no Google"*. Buscas explícitas com o nome da marca seguidas de clique fortalecem o sinal de relevância no buscador.

---

## Prioridade 4 — Monetização de Afiliados, Amazon KDP e NotebookLM

7. **Afiliados das Oportunidades de Renda Extra (validar após conclusão do site):**
   - Etapa pós-lançamento: após concluir a publicação e revisão final do site, validar cadastros nos programas listados em [MAPA-AFILIADOS-50-OPORTUNIDADES.md](./MAPA-AFILIADOS-50-OPORTUNIDADES.md) e colar cada link em `/programas/admin` (ou tabela `partner_programs`).
8. **Publicação do Livro (Amazon KDP + 5 Kits Multiplataforma Prontos):**
   - **Amazon KDP (`private-assets/amazon-book/`):** Kindle EPUB + capa `1600x2560`, Paperback 6x9" (174 pág.) + capa wrap + metadados em `KDP-METADADOS-E-PUBLICACAO.md`.
   - **Outras Plataformas (`private-assets/book-multiplatform/`, gerar com `npm run book:multiplatform`):**
     - `01-uiclap-fisico/` + `02-clube-de-autores/`: PDF `16x23 cm` (186 pág.) + capa wrap sem caixa ISBN KDP (`lombada 11.89 mm`) -> **pode subir já no físico** (não há exclusividade de impresso no KDP Select).
     - `03-google-play-livros/`, `04-draft2digital-apple-kobo-global/` e `05-venda-direta-hotmart-portal-nkl/`: EPUB edição ampla + PDF tela (`231` pág.) -> subir somente se o e-book NÃO estiver inscrito no KDP Select (exclusividade digital de 90 dias). Ver [DISTRIBUICAO-LIVRO-MULTIPLATAFORMA.md](./DISTRIBUICAO-LIVRO-MULTIPLATAFORMA.md).
9. **Vídeos NotebookLM & Publicador Multiplataforma (Prontos para Render & Tokens):**
   - **15 Pacotes NotebookLM (`private-assets/notebooklm-packs/`, gerar com `npm run nlm:sources`):** textos-fonte, prompts, manifestos, `30` capas `16:9` e `9:16`, `captions.srt` e `metadata-upload.json`. Suba no NotebookLM (ou use `run-notebooklm-batch.ps1` com `notebooklm login`), baixe `audio.mp3`/`audio.m4a`, instale `winget install Gyan.FFmpeg` e rode `npm run nlm:render -- --all` (`npm run nlm:render`). Depois vincule os links em `src/lib/ai-course.ts` (`videoEmbedUrl` / `audioUrl`). Ver [NOTEBOOKLM-PIPELINE-ENTREGAVEIS.md](./NOTEBOOKLM-PIPELINE-ENTREGAVEIS.md).
   - **Publicador Social (`/admin/publicador` e `npm run social:publish`):** adaptadores oficiais para Bluesky, Threads, Mastodon, X, YouTube, TikTok, Instagram, Facebook, Bilibili + Postiz/Webhook (Kwai, Pinterest, LinkedIn, Reddit, Telegram). Preencha as credenciais OAuth/App Password no `.env.local` conforme [PUBLICADOR-MULTIPLATAFORMA-VIDEOS.md](./PUBLICADOR-MULTIPLATAFORMA-VIDEOS.md).
10. ~~**Push Nativo de Sistema Operacional (VAPID Web Push):**~~ CONCLUÍDO em 2026-11-26 (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT=mailto:contato@nkloficial.com.br` gravadas no `.env.local` e sincronizadas na Vercel Production; `/api/notifications/push/config` verificado ao vivo com `enabled: true` no deploy `dpl_HzGuUdSDG79hCekYdj2eRjFJq81x`).
