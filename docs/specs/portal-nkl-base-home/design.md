# Design - Home do Portal NKL

## Direcao visual

A home deve parecer uma plataforma editorial multidisciplinar, nao uma vitrine
musical antiga. Recomendacao visual:

- fundo escuro profundo com textura sutil;
- azul petrolado como cor neutra compartilhada;
- laranja `#F97316` como CTA principal;
- verde esmeralda somente para estados ativos ou verificados;
- tipografia Playfair para titulo e identidade, com corpo sans legivel;
- superficies translucidas, bordas finas e cantos entre 16px e 24px.

O parallax deve ser atmosférico: pontos, grades ou particulas em camadas lentas,
nunca figuras grandes competindo com os cards.

## Hero

- titulo curto explicando o ecossistema;
- uma linha de contexto sobre o que o visitante pode fazer;
- sem menu extensivo;
- sem imagem hero obrigatoria;
- uma assinatura visual discreta do Portal NKL.

## Grid

Usar grade uniforme em viewport amplo:

- desktop: 3 ou 4 colunas;
- tablet: 2 colunas;
- mobile: 1 coluna.

Cada card possui:

1. categoria visual;
2. titulo;
3. descricao de uma a duas linhas;
4. destino/CTA;
5. estado opcional: novo, em breve ou ativo;
6. metadado curto quando houver valor real, como “6 idiomas” ou “Aulas praticas”.

Nao usar badge sem significado, e nao misturar monetizacao com classificacao
editorial.

## Cards prioritarios

- NKL Cordas: catalogo, comparador e profissionais;
- Renda Extra: oportunidades, guia e anuncios;
- Idiomas: selecao de idioma e e-books;
- IA na Pratica: diagnostico, modulos individuais e oferta;
- Guia de Renda Extra: compra ou acesso;
- Cursos individuais: cards separados por produto;
- Mural de parceiros: descoberta e apoio publicitario.

## Comportamentos

- todo card inteiro deve ser clicavel;
- controle secundario nao deve anular o clique do card;
- hover funciona apenas como reforco visual;
- foco recebe contorno visivel;
- cards “em breve” nao devem parecer links quebrados;
- links externos usam identificacao adequada e `noopener noreferrer`.
- `prefers-reduced-motion` desativa movimento, mas preserva o fundo estatico.

## Mobile

- sem elementos fixos que escondam conteudo;
- alvo de toque minimo de 44px;
- cards com uma coluna e espaco vertical reduzido;
- parallax leve ou desativado em dispositivos menores.
