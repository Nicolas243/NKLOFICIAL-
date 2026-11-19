# Onboarding

## Primeiro dia

1. Instale Node.js compatível com o lockfile e execute `npm install`.
2. Leia [AGENTS.md](../AGENTS.md), [PRODUCT.md](../PRODUCT.md) e [docs/setup.md](./setup.md).
3. Configure `.env.local` a partir do `.env.example` sem copiar valores secretos para commits.
4. Execute `npm run dev`.
5. Abra `/`, `/catalogo`, `/programas` e, para validar compatibilidade histórica, `/blog/renda-extra`.

## Antes de editar

- verifique `git status --short` e preserve alterações existentes;
- encontre a action, schema, rota e componente relacionados;
- defina o comportamento observável e a validação antes da mudança;
- não substitua arquivos gerados pelo Next nem altere o banco sem escopo explícito.

## Entrega local

Use `npm run verify` para lint, tipagem e build. Para mudanças de fluxo crítico, execute também `npm run test:e2e` e registre falhas reais em [docs/quality.md](./quality.md).

## Contas Google e áreas do portal

O retorno do Google leva contas sem `nkl_onboarding_completed` ao onboarding em
`/perfil`. A pessoa escolhe Blog/Renda Extra, Área musical ou Ambos; os campos
de papel (com múltipla escolha), instrumento e experiência só são solicitados
quando a área musical é selecionada. Essa escolha fica no metadata da conta
Supabase e não transforma automaticamente uma pessoa em luthier.

O botão “Sugerir site” abre o formulário externo
`https://forms.gle/2nREXEVdB6JyjtbC8`; a sugestão não é mais enviada pelo
formulário interno do Portal NKL.
