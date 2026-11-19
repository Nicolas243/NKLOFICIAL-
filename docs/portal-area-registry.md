# Registro das areas do Portal NKL

Este arquivo e o guia de manutencao da pagina base `/`.

## Regra obrigatoria

Sempre que uma nova area, produto, curso, idioma, guia ou parceria for criado,
adicionar ou retirar uma entrada do registro central da home (`src/lib/portal-areas.ts`).
Nao editar a pagina base com um novo card isolado sem atualizar o registro.

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
- `description`: beneficio observavel em uma a duas linhas (sem promessa de ganho fixo);
- `href`: destino publico interno (`/rota`) ou URL `https://` permitida;
- `category`: familia visual (`music`, `income`, `languages`, `learning`, `partners`);
- `status`: `active` ou `coming-soon`;
- `featured`: opcional (destaca os ecossistemas principais no topo da home);
- `label`: opcional (texto curto de CTA para cards ativos);
- `meta`: opcional (metadado curto com valor real, como `6 idiomas`).

## Conteudo registrado atualmente

### Ecossistemas principais (`featured: true`)

- `nkl-cordas`: `/musica/naipe_cordas` (`active`);
- `renda-extra`: `/programas` (`active`);
- `idiomas`: `/blog/aprender/ingles` (`active`, `meta: '6 idiomas'`);
- `ia-na-pratica`: `/ia` (`active`).

### Guias, cursos, diagnosticos, idiomas e parcerias

- `guia-renda-extra`: `/guias/renda-extra` (`active`);
- `quiz-negocios`: `/quiz-negocios` (`active`);
- `curso-ia`: `/ia/oferta` (`active`);
- `ingles`: `/guias/ingles` (`active`);
- `italiano`: `/guias/italiano` (`coming-soon`);
- `frances`: `/guias/frances` (`coming-soon`);
- `alemao`: `/guias/alemao` (`coming-soon`);
- `espanhol`: `/guias/espanhol` (`coming-soon`);
- `mandarim`: `/guias/chines` (`coming-soon`);
- `mural-parceiros`: `/mural-de-parceiros` (`active`);
- `anuncie`: `/programas/anuncie` (`active`).

Cada curso individual, como IA na Pratica ou um guia de idioma, deve ser uma
entrada propria quando o produto tiver uma pagina comercial ou conteudo proprio.
Enquanto um e-book ou curso estiver em producao editorial, manter `status: 'coming-soon'`
para que o card na home exiba claramente o estado "Em breve" sem link quebrado.

## Dados de parceiros

O mural pode crescer independentemente sem virar uma pagina promocional na home.
Na home, manter a apresentacao editorial em `mural-parceiros` (`/mural-de-parceiros`)
e a entrada institucional de formatos em `anuncie` (`/programas/anuncie`).

## Checklist para nova area

1. Confirmar que a rota existe e esta publicada.
2. Definir titulo, descricao e categoria.
3. Registrar o card em `src/lib/portal-areas.ts`.
4. Executar `npx tsx --test src/lib/__tests__/portal-areas.test.ts`.
5. Testar desktop e mobile (incluindo 390px sem overflow horizontal).
6. Atualizar sitemap e metadata quando necessario.
7. Verificar acessibilidade, foco por teclado e links.
8. Registrar a mudanca no PR da area.
