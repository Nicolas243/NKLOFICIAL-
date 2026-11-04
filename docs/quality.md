# Qualidade

## Gates

| Gate | Comando | Critério |
|---|---|---|
| Lint | `npm run lint` | zero erros; warnings existentes devem ser acompanhados |
| Tipagem | `npm run typecheck` | TypeScript sem erros |
| Build | `npm run build` | build de produção concluído |
| E2E | `npm run test:e2e` | fluxos críticos passam ou falhas são atualizadas junto com o produto |
| Verificação combinada | `npm run verify` | lint, tipagem e build em sequência |

## Baseline registrado em 2026-11-04

- Release alvo: `0.2.0`.
- `npx tsc --noEmit`: passou.
- `npm run lint`: passou com 12 warnings preexistentes em `AntigoNKL/`; nenhum erro.
- `npm run build`: passou.
- `npm run test:e2e`: 2 testes passaram depois que os contratos foram alinhados à UI atual.
- `npm audit --omit=dev`: 0 vulnerabilidades.
- `manifest.webmanifest`: rota estática gerada e respondendo localmente com HTTP 200.
- Google Ads e Google Analytics: scripts presentes no layout global.
- `npm audit`: 20 vulnerabilidades moderadas transitivas apenas em dependências de desenvolvimento.
  - O reparo automático disponível exigiria downgrades incompatíveis de `drizzle-kit` e `eslint`.
  - `next` e `eslint-config-next` foram atualizados para `16.4.5`.
- Build local pode registrar falhas de consulta em diretórios sem banco configurado; as páginas mantêm o fallback e o build continua concluindo.

## Interface e acessibilidade

- O corpo base permanece em 16px CSS (com ampliação para 18px em viewports menores), sem depender de texto menor que 16px para conteúdo principal.
- Campos de formulário em telas pequenas usam 16px para evitar zoom automático no iOS e altura mínima de 44px para toque.
- A pizza radial mantém o texto recortado dentro da fatia, usa fundo opaco e move os símbolos musicais lentamente; ao ativar uma fatia, os símbolos podem ultrapassar visualmente a borda sem levar o texto junto.
- `prefers-reduced-motion` desativa a animação dos símbolos e reduz transições globais.
- Foco de teclado usa contorno visível com a cor de destaque.

## Prática de mudança

Para cada alteração, registre a reprodução, o arquivo afetado, a validação focada e o gate geral executado. Não silencie erros, não reduza cobertura para fazer o pipeline passar e não confunda warnings legados com validação completa.
