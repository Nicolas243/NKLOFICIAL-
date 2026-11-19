# Tasks - Implementacao da pagina base

Cada item somente inicia apos aprovacao da especificacao.

- [x] **T-001 / AC-001 e AC-002:** criar o registro central
      `src/lib/portal-areas.ts` com as areas obrigatorias.
- [x] **T-002 / AC-003 e AC-004:** criar o grid tipado
      `src/components/portal-home-grid.tsx`.
- [x] **T-003 / AC-004:** tornar todos os cards navegaveis por teclado e toque.
- [x] **T-004 / AC-005:** criar ou adaptar o fundo parallax da home com
      `prefers-reduced-motion`.
- [x] **T-005 / AC-001:** substituir a pizza, o hero atual e os blocos musicais
      da `/` pela nova composicao base (movendo a home musical para `/musica/naipe_cordas`).
- [x] **T-006 / AC-006:** adicionar
      `docs/portal-area-registry.md` e atualizar `AGENTS.md`.
- [x] **T-007 / AC-007:** criar estados vazios e de "em breve".
- [x] **T-008 / AC-008:** revisar todos os textos contra promessas de resultado.
- [x] **T-009:** adicionar teste unitario do registro (`src/lib/__tests__/portal-areas.test.ts`).
- [x] **T-010:** adicionar teste E2E de navegacao desktop/mobile (`e2e/portal-home.spec.ts`).
- [x] **T-011:** validar SEO, sitemap, imagem, loading e no-JS.
- [x] **T-012:** executar lint, typecheck, build e suite E2E direcionada.
- [ ] **T-013:** revisar visualmente antes de qualquer upload/deploy.

## Dependencias

- T-002 depende de T-001;
- T-003 depende de T-002;
- T-004 pode ser independente;
- T-005 depende de T-002 e T-004;
- T-009 depende de T-001;
- T-010 depende de T-003 e T-005;
- T-011 depende de T-005;
- T-012 depende de todos os itens anteriores;
- T-013 depende de T-012.
