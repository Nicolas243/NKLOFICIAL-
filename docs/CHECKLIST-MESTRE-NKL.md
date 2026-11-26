# Checklist Mestre NKL_OFICIAL (Ações Manuais Consolidadas)

Lista unificada e priorizada com tudo o que depende apenas das suas contas externas, browser ou aprovações comerciais.

---

## Prioridade 1 — Pagamentos e Conta Própria no Stripe (NKL) [CONCLUÍDO em 2026-11-26]

1. ~~**Ativar a conta `nkloficial` no modo Live (Produção):**~~ CONCLUÍDO (`acct_1UcBBKI4kUNNokuF`, `charges_enabled=true`, `payouts_enabled=true`).
2. ~~**Migrar chaves no `.env.local` e sincronizar Vercel:**~~ CONCLUÍDO (`.env.local` limpo com 53 chaves ativas, 12 produtos e 33 preços provisionados, cupons `nkl_idioma_30`/`50`, webhook `we_1UgAYZI4kUNNokuFEco8FYwc` com 13 eventos e 6 variáveis sincronizadas na Vercel Production).

---

## Prioridade 2 — Domínio, E-mail Próprio e Infraestrutura

3. **Cloudflare Email Routing (`@nkloficial.com.br`) — Quase 100% pronto (aguardando propagação do Registro.br):**
   - Nameservers já trocados no Registro.br (`cloe.ns.cloudflare.com` e `doug.ns.cloudflare.com`) — em transição (~2h).
   - Registros DNS já corrigidos automaticamente via API para `DNS only` (`proxied: false`): `A @` (`64.29.17.1`, `216.198.79.1`), `CNAME www` e `CNAME track` (e registros `send`/`resend._domainkey`/`_dmarc` preservados).
   - Endereço de destino `ni2co3san9@gmail.com` já verificado na Cloudflare (`verified`), e regras ativas já criadas para `contato@nkloficial.com.br` e `suporte@nkloficial.com.br`.
   - **Falta apenas 1 clique quando a zona virar `Active` na Cloudflare:** abrir **Email > Email Routing** e clicar em **Add records and enable** (ou enviar `"cloudflare ativa"` no chat para o Hermes ativar via API).
4. **Conectar Plugins no Antigravity (Opcional):**
   - **Cloudflare MCP:** já autenticado e operacional.
   - **Stripe MCP:** atualmente conectado na conta Sandbox (`acct_1UbswFItNBn1daZu`); reconexão à conta Live `acct_1UcBBKI4kUNNokuF` no MCP é opcional porque a Vercel e o provisionamento usam `sk_live_...` diretamente.
   - **Vercel:** CLI autenticado e operando normalmente no deploy de produção.

---

## Prioridade 3 — Google Search Console, Analytics e Segurança

5. **Inspeção de URL no Google Search Console (`https://nkloficial.com.br/`):**
   - Reenviar `https://nkloficial.com.br/sitemap.xml` e usar *Inspeção de URL -> Solicitar indexação* para:
     - `/`
     - `/programas`
     - `/idiomas`
     - `/blog/aprender/ingles`
     - `/blog/aprender/chines`
     - `/ofertas/bussola-negocios`
     - `/ia/oferta`
     - `/guias/renda-extra`
6. **Leaked Password Protection no Supabase (Opcional ao fazer upgrade para Pro):**
   - O único `WARN` restante no Supabase Security Advisor (`auth_leaked_password_protection`) exige plano Pro em Authentication -> Attack Protection.

---

## Prioridade 4 — Monetização de Afiliados, Amazon KDP e NotebookLM

7. **Afiliados das Oportunidades de Renda Extra:**
   - Abrir/validar cadastros nos programas listados em [MAPA-AFILIADOS-50-OPORTUNIDADES.md](./MAPA-AFILIADOS-50-OPORTUNIDADES.md) e colar cada link em `/programas/admin` (ou tabela `partner_programs`).
8. **Publicação na Amazon KDP:**
   - Subir os arquivos gerados em `private-assets/amazon-book/` para **Kindle eBook** e **Paperback 6x9"** conforme [EBOOK-50-FORMAS-RENDA-EXTRA-AMAZON.md](./EBOOK-50-FORMAS-RENDA-EXTRA-AMAZON.md).
9. **Áudios Progressivos no NotebookLM:**
   - Gerar os resumos em áudio das aulas semanais do curso *IA na Prática* e de idiomas usando o NotebookLM conforme [GUIA-CLOUDFLARE-EMAIL-E-NOTEBOOKLM.md](./GUIA-CLOUDFLARE-EMAIL-E-NOTEBOOKLM.md).
10. **Push Nativo de Sistema Operacional (Opcional):**
    - Cadastrar `NEXT_PUBLIC_VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` na Vercel se desejar Web Push no SO além da central in-app de notificações em `/admin`.
