export type PartnerStrategy = {
  title: string;
  steps: string[];
};

type ProgramStrategyInput = {
  slug: string;
  category: string;
  tags: string[];
};

const STRATEGIES_BY_SLUG: Record<string, PartnerStrategy[]> = {
  'marketplaces-afiliados': [
    {
      title: 'Estratégia 1 · Um nicho, uma vitrine',
      steps: [
        'Escolha um tema que você realmente conhece, como cozinha econômica, beleza ou acessórios para celular.',
        'Compare produtos em pelo menos dois marketplaces e anote preço, avaliação, frete e prazo.',
        'Publique uma seleção curta com contexto real: para quem serve, o que observar e qual é a limitação.',
        'Atualize os links quando o preço ou o estoque mudar; confiança vale mais que volume.',
      ],
    },
    {
      title: 'Estratégia 2 · Conteúdo que resolve uma dúvida',
      steps: [
        'Anote cinco perguntas que as pessoas fazem antes de comprar no seu nicho.',
        'Transforme cada pergunta em um vídeo curto, carrossel ou mensagem explicativa.',
        'Mostre o produto em uso e indique alternativas para orçamentos diferentes.',
        'Use o link de afiliado apenas depois de entregar a resposta, sem prometer economia garantida.',
      ],
    },
    {
      title: 'Estratégia 3 · Rotina de ofertas úteis',
      steps: [
        'Crie uma lista pequena de ofertas verificadas para compartilhar em um grupo ou canal próprio.',
        'Defina um limite, como três recomendações por semana, para não virar spam.',
        'Registre cliques, vendas e dúvidas recebidas para entender o que realmente ajuda seu público.',
        'Remova ofertas expiradas e deixe claro quando houver comissão ou condição especial.',
      ],
    },
  ],
  'canal-dark-youtube-notebooklm': [
    {
      title: 'Estratégia 1 · Canal de busca evergreen',
      steps: [
        'Escolha um problema específico que as pessoas pesquisam, como ferramentas, histórias ou tutoriais de um nicho.',
        'Valide dez pautas no YouTube e no Google antes de produzir; priorize dúvidas com intenção clara.',
        'Crie roteiros originais com fontes, revisão humana e exemplos próprios, sem copiar vídeos ou artigos.',
        'Publique uma série de oito vídeos e compare retenção, cliques na miniatura e comentários antes de mudar de tema.',
      ],
    },
    {
      title: 'Estratégia 2 · Notícias explicadas com fontes',
      steps: [
        'Escolha uma área de notícias e acompanhe pelo menos três fontes confiáveis para cada pauta.',
        'Use o NotebookLM para organizar documentos, mas confira manualmente números, datas, citações e contexto.',
        'Grave uma explicação que diferencie fato, interpretação e opinião; não use voz ou imagem de terceiros sem autorização.',
        'Atualize a descrição quando houver correção e mantenha um registro das fontes usadas no roteiro.',
      ],
    },
    {
      title: 'Estratégia 3 · Série curta para testar monetização',
      steps: [
        'Monte uma temporada de quatro episódios com o mesmo formato, identidade visual e promessa editorial.',
        'Produza uma versão simples com narração, imagens licenciadas ou próprias e edição que priorize clareza.',
        'Distribua cortes em redes que permitam levar o público ao vídeo completo, sem spam ou promessas de renda.',
        'Só planeje anúncios, afiliados ou produtos depois de validar audiência e cumprir as regras de monetização.',
      ],
    },
    {
      title: 'Estratégia 4 · Pesquisa manual e roteiro original',
      steps: [
        'Escolha uma pergunta específica e confirme a resposta em fontes primárias, como documentos oficiais e entrevistas autorizadas.',
        'Escreva um roteiro próprio com contexto, exemplos e uma conclusão útil; não reescreva vídeos de outros canais.',
        'Revise nomes, datas, direitos de uso e afirmações antes de gravar ou publicar.',
        'Mantenha uma lista das fontes para atualizar o vídeo quando a informação mudar.',
      ],
    },
    {
      title: 'Estratégia 5 · Produção com mídia licenciada',
      steps: [
        'Use imagens, trilhas e vídeos autorais ou com licença compatível com monetização e distribuição.',
        'Guarde os comprovantes de licença e atribuição junto do projeto para evitar problemas futuros.',
        'Construa ritmo com narração, cortes e elementos próprios, sem depender de compilação de material de terceiros.',
        'Revise retenção e comentários após cada publicação e melhore uma variável por vez.',
      ],
    },
  ],
  'ugc-roster': [
    {
      title: 'Estratégia 1 · Portfólio de demonstração',
      steps: [
        'Escolha três produtos que você já usa e grave anúncios de demonstração sem afirmar que são trabalhos pagos.',
        'Monte vídeos curtos com abertura, benefício concreto, prova de uso e chamada para ação.',
        'Organize os exemplos por formato e deixe claro quais imagens são autorais e quais são apenas demonstrações.',
        'Envie o portfólio apenas para briefings compatíveis com seu equipamento e disponibilidade.',
      ],
    },
    {
      title: 'Estratégia 2 · Proposta por briefing',
      steps: [
        'Leia o briefing inteiro e destaque público, duração, formato, prazo, uso de imagem e número de revisões.',
        'Responda com uma ideia específica para aquela marca, em vez de copiar uma mensagem genérica.',
        'Calcule tempo de gravação, edição e revisão antes de aceitar o valor oferecido.',
        'Confirme por escrito a entrega e os direitos de utilização antes de enviar o arquivo final.',
      ],
    },
    {
      title: 'Estratégia 3 · Repetição com qualidade',
      steps: [
        'Crie um checklist de iluminação, áudio, enquadramento, legendas e exportação.',
        'Registre quais formatos tiveram aprovação e use esse aprendizado em novos briefings.',
        'Separe uma parte do pagamento para equipamento, impostos e períodos sem campanha.',
        'Nunca publique material de cliente no seu portfólio sem autorização explícita.',
      ],
    },
  ],
  'creator-space': [
    {
      title: 'Estratégia 1 · Perfil orientado a uma categoria',
      steps: [
        'Escolha uma categoria de conteúdo e apresente no perfil o formato que você consegue entregar com consistência.',
        'Use três exemplos autorais que mostrem roteiro, gravação e edição, mesmo que sejam projetos de demonstração.',
        'Descreva público, idioma, equipamento e prazo de entrega sem inflar sua experiência.',
        'Candidate-se primeiro a campanhas compatíveis com seu portfólio e sua rotina.',
      ],
    },
    {
      title: 'Estratégia 2 · Biblioteca de formatos',
      steps: [
        'Prepare modelos de unboxing, tutorial, depoimento e comparação para adaptar aos briefings.',
        'Deixe espaços para inserir a mensagem da marca sem perder sua linguagem natural.',
        'Confira se a campanha exige roteiro aprovado, exclusividade, legendas ou arquivos brutos.',
        'Entregue uma primeira versão curta para reduzir retrabalho e alinhar expectativas.',
      ],
    },
    {
      title: 'Estratégia 3 · Relacionamento com marcas',
      steps: [
        'Anote campanhas, prazos, pagamentos e feedbacks em uma planilha simples.',
        'Após uma entrega aprovada, envie um resumo objetivo do que funcionou e de quais formatos você pode repetir.',
        'Mantenha comunicação profissional e responda dentro do prazo combinado.',
        'Não aceite direitos de uso ilimitados sem entender o impacto no valor e no seu portfólio.',
      ],
    },
  ],
};

export function getProgramStrategies(program: ProgramStrategyInput): PartnerStrategy[] | null {
  return STRATEGIES_BY_SLUG[program.slug] ?? null;
}
