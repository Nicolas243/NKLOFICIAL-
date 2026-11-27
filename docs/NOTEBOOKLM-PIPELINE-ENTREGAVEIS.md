# Pipeline NotebookLM e Entregáveis em Áudio e Vídeo — Portal NKL

Este documento descreve o fluxo completo para transformar os conteúdos oficiais do Portal NKL em episódios de áudio, vídeos horizontais (`16:9`) e verticais (`9:16`), legendas `.srt` e pacotes prontos para publicação.

## 1. Os 15 Pacotes de Produção

O gerador `scripts/notebooklm/build-notebooklm-sources.ts` organiza 15 pastas em `private-assets/notebooklm-packs/` (diretório ignorado pelo Git):

1. **Curso IA na Prática (7 pacotes):**
   - `ia-01-pensar-com-ia` (`/ia/curso/pensar-com-ia`)
   - `ia-02-prompting` (`/ia/curso/prompting`)
   - `ia-03-pesquisa-verificacao` (`/ia/curso/pesquisa-verificacao`)
   - `ia-04-texto-imagem-voz` (`/ia/curso/texto-imagem-voz`)
   - `ia-05-produtividade` (`/ia/curso/produtividade`)
   - `ia-06-conteudo-negocios` (`/ia/curso/conteudo-negocios`)
   - `ia-07-codigo-seguranca` (`/ia/curso/codigo-seguranca`)
2. **Guias de Idiomas (6 pacotes):**
   - `ingles-para-ganhar-dinheiro` (`/ofertas/ebook-ingles`)
   - `italiano-para-ganhar-possibilidades` (`/guias/italiano`)
   - `frances-para-ganhar-possibilidades` (`/guias/frances`)
   - `alemao-para-ganhar-possibilidades` (`/guias/alemao`)
   - `espanhol-para-ganhar-possibilidades` (`/guias/espanhol`)
   - `chines-para-ganhar-possibilidades` (`/guias/chines`)
3. **Guias Principais (2 pacotes):**
   - `guia-renda-extra-57-formas` (`/ofertas/pacote-renda-extra`)
   - `bussola-negocios-18-modelos` (`/ofertas/bussola-negocios`)

Cada pasta recebe:
- `source.md`: texto limpo em português do Brasil, sem tags HTML e sem emojis.
- `notebooklm-prompt.txt`: instrução de foco em PT-BR com tom editorial responsável e chamada final para busca no Google ("pesquise Portal NKL no Google").
- `video-manifest.json`: manifesto validado contra `videoManifestSchema` (`tools/nkl-video-factory.ts`).
- `cover-16x9.jpg` (`1920x1080`) e `cover-9x16.jpg` (`1080x1920`) na identidade visual azul-marinho e dourado do Portal NKL.

Na raiz de `private-assets/notebooklm-packs/` também são gravados:
- `INDEX-PRODUCAO.md`: tabela completa dos 15 pacotes.
- `run-notebooklm-batch.ps1`: script PowerShell para automação via `notebooklm-py`.

## 2. Etapa 1 — Gerar ou Atualizar Fontes e Capas

Execute na raiz de `portal-nkl`:

```powershell
npx tsx scripts/notebooklm/build-notebooklm-sources.ts
```

Se `DATABASE_URL` estiver configurada em `.env.local`, os pacotes `guia-renda-extra-57-formas` e `bussola-negocios-18-modelos` consultam diretamente as tabelas `partner_programs` (`status = 'published'`) e `business_profiles`. Caso contrário, o script utiliza o fallback local em `private-assets/amazon-book/57-formas-renda-extra-kindle.html` e a lista padrão da Bússola de Negócios.

## 3. Etapa 2 — Gerar Áudio e Vídeo no NotebookLM em Lote

### Via CLI `notebooklm-py` (recomendado)

Instale a ferramenta e faça login na sua conta Google:

```powershell
uv tool install notebooklm-py
notebooklm login
```

Depois execute o lote completo:

