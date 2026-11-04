# Situação atual do blog

**Projeto:** Portal NKL  
**Data da análise:** 31 de outubro de 2026  
**Escopo:** mural de notícias e área editorial de programas de parceria e renda extra

## Resumo executivo

O Portal NKL já possui duas frentes editoriais funcionais:

1. **Mural de Notícias e Eventos**, com publicação autenticada, sugestões públicas, imagens, curtidas e comentários.
2. **Programas de Parceria e Renda Extra**, com catálogo pesquisável de oportunidades, filtros, avaliações anônimas e links externos rastreáveis.

A base técnica está funcional, mas a área de renda extra ainda funciona mais como um catálogo de oportunidades do que como um blog editorial completo. O principal próximo passo é transformar cada oportunidade em um conteúdo aprofundado, permanente e indexável, com informações práticas, critérios de confiança e transparência sobre links afiliados.

## 1. Mural de Notícias e Eventos

### Implementado

- Rota pública em `/noticias`.
- Feed ordenado pelas publicações mais recentes.
- Exibição de título, conteúdo, tags, imagem, autoria e data.
- Publicação disponível para usuários autenticados.
- Upload de imagens para o Storage do Supabase.
- Conversão e redução das imagens para WebP usando `sharp`.
- Sugestão pública de notícias para visitantes não autenticados.
- Curtidas para usuários autenticados.
- Comentários para usuários autenticados.
- Contagem agregada de curtidas por notícia.
- Revalidação da rota após publicação, comentário ou curtida.
- Sanitização básica de conteúdo textual antes da gravação.

### Estrutura de dados

As tabelas principais estão definidas em `src/db/schema.ts`:

- `news_feed`: conteúdo editorial, imagem, tags, autoria e data.
- `news_comments`: comentários associados a usuários e notícias.
- `news_likes`: curtidas únicas por usuário e notícia.
- `news_suggestions`: sugestões enviadas pela comunidade.

### Limitações atuais

- O mural não possui páginas individuais para cada notícia.
- As notícias não têm slug, resumo, categoria editorial ou data de atualização.
- Não há metadata específica por publicação.
- Não há JSON-LD de artigo ou breadcrumb.
- O feed renderiza apenas as cinco primeiras notícias.
- Não há busca, filtros ou paginação no mural.
- Não há fluxo editorial completo visível para revisar, editar, arquivar ou remover notícias.
- A publicação exige autenticação, mas o modelo editorial não diferencia claramente autor, editor e administrador.
- Comentários não apresentam uma camada específica de moderação ou denúncia.
- A descrição da notícia é exibida diretamente como texto corrido, sem estrutura de artigo, subtítulos ou links editoriais.

## 2. Página de Programas e Renda Extra

### Implementado

- Rota pública em `/programas`.
- Metadata básica com título e descrição.
- Catálogo de oportunidades publicado.
- Busca por nome, categoria, descrição e tags.
- Filtro por categoria.
- Filtro por dificuldade.
- Ordenação por relevância, nota ou nome.
- Paginação com nove programas por página.
- Modal com detalhes da oportunidade.
- Exibição de nota editorial e nota da comunidade.
- Avaliações anônimas por identificador técnico protegido em cookie.
- Limitação de uma avaliação por programa e identificador.
- Tags baseadas na experiência da comunidade após volume mínimo de avaliações.
- Rate limit para avaliações e sugestões.
- Formulário público para sugerir novas oportunidades.
- Área administrativa para programas, sugestões e contagem de avaliações.
- Links externos com componente de rastreamento.
- Extração e cópia de códigos de indicação quando presentes na descrição.

### Estrutura de dados

As tabelas da área de renda extra estão definidas em `src/db/schema.ts`:

- `partner_programs`: catálogo, descrições, categoria, dificuldade, tags, notas, links e status.
- `partner_program_reviews`: avaliações anônimas, nota, justificativa, tags e status.
- `partner_suggestions`: sugestões enviadas pelos visitantes.

As principais regras de negócio estão em `src/actions/partner-programs.ts`:

- Apenas programas publicados aparecem no catálogo público.
- A nota da comunidade é calculada a partir das avaliações publicadas.
- A nota final combina a nota editorial com a nota da comunidade.
- A experiência da comunidade influencia as tags exibidas depois de cinco avaliações.
- Avaliações exigem justificativa com quantidade mínima de palavras.
- Sugestões são encaminhadas para análise administrativa.

