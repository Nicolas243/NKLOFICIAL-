# Contexto Ativo (Portal NKL)

## Foco Atual

- **Cloudflare Email Routing ATIVO (`status: ready`) & Sync Produção (2026-11-26):**
  - Zona `a9a32df7401d381a84426bfc7d9bb338` (`nkloficial.com.br`) virou `active`; `POST /email/routing/dns` ativou MX/SPF/DKIM raiz preservando Resend (`send`, `resend._domainkey`, `_dmarc`). Regras `contato@` e `suporte@nkloficial.com.br` prontas.
  - Sincronizados `RESEND_API_KEY` real + `EMAIL_REPLY_TO` / `MATERIAL_ADMIN_EMAIL` (`contato@nkloficial.com.br`) para Vercel Production, corrigindo o erro 502 de `/api/materials` e isolando fallback quando Upstash estiver em placeholder. Disparo de boa fé do *Guia Essencial Renda Extra 2027* entregue (`33/33`, zero falhas).
- **Auditoria Geral 4 Tracks (UX, Perfil, Ofertas, Catálogo & 6 Idiomas) (2026-11-26):**
  - **Track A:** `moonsun-portal.png` em `.portal-theme-btn`; logo no header sempre em `/`; PWA Instalar oculto após instalação; rodapé em português (`Apoiar com um café`, `contato@nkloficial.com.br`); `/perfil` (`Meu Perfil`) com `birth_date`, toggles (`drizzle/0052_profile_modes.sql`) e auto-ativação; gráfico de pizza `-15%`; NotebookLM como prêmio em breve.
  - **Track B:** `/programas` com Salvar sobreposto, card de venda a cada 4 normais (nota máxima, "Começar imediato"/"Ler mais"/"Compartilhar", levando à landing/sorteio), sorteio livro ou R$ 50 Pix, `/sugerir` via Google Forms, remoção de `4000 vizu` em `/programas/anuncie`.
  - **Track C & D:** preços removidos de `/ofertas/bussola-negocios` + CTA `/checkout`; `cancel_url` dinâmico; CTA flutuante sem preço no e-book; Planner `.ics`; `/idiomas` clicável; Supabase `partner_programs` (`57` linhas com `jumptask`, `elevenlabs`, `fiverr`, `welocalize` traduzido); alinhamento semântico não monotônico + segmentação CJK nos 6 idiomas, traduções completas e `pt.youglish.com`.

## Pendencias Somente Manuais do Usuario (Contas Externas)

1. **Checklist Consolidado:** ver `docs/CHECKLIST-MESTRE-NKL.md` (Search Console: enviar `sitemap.xml` e solicitar indexação das 8 URLs; Prioridade 4 itens 7, 8 e 9 adiados para etapa posterior).
