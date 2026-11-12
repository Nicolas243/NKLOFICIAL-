# Design: SEO técnico e arquitetura editorial de renda extra

## Intenção

Aumentar a capacidade do Portal NKL de aparecer em buscas relevantes, especialmente
consultas sobre renda extra, sem prometer posição específica nem criar conteúdo
genérico. O foco inicial é transformar sinais técnicos inconsistentes em uma base
confiável e organizar o conteúdo existente para atender intenções de busca reais.

## Objetivos

- Usar `https://nkloficial.com.br` como domínio canônico em metadata, sitemap,
  robots, Open Graph e JSON-LD.
- Garantir que páginas públicas relevantes sejam descobertas e que áreas privadas
  não sejam indexadas.
- Melhorar títulos, descrições, canonical e dados estruturados das páginas públicas
  de renda extra.
- Criar hubs editoriais específicos somente quando houver conteúdo útil e
  sustentação no catálogo atual.
- Reforçar links internos entre hubs, catálogo e páginas individuais.

## Fora do escopo

- Garantir primeiro lugar ou ranquear para “qualquer assunto”.
- Comprar links, publicar páginas doorway, repetir palavras-chave ou criar
  conteúdo sem valor.
- Alterar banco de dados, dados de produção, campanhas de anúncios ou infraestrutura.
- Fazer deploy ou solicitar indexação externa sem aprovação explícita.

## Restrições e anti-objetivos

- Preservar Next.js 16, App Router, Supabase, Drizzle e Tailwind.
- Não divulgar segredos nem depender de valores de `.env.local` no código.
- Não afirmar remuneração, disponibilidade ou aprovação de plataformas como garantia.
- Evitar canibalização entre `/programas`, `/blog/renda-extra` e novos hubs.

## Abordagens consideradas

1. **Somente SEO técnico:** menor risco e implementação rápida, mas não cobre
   suficientemente as diferentes intenções de busca.
2. **SEO técnico + arquitetura editorial:** escolhido. Corrige a base e cria
   caminhos de conteúdo específicos, aproveitando dados reais e links internos.
3. **Cobertura genérica de qualquer assunto:** rejeitada por gerar conteúdo fraco,
   diluir relevância e aumentar risco de páginas pouco úteis.

## Design escolhido

### Base técnica

- Centralizar a URL oficial em um helper/configuração única com fallback para
  `https://nkloficial.com.br`, mantendo `NEXT_PUBLIC_SITE_URL` como override
  controlado em previews e ambientes locais.
- Aplicar a mesma base ao `metadataBase`, canonical, Open Graph, Twitter, JSON-LD,
  `sitemap.xml` e `robots.txt`.
- Revisar a lista do sitemap para incluir somente rotas públicas canônicas e
  atualizar `lastModified` com datas reais quando disponíveis.
- Definir metadata específica para home, catálogo e hubs de renda extra, incluindo
  `robots` quando necessário.

### Arquitetura editorial

- Manter `/programas` como página principal do catálogo.
- Manter `/blog/renda-extra` acessível como alias com canonical para `/programas`;
  a rota continua podendo aparecer como página pública legada, mas não será
  tratada como hub editorial independente.
- Manter as páginas públicas atuais no conjunto indexável quando tiverem conteúdo
  próprio, incluindo `/blog/renda-extra` e `/guias/renda-extra`; aliases e páginas
  sem conteúdo original não devem ganhar novas cópias no sitemap.
- Criar hubs orientados a intenção apenas para temas suportados pelos dados atuais,
  como renda extra pelo celular, renda extra sem investimento, trabalho remoto e
  pesquisas remuneradas.
- Cada hub deve ter introdução original, critérios de decisão, links para programas
  relacionados, aviso editorial e canonical próprio.
- Os hubs devem ser ligados a partir do catálogo e entre si de forma contextual.

### Dados estruturados

- Preservar `ItemList` no catálogo e `WebPage`/`BreadcrumbList` nas páginas
  individuais, corrigindo URLs absolutas quando necessário.
- Adicionar `WebSite` com `SearchAction` somente se a busca pública real suportar
  uma URL estável; caso contrário, não declarar uma ação inexistente.

## Validação

- Verificar HTML/metadata, canonical, `robots.txt` e `sitemap.xml` localmente.
- Rodar `npm run lint`, `npm run typecheck` e `npm run build`.
- Executar E2E se o fluxo de navegação ou páginas críticas for alterado.
- Após aprovação e deploy autorizado, acompanhar impressões, consultas e páginas
  indexadas no Google Search Console; resultados orgânicos não são imediatos.

## Decisões restantes para o implementador

- Reutilizar componentes e helpers existentes quando possível.
- Escolher a menor quantidade de novos hubs que cubra as intenções sustentadas pelos
  dados atuais.
- Não criar hub cujo conteúdo não possa ser preenchido com informação original e
  verificável.
