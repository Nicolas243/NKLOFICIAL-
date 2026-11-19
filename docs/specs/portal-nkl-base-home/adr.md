# ADR - Arquitetura da pagina base

## Decisao

A nova `/` sera um orquestrador visual leve baseado em um registro central de
areas do portal. O registro sera a unica fonte para titulos, descricoes,
categorias, rotas, identidade visual e status dos cards exibidos na home.

## Contexto

O Portal NKL possui superficies independentes em musica, renda extra, idiomas,
IA e publicidade. Componentes literais na home podem ficar desatualizados
quando uma nova rota ou produto for criado.

## Opcoes consideradas

1. **Cards hardcoded na pagina:** simples no primeiro momento, mas propenso a
   divergencia e novas edicoes manuais.
2. **Cards consultados dinamicamente pelo banco:** maior flexibilidade, mas
   exige migracao, estados administrativos e estrategia de fallback para paginas
   publicas.
3. **Registro TypeScript versionado:** previsivel, tipado, revisavel em PR,
   rapido em pagina estatica e suficiente para a fase atual.

O registro TypeScript foi escolhido.

## Estrutura

- `src/lib/portal-areas.ts`: tipos e dados das areas;
- `src/components/portal-home-grid.tsx`: renderizacao dos cards;
- `src/app/page.tsx`: SEO e composicao da pagina;
- `docs/portal-area-registry.md`: instrucoes para humanos e IAs;
- `AGENTS.md`: lembrar de atualizar o registro quando houver nova area.

## Consequencias

### Positivas

- novas areas usam um contrato tipado;
- cards e destinos nao ficam duplicados;
- a home pode ter fallback seguro;
- a pagina permanece simples de testar.

### Cuidados

- o registro nao substitui navegacao interna das areas;
- o registro nao controla cadastro de oportunidades ou anuncios dinamicos;
- novos cards devem passar por revisao editorial;
- status `coming-soon` precisa ter comportamento claro e acessivel.
