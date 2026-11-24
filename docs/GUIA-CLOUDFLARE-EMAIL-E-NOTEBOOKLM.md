# Guia Definitivo: Cloudflare Email Routing (`@nkloficial.com.br`) + NotebookLM com Custo Zero/Baixo

## Parte 1 — Ativar E-mail `@nkloficial.com.br` pela Cloudflare (Sem Derrubar Site ou Resend)

### Estado Atual Confirmado do Domínio (`nkloficial.com.br`)
- Nameservers atuais no Registro.br: `d.sec.dns.br` e `e.sec.dns.br`.
- Registros ativos críticos (precisam ser copiados exatamente antes de trocar o NS):
  - Site principal (Vercel): `A @ -> 64.29.17.1` e `A @ -> 216.198.79.1`
  - Subdomínio `www`: `CNAME www -> b6d57c23b9157c10.vercel-dns-017.com`
  - Resend (envio transacional ativo): `MX send -> 10 feedback-smtp.sa-east-1.amazonses.com` e `TXT send -> v=spf1 include:amazonses.com ~all` (+ DKIM `resend._domainkey` existente no Registro.br — copie todos os registros TXT da zona atual no Registro.br antes de migrar!).
  - DMARC: `TXT _dmarc -> v=DMARC1; p=none;`

### Passo a Passo Sem Queda (15 minutos)
1. **Criar zona na Cloudflare:** acesse `dash.cloudflare.com` > **Add a domain** > informe `nkloficial.com.br` > escolha o plano **Free (R$ 0)**.
2. **Conferir e importar TODOS os registros DNS:** garanta que os registros `A` (`64.29.17.1`, `216.198.79.1`), `CNAME www`, `MX send`, `TXT send` e `TXT resend._domainkey` estejam na Cloudflare.
   - **IMPORTANTE:** para `A @` e `CNAME www` apontando para Vercel, deixe a nuvem como **DNS Only (cinza)** se quiser que a Vercel gerencie o certificado SSL diretamente sem conflito de proxy duplo.
3. **Trocar DNS no Registro.br:** acesse `registro.br` > clique em `nkloficial.com.br` > **Alterar servidores DNS** > substitua `d.sec.dns.br` e `e.sec.dns.br` pelos 2 nameservers fornecidos pela Cloudflare (`*.ns.cloudflare.com`).
4. **Ativar Cloudflare Email Routing:** quando o domínio ficar **Active** na Cloudflare:
   - Vá em **Email > Email Routing > Get Started**.
   - A Cloudflare criará automaticamente os registros `MX` e `TXT` corretos na raiz `@` para recebimento de e-mails **sem afetar** o subdomínio `send.nkloficial.com.br` usado pelo Resend para envio!
   - Cadastre sua caixa pessoal de destino (ex.: seu Gmail) e valide o código de confirmação enviado pela Cloudflare.
   - Crie seus endereços de entrada gratuitos:
     - `contato@nkloficial.com.br` -> encaminha para seu e-mail principal
     - `suporte@nkloficial.com.br` -> encaminha para seu e-mail principal
     - **Futuro por áreas:** você pode adicionar rotas no mesmo painel ou em subdomínios (`@musica.nkloficial.com.br`, `@renda.nkloficial.com.br`, `@ia.nkloficial.com.br`) seguindo a mesma lógica de encaminhamento gratuito.

### Como Responder Usando `@nkloficial.com.br` Sem Pagar Google Workspace
- Com o **Resend** já verificado no domínio + Cloudflare Email Routing para **receber**, você já envia com `Portal NKL <contato@nkloficial.com.br>` pelo site e pode configurar o **Send Mail As** no Gmail usando SMTP do Resend (`smtp.resend.com`, porta `465`, usuário `resend`, senha = sua `RESEND_API_KEY`).

---

## Parte 2 — NotebookLM Progressivo Sem Estourar Armazenamento

Os módulos do Curso **IA na Prática** (`src/lib/ai-course.ts`) já estão marcados com liberação progressiva semanal (`Dia 1`, `Semana 2` a `Semana 6`) e formato `NotebookLM`:

1. **Geração no NotebookLM (`notebooklm.google.com`):**
   - Suba o texto de cada módulo + exemplos práticos como fonte.
   - Clique em **Audio Overview** (modo debate/explicação em português) e exporte o áudio curto (5–8 min) ou **Video Overview**.
2. **Onde hospedar sem pagar caro (3 opções reais):**
   - **Opção A — YouTube Não Listado (Custo R$ 0, armazenamento ilimitado):** exporte o áudio como vídeo com capa estática simples do módulo, suba como *Não Listado* e incorpore apenas dentro da rota autenticada `/ia/curso/[moduleSlug]`.
   - **Opção B — Cloudflare R2 (10 GB/mês grátis + Egress ZERO):** quando ativar sua conta Cloudflare para o e-mail, crie um bucket R2 com URL assinada para servir `.mp3` sem pagar taxa de tráfego.
   - **Opção C — Supabase Storage (MP3 leve 64kbps):** cada episódio de 7 min em 64kbps mono ocupa apenas ~3,3 MB (`7` módulos = `~23 MB`), cabendo com folga dentro da cota gratuita do Supabase (`1 GB`).
