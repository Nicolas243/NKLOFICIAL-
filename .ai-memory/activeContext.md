# Contexto Ativo (Portal NKL)

## Foco Atual
- **Polimento Final Producao (2026-11-24):**
  - Colisores fantasma internos (`buildGhostObstacleRect` em `fluid-obstacles.ts` + filtro `hasPaintedSurface` e `borderRadius` real em `portal-home-parallax.tsx`), eliminando contornos quadrados e vazamentos fora de circulos/pilulas.
  - Fluido WebGL e Canvas2D com `+30%` de croma (`+32%` preservacao de saturacao no shader + paletas cobalto/esmeralda/indigo/coral), eliminando aspecto cinza de fumaca mantendo contraste dark/light.
  - `/programas` destacando as 55+ formas reais de renda extra e CTA alinhado a Bussola de Negocios.
  - Guia offline completo de cadastro de afiliados e operacao em `docs/CHECKLIST-OFFLINE-NKL.md`.

## Pendencias Somente Manuais do Usuario (Browser / Contas Externas)
1. **Afiliados & Links (`docs/CHECKLIST-OFFLINE-NKL.md`):** abrir contas nos programas prioritarios (Wise, Payoneer, Amazon Associados, ML, Shopee, Magalu, Hotmart, SaaS recorrentes) e colar os codigos em `/admin`.
2. **Cloudflare Email Routing (`@nkloficial.com.br`):** migrar NS no Registro.br preservando Vercel + Resend conforme `docs/GUIA-CLOUDFLARE-EMAIL-E-NOTEBOOKLM.md`.
3. **Amazon KDP & NotebookLM:** subir `private-assets/amazon-book/` na KDP e publicar audios no YouTube Nao Listado ou R2.
