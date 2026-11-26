# Checklist Mestre NKL_OFICIAL (Ações Manuais Consolidadas)

Lista unificada e priorizada com tudo o que depende apenas das suas contas externas, browser ou aprovações comerciais.

---

## Prioridade 1 — Pagamentos e Conta Própria no Stripe (NKL)

1. **Ativar a conta `nkloficial` no modo Live (Produção):**
   - No painel do Stripe da organização **NKL**, saia do modo *Ambiente de teste* (atual `acct_1UbswFItNBn1daZu`) e conclua o cadastro/CNPJ/conta bancária no modo **Produção (Live)**.
2. **Migrar chaves no `.env.local` e sincronizar Vercel com 1 comando:**
   - Cole a `pk_live_...` em `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` e a `sk_live_...` em `STRIPE_SECRET_KEY` no seu `.env.local`.
   - Rode `npm run stripe:provision -- --sync-vercel-prod` e depois `vercel deploy --prod --yes`.
   - O script cria automaticamente produto, 3 preços (R$ 39/mês, R$ 99, R$ 397), cupons de 30%/50% de idiomas, webhook oficial de 13 eventos e atualiza a Vercel sem expor segredos.

---

## Prioridade 2 — Domínio, E-mail Próprio e Infraestrutura

3. **Cloudflare Email Routing (`@nkloficial.com.br`):**
   - No Registro.br, aponte os Nameservers de `nkloficial.com.br` para os da sua conta Cloudflare preservando os registros DNS já existentes da Vercel (`A` / `CNAME`) e Resend (`DKIM`/`SPF`).
   - Ative o *Email Routing* na Cloudflare e direcione o endereço principal `@nkloficial.com.br` para sua caixa pessoal (passo a passo em [GUIA-CLOUDFLARE-EMAIL-E-NOTEBOOKLM.md](./GUIA-CLOUDFLARE-EMAIL-E-NOTEBOOKLM.md)).
4. **Conectar Plugins no Antigravity:**
   - Adicionar os cartões de plugin do **Stripe** e da **Cloudflare** no chat e concluir o login no `vercel-plugin` já instalado.
   - Opcional no terminal local: rodar `vercel env pull .env.local` caso queira testar checkouts de IA e convidados localmente.

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
