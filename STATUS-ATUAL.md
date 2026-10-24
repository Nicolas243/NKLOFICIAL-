# Situação atual do projeto Portal NKL

Atualizado em 23 de outubro de 2026.

## Resumo executivo

O projeto possui duas experiências relacionadas, mas visualmente separadas:

1. **Portal NKL musical**: catálogo, comparadores, luteria, professores, notícias, perfis e recursos para o universo de cordas.
2. **Blog NKL**: área editorial de oportunidades de trabalho, renda extra, freelancing, inteligência artificial, criação de conteúdo e afiliados.

A área do Blog NKL foi isolada visualmente para não herdar a identidade musical do restante do site. A navegação continua integrada ao mesmo projeto Next.js, banco PostgreSQL/Supabase e sistema administrativo.

## Estado técnico geral

- Framework: Next.js `16.3.1` com App Router.
- React: `19.2.8`.
- TypeScript: `5`.
- Estilização: Tailwind CSS `4` e CSS global.
- Banco: PostgreSQL.
- ORM: Drizzle ORM.
- Autenticação: Supabase SSR.
- Validação recente:
  - TypeScript aprovado;
  - ESLint aprovado;
  - Build de produção aprovado;
  - `git diff --check` aprovado.
- Servidor local atualmente iniciado:
  - `http://localhost:3000`
  - Blog NKL: `http://localhost:3000/programas`

## Frente 1 — Portal NKL musical

### Página inicial

A home continua sendo a experiência principal do Portal NKL musical.

Características atuais:

- Menu radial em formato de pizza;
- Fatias interativas;
- Primeiro toque mobile abre a fatia;
- Segundo toque na mesma fatia navega;
- Texto das fatias limitado à geometria de cada setor;
- Símbolos musicais distribuídos dentro das fatias;
- Texto central dividido em linhas;
- Animação de entrada da pizza surgindo do centro e girando;
- Pizza reposicionada aproximadamente `10vh` para cima;
- Antiga cortina de entrada deixou de ser renderizada.

Arquivos principais:

- [`src/app/page.tsx`](./src/app/page.tsx)
- [`src/components/radial-menu.tsx`](./src/components/radial-menu.tsx)
- [`src/app/globals.css`](./src/app/globals.css)
- [`src/components/curtain-intro.tsx`](./src/components/curtain-intro.tsx)

### Tipografia do menu radial

As regras atuais do menu radial foram recalibradas para evitar o overflow mobile:

```css
.radial-menu-label {
  font-size: clamp(13.07px, 1.67vw, 18.88px);
}

.radial-menu-description {
  font-size: clamp(11.62px, 1.45vw, 17.42px);
}

.radial-menu-center-line {
  font-size: clamp(20.8px, 3.25vw, 31.2px);
}
```

Quebra de texto:

- Títulos: até 15 caracteres por linha;
- Descrições: até 18 caracteres por linha;
- Mobile usa recorte individual por fatia;
- Desktop mantém a composição original.

### Cabeçalho musical

O cabeçalho tradicional continua sendo usado nas rotas do Portal NKL musical.

Características:

- Logo NKL;
- Navegação para catálogo, luteria, notícias e diretórios;
- Controle de tema;
- Menu mobile;
- Autenticação/perfil;
- Fundo branco no tema claro;
- Fundo preto no tema escuro.

Arquivo principal:

- [`src/components/header.tsx`](./src/components/header.tsx)

### Parallax musical

Nas rotas musicais, o parallax ainda utiliza a linguagem original:

- Nomes de luthiers;
- Símbolos musicais;
- Movimento automático;
- Movimento por mouse;
- Influência do scroll;
- Repetição em malha 3×3;
- Camada de fundo abaixo do conteúdo.

Arquivo:

- [`src/components/parallax-background.tsx`](./src/components/parallax-background.tsx)

### Recursos musicais existentes

Rotas e áreas preservadas:

- `/catalogo`
- `/comparar`
- `/guia-de-cordas`
- `/clinica`
- `/fisica-do-som`
- `/luthiers`
- `/professores`
- `/recomendados`
- `/lojas`
- `/noticias`
- `/meu-setup`
- `/perfil`
- `/dashboard/luthier`
- `/contatos`