```powershell
powershell -ExecutionPolicy Bypass -File private-assets/notebooklm-packs/run-notebooklm-batch.ps1
```

Para processar apenas um pacote específico ou pular o Video Overview:

```powershell
powershell -ExecutionPolicy Bypass -File private-assets/notebooklm-packs/run-notebooklm-batch.ps1 -PackSlug ia-01-pensar-com-ia -SkipVideoOverview
```

### Alternativa manual pelo navegador

1. Acesse `notebooklm.google.com` e crie um notebook por pacote.
2. Envie o arquivo `source.md` da pasta correspondente.
3. Cole o conteúdo de `notebooklm-prompt.txt` na instrução personalizada do Audio Overview (e/ou Video Overview) em Português.
4. Baixe o áudio gerado e salve como `audio.mp3`, `audio.m4a` ou `audio.wav` dentro da pasta do pacote (`private-assets/notebooklm-packs/<slug>/`).

## 4. Etapa 3 — Renderizar Vídeos Finalizados, Legendas e Metadados

O script `scripts/notebooklm/render-deliverable-video.ts` gera sempre `captions.srt` e `metadata-upload.json` (pronto para envio via `tools/social-publisher`) e, quando encontra o áudio e o `ffmpeg`, renderiza `video-16x9.mp4` (`1920x1080`, H.264 + AAC 128k + `-movflags +faststart`) e `video-9x16.mp4` (`1080x1920`).

Instale o `ffmpeg` no Windows (caso ainda não esteja instalado):

```powershell
winget install Gyan.FFmpeg
```

Execute para todos os pacotes:

```powershell
npx tsx scripts/notebooklm/render-deliverable-video.ts --all
```

Ou para um pacote específico informando um arquivo de áudio externo:

```powershell
npx tsx scripts/notebooklm/render-deliverable-video.ts --pack ia-01-pensar-com-ia --audio "C:\caminho\episodio-01.mp3"
```

## 5. Etapa 4 — Publicar no Curso IA na Prática (`src/lib/ai-course.ts`)

Cada módulo de `AI_COURSE_MODULES` em `src/lib/ai-course.ts` aceita os campos opcionais:

- `videoEmbedUrl?: string;` — URL de embed do YouTube (ex.: vídeo não listado `https://www.youtube.com/embed/VIDEO_ID?rel=0`).
- `audioUrl?: string;` — URL pública direta do MP3 hospedado no Cloudflare R2 (ou CDN equivalente).

Na página `src/app/ia/curso/[moduleSlug]/page.tsx`:

1. Se `videoEmbedUrl` estiver preenchido, o aluno vê um player responsivo `16:9` (`<iframe>`).
2. Caso contrário, se `audioUrl` estiver preenchido, o aluno vê um player HTML5 `<audio controls>`.
3. Enquanto ambos estiverem vazios, a página exibe o aviso padrão de `AI_NOTEBOOKLM_BONUS_BANNER` ("Prêmio em breve — Áudios Progressivos no NotebookLM chegando para alunos").

Exemplo de atualização em `src/lib/ai-course.ts`:

```ts
  {
    slug: 'pensar-com-ia',
    title: 'Como pensar com IA',
    summary: 'Entenda capacidades, limites, contexto, incerteza e revisão humana.',
    unlockAfterDays: 0,
    notebookLmFormat: 'Resumo em vídeo e áudio no NotebookLM + Guia interativo',
    videoEmbedUrl: 'https://www.youtube.com/embed/SEU_VIDEO_ID?rel=0',
    audioUrl: 'https://cdn.nkloficial.com.br/ia/ia-01-pensar-com-ia.mp3',
    lessons: [ /* ... */ ],
  },
```

## 6. Testes Automatizados

Para validar a geração das fontes, remoção de HTML/emojis, schema dos manifestos, geração de legendas `.srt` e metadados de upload:

```powershell
npx tsx --test scripts/notebooklm/__tests__/notebooklm-sources.test.ts
```
