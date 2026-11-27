# Publicador Multiplataforma de Vídeos — Portal NKL

Guia operacional para distribuir vídeos e legendas em múltiplas redes sociais usando apenas APIs oficiais e pontes autorizadas (Postiz self-hosted ou Webhook para n8n/Make), sem scraping nem automação não oficial.

---

## 1. Canais Suportados (`SOCIAL_CHANNELS`)

| Canal | Modo | Protocolo / API | Limites Principais |
| :--- | :--- | :--- | :--- |
| `youtube` | API Oficial | YouTube Data API v3 (`uploadType=resumable`) | Título 100 chars, texto 5000 chars, vídeo até 43200s |
| `tiktok` | API Oficial | TikTok Content Posting API v2 | Texto 2200 chars, vídeo até 600s |
| `instagram` | API Oficial | Meta Graph API v21.0 (Reels) | Texto 2200 chars, vídeo até 900s |
| `facebook` | API Oficial | Meta Graph API v21.0 (Page Videos) | Texto 2200 chars, vídeo até 14400s |
| `bluesky` | API Oficial | Bluesky (AT Protocol: `createSession` + `uploadBlob` + `createRecord`) | Texto 300 chars, vídeo até 60s, 50 MB |
| `threads` | API Oficial | Meta Threads Graph API v1.0 | Texto 500 chars, vídeo até 300s, 1024 MB |
| `mastodon` | API Oficial | Fediverse (`/api/v2/media` + `/api/v1/statuses`) | Texto 500 chars, vídeo até 300s, 40 MB |
| `x` | API Oficial | X API v2 (`/2/tweets`) | Texto 280 chars, vídeo até 140s, 512 MB |
| `bilibili` | Bridge | Postiz, Webhook ou token dedicado | Título 80 chars, texto 2000 chars |
| `kwai` | Bridge | Postiz ou Webhook (n8n / Make) | Texto 2200 chars |
| `postiz` | Bridge | Postiz Public API v1 (Kwai, Pinterest, LinkedIn, Reddit, Telegram) | Texto 2200 chars |
| `webhook` | Bridge | HTTP POST assinado com `X-NKL-Signature` (HMAC-SHA256) | Texto 2200 chars |

Observação sobre redes extras: **Kwai, Pinterest, LinkedIn, Reddit e Telegram** são atendidos pelos canais `kwai`, `postiz` ou `webhook`, evitando integrações frágeis.

---

## 2. Variáveis no `.env.local`

Adicione apenas as credenciais das redes que você deseja ativar. O painel `/admin/publicador` e o comando `doctor` exibem somente se a variável está preenchida (`true`/`false`), sem jamais expor os segredos.

### Bluesky (AT Protocol com App Password)
```env
BLUESKY_HANDLE=seu-perfil.bsky.social
BLUESKY_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
# Opcional se usar PDS próprio:
# BLUESKY_PDS_URL=https://bsky.social
```

### Meta Threads, Instagram Reels e Facebook Página
```env
THREADS_USER_ID=1234567890
THREADS_ACCESS_TOKEN=seu_token_threads

META_ACCESS_TOKEN=seu_token_meta_graph
META_IG_USER_ID=17841400000000000
META_FB_PAGE_ID=100000000000000
```
Nota: A Graph API da Meta (Threads, Instagram Reels e Facebook Vídeo) exige URL pública HTTPS (`videoUrl`) para ingestão do vídeo pelo servidor da Meta.

### YouTube (Data API v3)
Você pode informar um `YOUTUBE_ACCESS_TOKEN` direto ou o par OAuth para renovação automática:
```env
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
YOUTUBE_REFRESH_TOKEN=...
# ou direto:
# YOUTUBE_ACCESS_TOKEN=...
```

### TikTok (Content Posting API v2)
```env
TIKTOK_ACCESS_TOKEN=...
```

### Mastodon (Fediverse)
```env
MASTODON_INSTANCE_URL=https://mastodon.social
MASTODON_ACCESS_TOKEN=...
```

### X / Twitter (API v2)
```env
X_ACCESS_TOKEN=...
# Opcional quando já houver media_id enviado:
# X_MEDIA_ID=...
```

