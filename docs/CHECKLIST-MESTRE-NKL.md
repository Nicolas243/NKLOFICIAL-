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

## Prioridade 3 — Google Search Console, Analytics e Segurança

5. **Inspeção de URL e "Página com redirecionamento" no Google Search Console (`https://nkloficial.com.br/`):**
   - Auditoria técnica local/ao vivo concluída em 2026-11-26: **115/115 URLs de `sitemap.xml` retornam HTTP 200 com 0 redirecionamentos e 0 erros**, e há **0 links internos em `src/` apontando para rotas com redirect** (os únicos redirecionamentos ativos são os `301` intencionais de legado em `next.config.ts`/`src/proxy.ts` + HTTP->HTTPS `308`).
   - Falta apenas conectar o Chrome com depuração remota (`chrome://inspect/#remote-debugging`) para o Hermes abrir o Search Console e inspecionar os exemplos exatos de "Página com redirecionamento", conferir `sitemap.xml` e solicitar indexação para:
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

7. **Afiliados das Oportunidades de Renda Extra (validar após conclusão do site):**
   - Etapa pós-lançamento: após concluir a publicação e revisão final do site, validar cadastros nos programas listados em [MAPA-AFILIADOS-50-OPORTUNIDADES.md](./MAPA-AFILIADOS-50-OPORTUNIDADES.md) e colar cada link em `/programas/admin` (ou tabela `partner_programs`).
8. **Publicação na Amazon KDP (arquivos finais gerados e validados — pronto para upload quando quiser):**
   - Edição completa gerada em `private-assets/amazon-book/` (14 capítulos/partes, 46.110 palavras no Kindle / 48.263 palavras e 174 páginas no Paperback 6x9", 57 dossiês, 18 modelos Bússola, 25 prompts de IA):
     - Digital: `57-formas-renda-extra-kindle.epub` + capa `capa-kindle-1600x2560.jpg`
     - Físico: `57-formas-renda-extra-paperback-6x9.pdf` + capa completa `capa-paperback-6x9-completa.pdf`
     - Metadados e passo a passo: `private-assets/amazon-book/KDP-METADADOS-E-PUBLICACAO.md` ([EBOOK-50-FORMAS-RENDA-EXTRA-AMAZON.md](./EBOOK-50-FORMAS-RENDA-EXTRA-AMAZON.md)).
9. **Áudios Progressivos no NotebookLM (configurado no site como prêmio/bônus futuro em breve):**
   - Configurado em `/ia/curso` como prêmio/bônus futuro em breve para alunos ("Prêmio em breve — Áudios Progressivos no NotebookLM chegando para alunos"). Quando for produzir os episódios, gerar os resumos em áudio das aulas semanais do curso *IA na Prática* e de idiomas usando o NotebookLM conforme [GUIA-CLOUDFLARE-EMAIL-E-NOTEBOOKLM.md](./GUIA-CLOUDFLARE-EMAIL-E-NOTEBOOKLM.md).
10. ~~**Push Nativo de Sistema Operacional (VAPID Web Push):**~~ CONCLUÍDO em 2026-11-26 (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT=mailto:contato@nkloficial.com.br` gravadas no `.env.local` e sincronizadas na Vercel Production; `/api/notifications/push/config` verificado ao vivo com `enabled: true` no deploy `dpl_HzGuUdSDG79hCekYdj2eRjFJq81x`).