## 3. O que falta na área de renda extra

### Conteúdo editorial

- Texto introdutório mais completo sobre renda extra, expectativas e riscos.
- Guias para iniciantes.
- Comparativos entre categorias de oportunidade.
- Conteúdos específicos para músicos e profissionais criativos.
- Orientação sobre tempo disponível, habilidades e investimento inicial.
- Conteúdo sobre golpes, taxas, saques e promessas irreais.

### Páginas indexáveis

O modal atual é adequado para consulta rápida, mas não substitui páginas permanentes. Deve ser criada uma rota como:

```text
/programas/[slug]
```

Cada página individual deve conter:

- título e descrição próprios;
- URL canônica;
- resumo da oportunidade;
- requisitos;
- forma de pagamento;
- países e idiomas aceitos;
- faixa de ganhos ou observação de que não há garantia;
- tempo estimado até o primeiro pagamento;
- pontos positivos e limitações;
- riscos;
- data da última verificação;
- nota editorial e avaliações da comunidade;
- aviso de link afiliado;
- chamada para acessar a plataforma.

### Transparência e confiança

É necessário informar de forma visível que alguns links podem gerar comissão para o Portal NKL sem custo adicional para o visitante. Também deve existir uma metodologia editorial explicando:

- como as oportunidades são selecionadas;
- como as notas editoriais são atribuídas;
- como os links são verificados;
- como reclamações são analisadas;
- quando uma oportunidade pode ser removida;
- como avaliações suspeitas são tratadas.

### SEO e distribuição

Ainda faltam:

- JSON-LD para `CollectionPage`, `ItemList` e páginas individuais;
- breadcrumbs;
- Open Graph específico;
- imagem social da área de renda extra;
- sitemap com páginas individuais;
- títulos e descrições específicos por programa;
- links internos entre guias, categorias e oportunidades.

### Conversão e orientação

A página precisa orientar melhor quem ainda não sabe por onde começar. Recomenda-se criar entradas como:

- melhores opções para iniciantes;
- oportunidades para quem tem uma hora por dia;
- oportunidades para músicos;
- opções sem investimento inicial;
- opções para receber em moeda estrangeira;
- opções de freelancing;
- opções de afiliados;
- opções de pesquisas e tarefas de dados.

## 4. Pontos técnicos a melhorar

- Trocar descrições longas com links embutidos por conteúdo estruturado e links reais.
- Adicionar validação mais explícita para URLs externas.
- Implementar estados de carregamento, erro e sucesso mais consistentes nos formulários.
- Melhorar acessibilidade do modal: `Escape`, foco, retorno de foco e fechamento externo.
- Substituir o campo de seleção múltipla por uma interface mais clara em dispositivos móveis.
- Adicionar moderação administrativa para comentários e avaliações.
- Criar testes para as regras de nota, rate limit e duplicidade de avaliações.
- Evitar que dados editoriais importantes fiquem apenas em texto livre.
- Adicionar campos estruturados para custo, pagamento, requisitos, região e última verificação.

## 5. Prioridade recomendada

### Prioridade alta

1. Criar páginas individuais `/programas/[slug]`.
2. Adicionar transparência de afiliados.
3. Criar campos práticos e de confiança para cada oportunidade.
4. Melhorar o conteúdo introdutório da página principal.
5. Implementar metadata, canonical, sitemap e JSON-LD específicos.

### Prioridade média

1. Criar listas editoriais por perfil de visitante.
2. Melhorar o modal e sua acessibilidade.
3. Adicionar moderação de avaliações e comentários.
4. Criar comparativos entre oportunidades.
5. Adicionar newsletter ou checklist para captura de interesse.

### Prioridade posterior

1. Histórico de alterações e verificações de cada programa.
2. Sistema de alertas para mudanças em plataformas.
3. Área de favoritos.
4. Recomendações personalizadas.
5. Painel de métricas editoriais e conversão.

## Conclusão

O blog já tem uma base funcional de publicação e participação da comunidade. A infraestrutura de renda extra também possui boas bases de catálogo, avaliações, rate limiting e administração.

O déficit principal está na camada editorial: falta transformar dados de catálogo em conteúdo confiável, aprofundado, indexável e orientado à decisão. A evolução mais importante não é adicionar apenas mais cards, mas criar páginas individuais e uma metodologia clara que ajude o visitante a entender riscos, requisitos, expectativas e adequação de cada oportunidade.