### Postiz (Self-hosted) e Webhook (n8n / Make)
```env
POSTIZ_API_URL=http://localhost:4007/api
POSTIZ_API_KEY=...

SOCIAL_WEBHOOK_URL=https://seu-n8n.exemplo.com/webhook/nkl-social
SOCIAL_WEBHOOK_SECRET=segredo_para_hmac_sha256
```

### Geração de Textos com 9router Local (Opcional)
Quando `NINE_ROUTER_BASE_URL` e `NINE_ROUTER_API_KEY` estiverem configurados, o gerador usa o endpoint compatível com OpenAI (`/chat/completions`) com o modelo `NINE_ROUTER_MODEL` (padrão `NKL-OPERARIOS`). Sem internet ou sem chave, o gerador usa automaticamente o modo local determinístico, garantindo zero falhas e zero emojis.

---

## 3. Fluxo no Painel `/admin/publicador`

1. Acesse `/admin` e clique em **Publicador Multiplataforma (/admin/publicador)** (somente contas com `role = 'admin'`).
2. Preencha o tema do vídeo, a rota de destino no `nkloficial.com.br`, o termo opcional de busca Navboost (`Pesquise "..." no Google`) e os caminhos dos arquivos horizontal (`16:9`) e vertical (`9:16`).
3. Clique em **Gerar textos por rede** e revise a contagem de caracteres restantes em tempo real.
4. Baixe ou copie o `job.json` para salvar em `workspace/social-publisher/jobs/<id>.json`.

---

## 4. Uso pelo Terminal (CLI)

### Conferir conexões ativas
```powershell
npx tsx tools/social-publisher/cli.ts doctor
```

### Criar rascunho direto pelo CLI
```powershell
npx tsx tools/social-publisher/cli.ts draft --topic "Guia prático de inglês no Portal NKL" --url /idiomas --navboost "portal nkl idiomas" --channels youtube,tiktok,instagram,bluesky,threads,mastodon,x --ai
```

### Validar limites e regras editoriais
```powershell
npx tsx tools/social-publisher/cli.ts validate --job workspace/social-publisher/jobs/pub-12345678.json
```

### Simular publicação sem enviar para a rede (`--dry-run`)
```powershell
npx tsx tools/social-publisher/cli.ts publish --job workspace/social-publisher/jobs/pub-12345678.json --dry-run
```

### Publicar ao vivo (`--live`) com controle de idempotência
```powershell
npx tsx tools/social-publisher/cli.ts publish --job workspace/social-publisher/jobs/pub-12345678.json --live
```
O registro em `workspace/social-publisher/ledger.json` impede duplicação da mesma combinação `jobId + channel + mediaSha256`. Para reenviar propositalmente, adicione `--force`.

### Consultar histórico e status
```powershell
npx tsx tools/social-publisher/cli.ts status
```

---

## 5. Subir o Postiz Local com Docker Compose

Para distribuir Kwai, Pinterest, LinkedIn, Reddit e Telegram em uma única ponte:

1. Defina `POSTIZ_DB_PASSWORD` e `POSTIZ_JWT_SECRET` (mínimo 32 caracteres) no seu ambiente ou em um `.env` dedicado fora do Git.
2. Suba os containers:
```powershell
docker compose -f tools/social-publisher/docker-compose.postiz.yml up -d
```
3. Crie sua conta local em `http://localhost:4007`, conecte suas redes no Postiz, copie a API Key e preencha `POSTIZ_API_URL` e `POSTIZ_API_KEY` no `.env.local`.

---

## 6. Integração com a Fábrica de Vídeos (`tools/nkl-video-factory.ts`)

O manifesto da fábrica de vídeos aceita todos os 12 canais oficiais e de ponte (`youtube`, `tiktok`, `instagram`, `facebook`, `bilibili`, `bluesky`, `threads`, `mastodon`, `x`, `kwai`, `postiz`, `webhook`), mantendo o fluxo de aprovação humana em 3 etapas (`content`, `clip`, `metadata`) antes do planejamento de publicação.
