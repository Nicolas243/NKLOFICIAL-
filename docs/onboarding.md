# Onboarding

## Primeiro dia

1. Instale Node.js compatível com o lockfile e execute `npm install`.
2. Leia [AGENTS.md](../AGENTS.md), [PRODUCT.md](../PRODUCT.md) e [docs/setup.md](./setup.md).
3. Configure `.env.local` a partir do `.env.example` sem copiar valores secretos para commits.
4. Execute `npm run dev`.
5. Abra `/`, `/catalogo`, `/programas` e `/blog/renda-extra`.

## Antes de editar

- verifique `git status --short` e preserve alterações existentes;
- encontre a action, schema, rota e componente relacionados;
- defina o comportamento observável e a validação antes da mudança;
- não substitua arquivos gerados pelo Next nem altere o banco sem escopo explícito.

## Entrega local

Use `npm run verify` para lint, tipagem e build. Para mudanças de fluxo crítico, execute também `npm run test:e2e` e registre falhas reais em [docs/quality.md](./quality.md).
