# PRD - Portal NKL como pagina base

## Resumo

Criar uma pagina inicial do Portal NKL que funcione como portal de entrada para
todos os ecossistemas da marca. A home deve apresentar areas, produtos e
oportunidades como cards uniformes, sem depender de um cabeçalho tradicional nem
de uma lista longa de menus.

## Problema

A home atual mistura uma navegacao musical, uma pizza radial, blocos editoriais
e um hero. Isso faz o visitante ter dificuldade para entender que o Portal NKL
e uma plataforma com varias areas distintas.

## Publicos

- musicos e luthiers;
- pessoas procurando renda extra;
- estudantes de idiomas;
- usuarios interessados em IA na Pratica NKL;
- anunciantes e parceiros;
- visitantes sem conta.

## Direcao aprovada

- layout em grade uniforme de cards;
- sem cabeçalho tradicional na pagina inicial;
- parallax fluido e discreto no fundo;
- cards individuais para cursos e produtos individuais;
- navegacao principal feita pelos cards e por um controle compacto opcional;
- primeira dobra responsiva e sem texto excessivo.

## Areas obrigatorias

1. NKL Cordas;
2. Renda Extra;
3. Idiomas;
4. IA na Pratica NKL;
5. Guia de Renda Extra;
6. Cursos disponiveis;
7. Mural de parceiros.

Cada curso ou produto deve aparecer como card proprio. O grupo “Cursos” nao deve
ser uma unica promessa abstrata nem exigir que o visitante entre em uma pagina
de catalogo antes de ver os produtos individuais.

## Criterios de aceite

- **AC-001:** a home identifica visualmente o Portal NKL e apresenta todas as
  areas obrigatorias por card.
- **AC-002:** a home nao usa um cabeçalho tradicional fixo ou estatico.
- **AC-003:** cada card informa titulo, descricao curta e destino claro.
- **AC-004:** todos os cards sao acionaveis por mouse, toque e teclado.
- **AC-005:** o parallax respeita `prefers-reduced-motion` e nunca prejudica
  leitura ou foco.
- **AC-006:** ao criar uma nova area, uma entrada no registro central atualiza
  a home sem exigir duplicacao manual no componente.
- **AC-007:** a home funciona em desktop e mobile, sem overflow horizontal.
- **AC-008:** ofertas e remuneracoes nao sao apresentadas como garantia.

## Fora de escopo desta fase

- migrar ou remover rotas existentes;
- alterar checkout, Stripe, Supabase ou autenticacao;
- remodelar paginas internas;
- criar publicacoes automaticas no mural;
- aposentar a area musical.
