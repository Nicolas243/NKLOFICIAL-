# Registro das areas do Portal NKL

Este arquivo e o guia de manutencao da pagina base `/`.

## Regra obrigatoria

Sempre que uma nova area, produto, curso, idioma, guia ou parceria for criado,
adicionar ou retirar uma entrada do registro central da home. Nao editar a
pagina base com um novo card isolado sem atualizar o registro.

O objetivo e impedir que a home acumule links, titulos e destinos divergentes.

## Quando atualizar

Atualizar este registro ao criar:

- uma nova vertical do Portal NKL;
- um curso ou produto individual;
- um novo idioma;
- uma nova landing page de produto;
- uma pagina de parceiros ou mural;
- uma area que passa de experimental para publicada;
- uma area que deixa de existir ou muda de URL.

## Dados exigidos

- `id`: identificador curto e unico;
- `title`: nome claro;
- `description`: beneficio em uma linha;
- `href`: destino publico;
- `category`: familia visual;
- `status`: `active` ou `coming-soon`;
- `featured`: opcional;
- `label`: opcional.

## Conteudo inicial

- `nkl-cordas`: `/catalogo`;
- `renda-extra`: `/programas`;
- `idiomas`: `/blog/aprender/ingles`;
- `ia-na-pratica`: `/ia`;
- `guia-renda-extra`: `/guias/renda-extra`;
- `mural-parceiros`: `/mural-de-parceiros`.

Cada curso individual, como IA na Pratica ou um guia de idioma, deve ser uma
entrada propria quando o produto tiver uma pagina comercial ou conteudo proprio.

## Dados de parceiros

O mural pode crescer independentemente sem virar uma pagina promocional na home.
Na home, mostrar somente um card editorial de entrada e manter a disponibilidade
real na pagina `/mural-de-parceiros`.

## Checklist para nova area

1. Confirmar que a rota existe e esta publicada.
2. Definir titulo, descricao e categoria.
3. Registrar o card.
4. Testar desktop e mobile.
5. Atualizar sitemap e metadata quando necessario.
6. Verificar acessibilidade e links.
7. Registrar a mudanca no PR da area.