## Frente 2 — Blog NKL

### Rota pública

A rota principal do Blog NKL é:

- `/programas`

Arquivo:

- [`src/app/programas/page.tsx`](./src/app/programas/page.tsx)

O cartão de renda extra continua sendo o quarto item da lista de contatos, mas agora aponta para `/programas`.

Arquivo:

- [`src/app/contatos/page.tsx`](./src/app/contatos/page.tsx)

A rota antiga continua funcionando como redirecionamento:

- `/contatos/ganhar-dinheiro` → `/programas`

Arquivo:

- [`src/app/contatos/ganhar-dinheiro/page.tsx`](./src/app/contatos/ganhar-dinheiro/page.tsx)

### Identidade visual do Blog

O Blog NKL possui uma identidade separada do Portal musical:

- Nome visual: Blog NKL;
- Logo oficial `NKL.png`;
- Subtítulo: “Seu blog de confiança sobre tudo o que você precisa”;
- Navegação centralizada;
- Cabeçalho preto absoluto no tema escuro;
- Cabeçalho branco absoluto no tema claro;
- Conteúdo em primeiro plano;
- Botão de entrada preservado, mas invisível por enquanto;
- WhatsApp preservado no componente global, mas invisível nas rotas do Blog.

Arquivo:

- [`src/components/header.tsx`](./src/components/header.tsx)

### Parallax do Blog

O parallax é alterado dinamicamente quando a rota começa com `/programas`.

No Blog, utiliza palavras editoriais como:

- `IDEIAS`;
- `RENDA`;
- `TRABALHO`;
- `REMOTO`;
- `PORTFÓLIO`;
- `PROJETOS`;
- `CRIADORES`;
- `FREELANCE`;
- `APRENDIZADO`;
- `OPORTUNIDADE`;
- `DIGITAL`;
- `NKL`.

Tema claro:

- Fundo branco;
- Marcas em cinza escuro com baixa opacidade;
- Contraste discreto, mas perceptível.

Tema escuro:

- Fundo preto;
- Marcas em cinza claro com baixa opacidade.

Arquivo:

- [`src/components/parallax-background.tsx`](./src/components/parallax-background.tsx)

### Catálogo de oportunidades

O catálogo possui:

- Pesquisa por nome, categoria ou tag;
- Filtro por categoria;
- Filtro por dificuldade;
- Ordenação por relevância, nota ou nome;
- Cards responsivos;
- Descrição curta;
- Descrição detalhada;
- Tags editoriais;
- Dificuldade:
  - Fácil;
  - Médio;
  - Difícil;
- Nota editorial;
- Nota da comunidade;
- Link para a plataforma;
- Modal de detalhes;
- Formulário de avaliação;
- Formulário para sugerir novas oportunidades.

Componente principal:

- [`src/components/partner-programs-browser.tsx`](./src/components/partner-programs-browser.tsx)

### Programas cadastrados

O catálogo inicial contém:

- Outlier AI;
- uTest;
- DataAnnotation;
- OneForma;
- Clickworker;
- Billo;
- JoinBrands;
- Alignerr;
- Amazon Influencer;
- Shopee, Mercado Livre, Shein e AliExpress como grupo de marketplaces;
- Upwork;
- Testlio;
- Hotmart;
- SideShift;
- Crowdato;
- Hub;
- Claru IA;
- Flambra;
- Fiverr.

Os programas sem link de afiliado são identificados no painel administrativo.

### Textos detalhados

Os textos de “Ler mais e avaliar” foram ampliados e persistidos em migração própria.

Incluem:

- Explicação do tipo de trabalho;
- Critérios de entrada;
- Oscilação de disponibilidade;
- Requisitos;
- Cuidados com pagamentos;
- Observações sobre taxas;
- Riscos e limitações;
- Orientações específicas da uTest.

Na uTest, a orientação registrada informa que, quando o formulário disponibilizar campo de indicação, o usuário pode informar:

- Nome: Nicolas da Costa Santos;
- Código: `2525825`.

Migração:

