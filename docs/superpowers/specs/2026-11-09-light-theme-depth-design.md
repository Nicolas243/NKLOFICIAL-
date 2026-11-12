# Profundidade do tema claro

## Intenção

Fazer o tema claro compartilhar a mesma identidade visual do tema escuro: fundo
com profundidade, gradiente, parallax e uma separação clara entre fundo e cards.

## Escopo

- Adicionar ao fundo claro a composição já usada no portal: base, gradientes
  radiais, linhas/partículas e textura sutil.
- Dar aos cards claros uma superfície própria, borda perceptível e sombra
  discreta.
- Preservar o visual, o conteúdo e o comportamento atuais do tema escuro.
- Centralizar a mudança nas variáveis e regras globais de
  `src/app/globals.css`; não duplicar estilos nas páginas.

## Abordagem

Foram consideradas uma harmonização conservadora e um espelhamento forte da
paleta escura. A harmonização foi escolhida: mantém o claro luminoso e legível,
mas recupera a profundidade e o contraste estrutural que faltam hoje. O
parallax existente em `src/components/parallax-background.tsx` será reutilizado
sem alterar sua lógica.

## Critérios de sucesso

- O fundo claro apresenta gradiente e camadas visíveis, porém suaves.
- Cards claros não se confundem com o fundo em desktop nem mobile.
- O tema escuro permanece visualmente inalterado.
- Lint, typecheck e build continuam passando.
