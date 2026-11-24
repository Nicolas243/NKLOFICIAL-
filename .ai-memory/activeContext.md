# Contexto Ativo (Portal NKL)

## Foco Atual
- **Fase D & Expansao Pre-Deploy concluida (2026-11-24):** Stripe Live + cupons `nkl_idioma_30`/`nkl_idioma_50`, migracao `0049` (55 oportunidades, 18 perfis, `push_subscriptions.app_scope`), backfill de 22 e-mails Resend com logo e secoes do portal, 6 idiomas liberados com guia de IA por idade + planner 90d + upsell 30%/50%, Estúdio IA Lab + NotebookLM semanal, Mural ilimitado por area e livro Amazon KDP (Kindle + 6x9").

## Pendencias Somente Manuais do Usuario (Browser / Contas Externas)
1. **Cloudflare Email Routing (`@nkloficial.com.br`):** migrar NS no Registro.br preservando Vercel A/CNAME + `send` do Resend conforme `docs/GUIA-CLOUDFLARE-EMAIL-E-NOTEBOOKLM.md`.
2. **Amazon KDP & NotebookLM:** subir `private-assets/amazon-book/` na KDP e publicar episodios de audio NotebookLM no YouTube Nao Listado ou Cloudflare R2.
3. **Opcional Push OS / CLI:** cadastrar chaves VAPID na Vercel e fazer `stripe switch` caso deseje usar Stripe CLI no terminal local.