- [`drizzle/0009_partner_program_details.sql`](./drizzle/0009_partner_program_details.sql)

## Avaliações da comunidade

### Regras atuais

- Nota de `0` a `10`;
- Motivo obrigatório com pelo menos 20 palavras;
- Avaliação anônima para o público;
- Identificador técnico protegido por cookie;
- Uma avaliação por visitante e programa;
- Atualização da própria avaliação permitida;
- Tags selecionáveis:
  - Fácil;
  - Médio;
  - Difícil;
  - Boa remuneração;
  - Flexível;
  - Exige experiência.

### Cálculo da nota

Antes de existirem avaliações da comunidade:

- A nota exibida é a nota editorial.

Depois que a comunidade avalia:

- A nota final é a média entre a nota editorial e a média da comunidade.

Após cinco avaliações:

- As tags exibidas passam a ser somente as tags fornecidas pelos usuários;
- Antes de cinco avaliações, aparecem as tags editoriais.

Implementação:

- [`src/actions/partner-programs.ts`](./src/actions/partner-programs.ts)

## Sugestões de novos sites

O Blog possui formulário público para sugerir novas oportunidades.

O visitante pode informar:

- Nome do serviço;
- Link;
- Justificativa.

A sugestão exige uma justificativa mínima e fica pendente para análise administrativa.

## Área administrativa

### Rotas

- `/admin`: painel administrativo geral;
- `/programas/admin`: gestão exclusiva do catálogo.

Arquivos:

- [`src/app/admin/page.tsx`](./src/app/admin/page.tsx)
- [`src/app/programas/admin/page.tsx`](./src/app/programas/admin/page.tsx)

### Recursos administrativos

- Ver todos os programas;
- Identificar programas sem link de afiliado;
- Cadastrar ou alterar link de afiliado;
- Alterar nota editorial;
- Publicar ou colocar programa em rascunho;
- Ver quantidade de avaliações;
- Ver sugestões pendentes;
- Marcar sugestão como analisada;
- Arquivar sugestão.

### Proteção

A rota `/programas/admin` exige sessão autenticada e validação do papel `admin`.

Arquivo:

- [`src/proxy.ts`](./src/proxy.ts)

As actions administrativas também fazem validação própria no servidor.

## Banco de dados

Novas tabelas:

### `partner_programs`

Armazena:

- Nome;
- Slug;
- Descrição curta;
- Descrição detalhada;
- Categoria;
- Dificuldade;
- Tags;
- Site oficial;
- Link de afiliado;
- Nota editorial;
- Fonte da nota;
- Status;
- Datas de criação e atualização.

### `partner_program_reviews`

Armazena:

- Programa;
- Hash do identificador técnico;
- Nota;
- Motivo;
- Tags da avaliação;
- Status;
- Data.

### `partner_suggestions`

Armazena:

- Nome sugerido;
- Link;
- Justificativa;
- Status;
- Data.

Schema:

- [`src/db/schema.ts`](./src/db/schema.ts)

Migração inicial:

- [`drizzle/0008_partner_programs.sql`](./drizzle/0008_partner_programs.sql)

Migração dos textos:

- [`drizzle/0009_partner_program_details.sql`](./drizzle/0009_partner_program_details.sql)

## Tema claro e tema escuro

### Portal musical

- Claro: fundo claro e elementos escuros;
- Escuro: fundo quase preto e elementos claros;
- Parallax musical permanece com símbolos e nomes de luthiers.

### Blog NKL

- Claro: cabeçalho branco, fundo branco e parallax cinza escuro suave;
- Escuro: cabeçalho preto, fundo preto e parallax cinza claro suave;
- A navegação e os controles respeitam o tema;
- O conteúdo principal permanece acima do parallax.

## Desktop e mobile

### Desktop

- Navegação do Blog centralizada;
- Cards em três colunas quando há largura suficiente;
- Filtros organizados em uma linha;
- Modal de detalhes com largura confortável;
- Parallax em malha ampla;
- Cabeçalho fixo nas larguras maiores.

### Mobile

