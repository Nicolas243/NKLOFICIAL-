# Spec - Comportamentos da pagina base

## Estado e registro

```ts
type PortalAreaStatus = 'active' | 'coming-soon';

type PortalAreaCard = {
  id: string;
  title: string;
  description: string;
  href: string;
  category: 'music' | 'income' | 'languages' | 'learning' | 'partners';
  status: PortalAreaStatus;
  featured?: boolean;
  label?: string;
};
```

O registro central deve exportar uma lista tipada de cards e uma funcao de
renderizacao que ignora entradas invalidas ou inativas, conforme a regra editorial
aprovada.

## Regras

### AC-001

A home renderiza cards para todas as areas obrigatorias.

Testes:

- existem cards com `href=/catalogo`, `/programas`, `/blog/aprender/ingles`,
  `/ia`, `/guias/renda-extra` e `/mural-de-parceiros`;
- cursos individuais sao representados por entradas distintas;
- nenhum nome de area ausente produz card vazio.

### AC-002

Nenhum `<header>` ou menu fixo tradicional sera renderizado na home.

O controle compacto para conta pode existir como popup ou menu discreto, mas nao
como cabeçalho global com grupos longos.

### AC-003

Cada card exibido possui titulo, descricao e link.

Testes:

- texto vazio nao passa na validacao do registro;
- `href` deve ser relativo interno ou URL externa permitida;
- status `coming-soon` nao aponta para rota quebrada.

### AC-004

Cada card possui semantica adequada.

Opcoes:

- `<article><Link>` para um card inteiro;
- ou um unico `<a>` no estado do card.

O link nao pode conter botoes ou links aninhados.

Testes:

- navega por Enter;
- foco tem outline visivel;
- mobile permite toque sem overflow.

### AC-005

O parallax usa uma implementacao CSS ou requestAnimationFrame controlada.

Testes:

- `matchMedia('(prefers-reduced-motion: reduce)').matches` impede transformacoes;
- parallax nao cria `overflow-x`;
- movimento nao altera o foco ou a ordem de leitura.

### AC-006

Ao adicionar uma area:

1. criar ou confirmar a rota;
2. adicionar uma entrada ao registro central;
3. adicionar o conteudo editorial necessario;
4. executar teste e build;
5. atualizar sitemap/SEO quando aplicavel;
6. atualizar este documento se houver novo tipo de card.

### AC-007

A home renderiza estados vazios sem quebrar o layout.

- registro vazio: mostra uma mensagem segura de curadoria;
- rota ainda em construcao: card `coming-soon`;
- falha de dados opcionais: nao impede a renderizacao estatica.

### AC-008

Nao mostrar remuneracao fixa ou promessa garantida.

Verbosidade curta em todos os cards: beneficio observavel, nao promessa.
