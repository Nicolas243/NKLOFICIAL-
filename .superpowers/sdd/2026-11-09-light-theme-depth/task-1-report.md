# Task 1 Report — Harmonizar fundo e superfícies do tema claro

## Status
Implementação concluída em `src/app/globals.css`, sem alterações em páginas, componentes ou lógica de tema.

## Alterações
- Atualizada a escala clara para um fundo frio e luminoso, superfícies levemente azuladas e bordas com contraste suficiente.
- Adicionadas variáveis de sombra para superfícies e cards; os seletores globais de superfície agora usam essas variáveis.
- Substituídas sombras hard-coded de hover em cards de produtos e cordas por variáveis do tema.
- Adicionadas camadas de gradiente, pontos, linhas e partículas para os parallax de renda e música.
- Mantidas as variáveis escuras e preservado o comportamento de movimento reduzido.

## Validação
- `npm run lint`: PASS (12 warnings preexistentes em `AntigoNKL`, 0 errors).
- `npm run typecheck`: PASS.
- `npm run build`: compilação passou, mas a coleta de dados falhou em `/api/webhooks/gateway` porque as variáveis obrigatórias de ambiente não estão disponíveis neste worktree (`DATABASE_URL`, credenciais Upstash/Mercado Pago/Daily e chaves Supabase). Também foram emitidos os avisos já existentes sobre acesso dinâmico ao filesystem em `src/app/api/downloads/guide/route.ts`.

## Concerns
A validação visual em `/programas` e `/` não foi executada neste ambiente sem servidor/credenciais. O build requer `.env.local` válido para concluir a coleta de páginas da API.

## Fix round 1

Addressed both review findings:
- Musical portal now renders `music-parallax-field`, `music-parallax-notes`, `music-parallax-staves`, and `music-parallax-particles` in `ParallaxBackground`, so the new light-theme layers are active on `/programas`.
- Added a dark-theme-specific `.product-card:hover` rule restoring the approved previous shadow (`rgba(0,0,0,0.05)`); light mode retains the stronger theme variable.

### Fix validation
- `npm run lint`: PASS with 12 pre-existing warnings in `AntigoNKL`, 0 errors.
- `npm run typecheck`: PASS.

## Fix round 2

Addressed final review findings:
- Added dark-theme overrides for all newly introduced income and music parallax depth rules, restoring the approved dark field, dot, glow, particle, and music-layer behavior.
- Removed the music-portal early exit from the parallax effect, assigned refs to all three music layers, and now applies the same scroll transforms and reduced-motion handling to both portals.

### Fix round 2 validation
- `npm run lint`: PASS with 12 pre-existing warnings in `AntigoNKL`, 0 errors.
- `npm run typecheck`: PASS.