- Menu próprio do Blog NKL;
- Navegação em coluna quando aberta;
- Cards em uma coluna;
- Filtros empilhados;
- Modal com rolagem interna;
- Botões e tags com quebra de linha;
- WhatsApp oculto no Blog;
- Botão de entrada oculto no Blog;
- Cabeçalho continua com fundo totalmente opaco.

## Arquivos ainda não commitados

No momento deste documento, o worktree possui alterações pendentes relacionadas principalmente ao Blog NKL:

- [`src/app/admin/page.tsx`](./src/app/admin/page.tsx)
- [`src/app/contatos/ganhar-dinheiro/page.tsx`](./src/app/contatos/ganhar-dinheiro/page.tsx)
- [`src/app/contatos/page.tsx`](./src/app/contatos/page.tsx)
- [`src/app/sitemap.ts`](./src/app/sitemap.ts)
- [`src/components/footer.tsx`](./src/components/footer.tsx)
- [`src/components/header.tsx`](./src/components/header.tsx)
- [`src/components/parallax-background.tsx`](./src/components/parallax-background.tsx)
- [`src/db/schema.ts`](./src/db/schema.ts)
- [`src/proxy.ts`](./src/proxy.ts)
- [`drizzle/0008_partner_programs.sql`](./drizzle/0008_partner_programs.sql)
- [`drizzle/0009_partner_program_details.sql`](./drizzle/0009_partner_program_details.sql)
- [`src/actions/partner-programs.ts`](./src/actions/partner-programs.ts)
- [`src/app/programas/`](./src/app/programas/)
- [`src/components/partner-programs-browser.tsx`](./src/components/partner-programs-browser.tsx)

O último commit registrado antes dessas alterações foi:

```text
0b50a5f fix(home): reposicionar pizza e ordenar gateway de contatos
```

## Commits relevantes anteriores

```text
bfaf286 feat(home): substituir cortina por entrada giratoria da pizza
d753050 feat: adicionar subpagina de programas de afiliados e renda extra no diretorio de contatos
1f74f4a fix(ui): recalibrar escala tipografica vetorial do radial menu eliminando overflow mobile
31a0008 fix(radial): aumentar fontes da pizza em vinte por cento
a8f0391 fix(mobile): ampliar fonte e quebrar texto radial em linhas
aab19c7 fix(mobile): organizar texto central dentro do circulo radial
68439cd fix(mobile): conter textos dentro das fatias do menu radial
```

## Pendências recomendadas

### Alta prioridade

1. Revisar visualmente o Blog NKL nos temas claro e escuro em desktop e mobile.
2. Confirmar se os links oficiais de Crowdato, Hub, Claru IA e Flambra estão corretos.
3. Adicionar links de afiliado reais no painel administrativo.
4. Aplicar a migração em produção antes do deploy da nova área.
5. Criar rate limiting específico para avaliações anônimas e sugestões.

### Média prioridade

1. Adicionar estado visual de sucesso e erro nos formulários server actions.
2. Criar página de privacidade específica para avaliações anônimas.
3. Adicionar moderação de avaliações no painel.
4. Permitir ao admin editar descrições, tags e categorias sem alterar migrações.
5. Adicionar paginação quando o catálogo crescer.

### Baixa prioridade

1. Remover fisicamente [`src/components/curtain-intro.tsx`](./src/components/curtain-intro.tsx) caso a decisão de abandonar a cortina seja definitiva.
2. Criar imagens ou capas próprias para os cards.
3. Adicionar métricas de cliques por programa.
4. Criar páginas individuais indexáveis para cada oportunidade.
5. Adicionar internacionalização real ao Blog.

## Conclusão

O projeto já possui uma base funcional para operar como dois produtos relacionados:

- O Portal NKL musical preserva o catálogo e as ferramentas de cordas;
- O Blog NKL possui uma área própria para oportunidades e renda;
- O catálogo público, avaliações, tags, sugestões e painel administrativo já estão implementados;
- O cabeçalho e o parallax do Blog estão isolados da identidade musical;
- A base passou pelas validações de TypeScript, ESLint e build;
- O próximo passo técnico mais importante é revisar os dados dos programas, aplicar as migrações no ambiente de produção e criar moderação/rate limiting para a participação pública.
