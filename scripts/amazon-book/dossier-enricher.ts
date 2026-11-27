import {
  getProgramStrategies,
  type PartnerStrategy,
} from '../../src/lib/partner-strategies';
import {
  escapeHtml,
  type BookChapterPayload,
  type BookProgramRow,
} from './types';

type ChapterId =
  | 'cap-04'
  | 'cap-05'
  | 'cap-06'
  | 'cap-07'
  | 'cap-08'
  | 'cap-09';

type ChapterSpec = {
  id: ChapterId;
  number: number;
  tocLabel: string;
  title: string;
  subtitle: string;
  intro: string;
  defaultPayments: string[];
  defaultPros: string[];
  defaultCons: string[];
  defaultRequirements: string[];
  defaultBanChecklist: string[];
  defaultTools: string[];
  promptTitle: string;
  buildPrompt: (program: BookProgramRow) => string;
};

type RoadmapPhase = {
  label: string;
  items: string[];
};

const CHAPTER_ORDER: readonly ChapterId[] = [
  'cap-04',
  'cap-05',
  'cap-06',
  'cap-07',
  'cap-08',
  'cap-09',
];

const SLUG_TO_CHAPTER: Record<string, ChapterId> = {
  // Capitulo 4: IA, Treinamento de Modelos e Pesquisas Remuneradas
  aligner: 'cap-04',
  attapoll: 'cap-04',
  'claru-ia': 'cap-04',
  clickworker: 'cap-04',
  crowdato: 'cap-04',
  dataannotation: 'cap-04',
  dscout: 'cap-04',
  'ia-remunerada-curadoria-dados': 'cap-04',
  jumptask: 'cap-04',
  micro1: 'cap-04',
  mindrift: 'cap-04',
  oneforma: 'cap-04',
  'outlier-ai': 'cap-04',
  prolific: 'cap-04',
  'serp-raters-welocalize-telus': 'cap-04',

  // Capitulo 5: Testes de Apps, QA, UX e Entrevistas B2B
  'entrevistas-b2b-respondent-user-interviews': 'cap-05',
  'nyte-x': 'cap-05',
  'testes-ux-narrados': 'cap-05',
  testlio: 'cap-05',
  utest: 'cap-05',

  // Capitulo 6: Conteudo UGC, Videos Curtos, Audio e Economia de Criadores
  apphub: 'cap-06',
  bilibili: 'cap-06',
  billo: 'cap-06',
  'canal-dark-youtube-notebooklm': 'cap-06',
  'creator-space': 'cap-06',
  elevenlabs: 'cap-06',
  flambra: 'cap-06',
  fluencify: 'cap-06',
  hub: 'cap-06',
  joinbrands: 'cap-06',
  'monetizacao-atencao-web': 'cap-06',
  'tiktok-shop': 'cap-06',
  'ugc-roster': 'cap-06',

  // Capitulo 7: Freelancing Global, Ensino e Desafios Tecnicos
  fiverr: 'cap-07',
  'learn-to-earn-bolsas-digitais': 'cap-07',
  upwork: 'cap-07',

  // Capitulo 8: Afiliados, Indicacoes, Marketplaces e Renda Complementar
  'afiliados-b2b-tubebuddy-make': 'cap-08',
  'amazon-influencer': 'cap-08',
  honeygain: 'cap-08',
  hotmart: 'cap-08',
  'marketplaces-afiliados': 'cap-08',
  'mercado-pago': 'cap-08',
  'pawns-app': 'cap-08',
  'quintoandar-indica-ai': 'cap-08',
  'redes-cpa-affiliaxe': 'cap-08',
  repocket: 'cap-08',
  sideshift: 'cap-08',

  // Capitulo 9: Produtos Digitais, Amazon KDP e Modelos com Investimento Inicial
  'amazon-kdp-ebooks': 'cap-09',
  'automacao-ia-negocios-locais': 'cap-09',
  'comunidades-pagas-skool-systeme': 'cap-09',
  'edicao-cortes-virais-ia': 'cap-09',
  'loja-templates-etsy-gumroad': 'cap-09',
  'montink-embaixador': 'cap-09',
  'printful-print-on-demand': 'cap-09',
  'producao-videos-ia': 'cap-09',
  'trafego-pago-negocios-locais': 'cap-09',
  'walmart-marketplace-revenda': 'cap-09',
};

const CHAPTER_SPECS: Record<ChapterId, ChapterSpec> = {
  'cap-04': {
    id: 'cap-04',
    number: 4,
    tocLabel: 'Capítulo 4: IA, Treinamento de Modelos e Pesquisas Remuneradas',
    title: 'Capítulo 4: IA, Treinamento de Modelos e Pesquisas Remuneradas',
    subtitle:
      'Plataformas sem custo de entrada que pagam por atenção crítica, checagem factual, anotação de dados e estudos comportamentais.',
    intro:
      'Este capítulo reúne frentes que remuneram capacidade analítica, leitura atenta de rubricas e consistência nas respostas. O diferencial entre quem recebe convites recorrentes e quem fica sem fila está na qualidade das avaliações iniciais e no cumprimento estrito das regras de integridade.',
    defaultPayments: ['Wise', 'Payoneer', 'PayPal (conforme país e projeto)'],
    defaultPros: [
      'Entrada gratuita sem necessidade de seguidores ou capital inicial',
      'Flexibilidade de horário para executar blocos de tarefas em casa',
      'Pagamentos em dólar ou libra na maioria das plataformas globais',
    ],
    defaultCons: [
      'Disponibilidade de projetos oscila conforme demanda e idioma',
      'Avaliações de entrada podem reprovar sem feedback detalhado',
      'Exige atenção sustentada; velocidade sem qualidade reduz nota interna',
    ],
    defaultRequirements: [
      'Computador estável ou celular atualizado conforme exigência da tarefa',
      'Leitura atenta de instruções em português ou inglês técnico',
      'Conta de recebimento internacional configurada (Wise, Payoneer ou PayPal)',
    ],
    defaultBanChecklist: [
      'Uso de VPN, proxy ou compartilhamento de rede corporativa para simular outro país',
      'Criação de múltiplas contas no mesmo CPF, dispositivo ou endereço residencial',
      'Uso de automações, bots de clique ou cópia direta de respostas geradas sem revisão',
      'Inconsistência nos dados demográficos entre o perfil inicial e os questionários de triagem',
    ],
    defaultTools: [
      'Wise ou Payoneer para receber em moeda estrangeira com menor taxa',
      'Cronômetro e planilha simples para medir ganho líquido por hora real',
      'Tradutor de apoio apenas para conferência de termos, preservando redação natural',
    ],
    promptTitle: 'Prompt para Revisar Rubricas e Melhorar Precisão em Avaliações',
    buildPrompt: (program) =>
      `Atue como revisor de qualidade para tarefas na plataforma ${program.name}. Vou colar abaixo as regras oficiais do projeto e uma resposta que redigi para avaliação. Identifique: (1) pontos em que a resposta viola ou ignora a rubrica; (2) falhas de checagem factual, lógica ou tom; (3) uma justificativa objetiva em até 4 linhas explicando o critério aplicado. Não invente fatos. Regras: [COLAR RUBRICA]. Minha análise: [COLAR RASCUNHO].`,
  },
  'cap-05': {
    id: 'cap-05',
    number: 5,
    tocLabel: 'Capítulo 5: Testes de Apps, QA, UX e Entrevistas B2B',
    title: 'Capítulo 5: Testes de Apps, QA, UX e Entrevistas B2B',
    subtitle:
      'Encontre falhas funcionais em software, narre experiências reais de navegação e participe de entrevistas remuneradas com equipes de produto.',
    intro:
      'Empresas de tecnologia pagam caro quando um erro chega ao usuário final. Por isso, testadores organizados e participantes que descrevem sua experiência real com clareza conseguem valores por hora superiores aos das microtarefas comuns.',
    defaultPayments: ['PayPal', 'Payoneer', 'Wise (conforme ciclo ou estudo)'],
    defaultPros: [
      'Remuneração atrativa por bug válido, ciclo fechado ou entrevista realizada',
      'Valoriza observação prática e clareza na comunicação mais do que programação avançada',
      'Histórico de aprovações aumenta a frequência de convites diretos',
    ],
    defaultCons: [
      'Convites dependem de dispositivo, sistema operacional e perfil profissional',
      'Relatórios de erro duplicados ou sem evidência clara são recusados',
      'Entrevistas exigem agenda pontual e microfone com áudio limpo',
    ],
    defaultRequirements: [
      'Dispositivos reais atualizados (celular e computador) com cadastro completo',
      'Microfone sem eco e câmera limpa para testes narrados ou chamadas B2B',
      'Capacidade de gravar tela e reproduzir o passo a passo exato de um problema',
    ],
    defaultBanChecklist: [
      'Áudio com ruído de fundo, eco ou silêncio prolongado durante testes de UX narrados',
      'Inflar cargo no LinkedIn ou mentir no questionário de triagem para entrar em entrevistas B2B',
      'Enviar relatórios de bug fora do escopo do ciclo ou sem vídeo e logs anexados',
      'Vazar telas, protótipos ou informações confidenciais protegidas por NDA',
    ],
    defaultTools: [
      'OBS Studio ou gravador nativo para capturar tela em HD com áudio limpo',
      'Microfone de lapela ou headset USB em ambiente silencioso',
      'Perfil de LinkedIn real e atualizado para validação em pesquisas B2B',
    ],
    promptTitle: 'Prompt para Estruturar Relatório de Bug ou Preparar Entrevista UX',
    buildPrompt: (program) =>
      `Você é um especialista sênior de QA e pesquisa de produto preparando uma entrega para ${program.name}. Transforme minhas anotações brutas abaixo em um relatório técnico claro contendo: (1) Título objetivo do problema; (2) Ambiente e dispositivo; (3) Passos numerados para reproduzir; (4) Resultado atual vs. resultado esperado; (5) Severidade sugerida sem exageros. Anotações: [DESCREVER O ERRO OU FLUXO TESTADO].`,
  },
  'cap-06': {
    id: 'cap-06',
    number: 6,
    tocLabel: 'Capítulo 6: Conteúdo UGC, Vídeos Curtos, Áudio e Economia de Criadores',
    title: 'Capítulo 6: Conteúdo UGC, Vídeos Curtos, Áudio e Economia de Criadores',
    subtitle:
      'Produza vídeos curtos de demonstração, narrações e roteiros para marcas e canais digitais sem depender de milhões de seguidores.',
    intro:
      'A economia de criadores abriu espaço para quem sabe filmar com clareza, estruturar um roteiro de 30 a 60 segundos e entregar arquivos organizados dentro do prazo. Marcas compram utilidade visual e credibilidade, não apenas fama.',
    defaultPayments: ['Pix', 'Wise', 'PayPal', 'Payoneer (conforme campanha)'],
    defaultPros: [
      'Possibilidade de atuar sem audiência prévia por meio de portfólio de demonstração',
      'Ticket por vídeo ou campanha cresce conforme a qualidade das primeiras entregas',
      'Habilidades transferíveis entre plataformas nacionais e internacionais',
    ],
    defaultCons: [
      'Concorrência alta em briefings genéricos sem especialização',
      'Exige atenção a prazos, refações e cláusulas de direito de uso de imagem',
      'Atrasos na aprovação podem estender o prazo até o recebimento',
    ],
    defaultRequirements: [
      'Celular com câmera limpa, iluminação frontal simples e áudio inteligível',
      'Portfólio curto com 2 a 4 exemplos de demonstração autoral',
      'Editor de vídeo ágil (CapCut ou equivalente) e leitura atenta de briefings',
    ],
    defaultBanChecklist: [
      'Usar músicas, trechos de vídeos ou vozes de terceiros sem licença comercial válida',
      'Apresentar vídeos de demonstração como se fossem campanhas pagas oficiais',
      'Entregar arquivo fora da proporção, resolução ou duração pedida no briefing',
      'Assinar direitos de uso perpétuos e anúncios pagos sem considerar o impacto no valor',
    ],
    defaultTools: [
      'CapCut ou DaVinci Resolve para cortes rápidos e legendas legíveis',
      'Luminária frontal ou janela com luz natural + microfone de lapela simples',
      'Notion ou pasta organizada por marca para guardar roteiros, entregas e comprovantes',
    ],
    promptTitle: 'Prompt para Roteiro UGC de 35 Segundos Orientado a Briefing',
    buildPrompt: (program) =>
      `Crie 2 opções de roteiro de vídeo vertical (30 a 40 segundos) para uma campanha na plataforma ${program.name}. Estrutura obrigatória: (1) Gancho visual e verbal nos primeiros 3 segundos focado em um problema real; (2) Demonstração prática do produto/serviço em uso; (3) Prova concreta sem promessas milagrosas; (4) Chamada final natural. Produto e público: [DESCREVER PRODUTO, PÚBLICO E REGRAS DO BRIEFING].`,
  },
  'cap-07': {
    id: 'cap-07',
    number: 7,
    tocLabel: 'Capítulo 7: Freelancing Global, Ensino e Desafios Técnicos',
    title: 'Capítulo 7: Freelancing Global, Ensino e Desafios Técnicos',
    subtitle:
      'Empacote habilidades práticas em serviços fechados, contratos recorrentes e desafios técnicos remunerados no Brasil e no exterior.',
    intro:
      'Quando você domina uma entrega concreta — seja edição, programação, planilhas, tradução, análise de dados ou ensino — o caminho mais rápido para sair da disputa por preço é definir escopo fechado, prazo realista e prova de execução.',
    defaultPayments: ['Payoneer', 'Wise', 'PayPal', 'Transferência bancária'],
    defaultPros: [
      'Escala de preço por hora ou pacote conforme reputação e avaliações',
      'Acesso a clientes internacionais pagando em moeda forte',
      'Construção de carteira própria de clientes recorrentes ao longo do tempo',
    ],
    defaultCons: [
      'Primeiros contratos exigem paciência, portfólio sólido e propostas personalizadas',
      'Plataformas cobram taxas de intermediação sobre cada pedido',
      'Escopo mal definido gera retrabalho e reduz o ganho líquido por hora',
    ],
    defaultRequirements: [
      'Habilidade específica empacotada com entregáveis claros e prazo definido',
      '3 amostras reais ou projetos-modelo que comprovem execução',
      'Comunicação escrita objetiva em português ou inglês de negócios',
    ],
    defaultBanChecklist: [
      'Tentar levar o pagamento inicial de um cliente da plataforma para fora dela violando os termos',
      'Enviar propostas idênticas em massa sem ler os requisitos do cliente',
      'Entregar trabalho copiado, código sem licença ou material com direitos autorais de terceiros',
      'Aceitar escopo aberto sem definir número máximo de revisões por escrito',
    ],
    defaultTools: [
      'Loom para enviar vídeos curtos de apresentação explicando sua solução ao cliente',
      'Notion ou Google Docs para proposta de escopo, cronograma e aceite formal',
      'Wise ou Payoneer para receber pagamentos internacionais com menos tarifas',
    ],
    promptTitle: 'Prompt para Proposta Sob Medida que Converte nas Primeiras 5 Linhas',
    buildPrompt: (program) =>
      `Escreva uma proposta curta e direta para enviar em ${program.name} respondendo ao pedido abaixo. Regras: (1) Primeira frase mostra que entendi o problema específico do cliente, sem saudações longas; (2) Liste 3 entregáveis claros e o prazo realista; (3) Inclua 1 pergunta técnica inteligente para fechar o escopo; (4) Zero promessas exageradas. Pedido do cliente: [COLAR DESCRIÇÃO DA VAGA]. Minha experiência real: [DESCREVER EXPERIÊNCIA].`,
  },
  'cap-08': {
    id: 'cap-08',
    number: 8,
    tocLabel: 'Capítulo 8: Afiliados, Indicações, Marketplaces e Renda Complementar',
    title: 'Capítulo 8: Afiliados, Indicações, Marketplaces e Renda Complementar',
    subtitle:
      'Conecte compradores reais a produtos, imóveis, ferramentas B2B e soluções digitais verificadas, além de opções leves de renda complementar.',
    intro:
      'Indicação sustentável nasce da utilidade: ajudar alguém a escolher melhor um produto, uma ferramenta ou um serviço. Modelos de renda complementar e banda ociosa também entram aqui com expectativa realista — nunca substituem trabalho principal, mas somam sem prometer milagres.',
    defaultPayments: ['Pix', 'Transferência bancária', 'PayPal', 'Créditos em carteira'],
    defaultPros: [
      'Sem custo para se cadastrar na maioria dos programas e marketplaces',
      'Pode ser combinado com conteúdo útil, grupos próprios ou rede de contatos',
      'Permite testar conversão de diferentes nichos antes de investir dinheiro',
    ],
    defaultCons: [
      'Comissões variam muito por categoria e cancelamentos estornam repasses',
      'Spam em grupos ou promessas exageradas bloqueiam contas rapidamente',
      'Apps de banda ociosa e microindicações têm teto baixo de ganho mensal',
    ],
    defaultRequirements: [
      'Canal próprio organizado (grupo, página, vídeo ou rede de contatos reais)',
      'Leitura integral das regras de divulgação, marca e prazos de atribuição',
      'Transparência ao informar links de indicação ou condições comerciais',
    ],
    defaultBanChecklist: [
      'Fazer anúncios usando o nome oficial da marca afiliada quando proibido no regulamento',
      'Prometer ganho garantido, lucro rápido ou benefício inexistente para forçar cliques',
      'Disparar links em grupos sem permissão ou automatizar mensagens privadas (spam)',
      'Instalar apps de compartilhamento de internet em rede corporativa ou IP compartilhado proibido',
    ],
    defaultTools: [
      'Metricool ou planilha simples para medir cliques, conversões e cancelamentos por link',
      'Canva para montar comparativos visuais limpos de produtos ou ferramentas',
      'WhatsApp Business ou canal no Telegram com regras claras para listas de ofertas',
    ],
    promptTitle: 'Prompt para Comparativo Honesto que Gera Cliques Qualificados',
    buildPrompt: (program) =>
      `Estruture uma recomendação comparativa honesta para divulgar via ${program.name}. Inclua: (1) Para quem o produto/serviço faz sentido; (2) Principal ponto forte comprovável; (3) Principal limitação ou cuidado antes da compra; (4) Alternativa mais barata ou mais completa; (5) Aviso transparente de link de indicação sem linguagem apelativa. Produto e público: [INFORMAR ITEM E PÚBLICO].`,
  },
  'cap-09': {
    id: 'cap-09',
    number: 9,
    tocLabel: 'Capítulo 9: Produtos Digitais, Amazon KDP e Modelos com Investimento Inicial',
    title: 'Capítulo 9: Produtos Digitais, Amazon KDP e Modelos com Investimento Inicial',
    subtitle:
      'Publicação sob demanda, ativos digitais reutilizáveis, serviços B2B estruturados e operações comerciais que exigem caixa e controle de margem.',
    intro:
      'Neste capítulo estão os modelos com maior potencial de construção de ativo próprio ou prestação de serviço de ticket alto. Quase todos exigem investimento inicial em ferramentas, tráfego, infraestrutura ou tempo intenso de produção — por isso, validar demanda antes de gastar é regra de ouro.',
    defaultPayments: ['Pix', 'Stripe', 'Wise', 'Payoneer', 'Transferência bancária'],
    defaultPros: [
      'Ativos digitais (livros, templates) vendem repetidamente após o trabalho inicial',
      'Serviços B2B estruturados permitem contratos mensais recorrentes',
      'Construção de marca e base própria sem depender de um único algoritmo',
    ],
    defaultCons: [
      'Exige capital inicial realista para ferramentas, domínio, anúncios ou giro',
      'Erros de precificação, impostos ou devoluções corroem a margem líquida',
      'Curva de aprendizado inicial mais longa antes do ponto de equilíbrio',
    ],
    defaultRequirements: [
      'Reserva financeira definida para 60 a 90 dias de operação sem comprometer contas essenciais',
      'Planilha de margem líquida contemplando taxas, impostos, ferramentas e devoluções',
      'Validação prévia com público real antes de escalar gastos',
    ],
    defaultBanChecklist: [
      'Publicar livros, estampas ou templates com texto/arte gerados sem revisão ou com violação autoral',
      'Operar anúncios locais ou automações B2B sem contrato claro e adequação à LGPD',
      'Subestimar taxas de plataforma, câmbio, frete reverso e chargebacks no preço final',
      'Escalar investimento em tráfego ou estoque antes de provar conversão em pequena escala',
    ],
    defaultTools: [
      'Planilha de Raio-X Financeiro (custo fixo, variável, taxas, margem líquida e CAC)',
      'Notion, Canva Pro e ferramentas de prototipagem para ativos digitais e apresentações',
      'Make / n8n / Stripe / Wise conforme operação digital ou B2B escolhida',
    ],
    promptTitle: 'Prompt para Validar Oferta, Precificação e Margem antes de Investir',
    buildPrompt: (program) =>
      `Atue como consultor prático de negócios digitais revisando meu plano para ${program.name}. Com base nos números abaixo, aponte: (1) Os 3 maiores riscos financeiros ocultos desse modelo; (2) Cálculo estimado de ponto de equilíbrio (quantas vendas ou clientes pagam os custos); (3) Um teste barato de 7 dias para validar demanda antes de investir mais dinheiro. Meus dados: [ORÇAMENTO INICIAL, PREÇO PRETENDIDO, CUSTOS MENSAIS E PÚBLICO].`,
  },
};

function classifyByKeywords(program: BookProgramRow): ChapterId {
  if (!program.zeroInvestmentRequired) {
    return 'cap-09';
  }

  const haystack = `${program.slug} ${program.category} ${program.tags.join(' ')}`.toLowerCase();

  if (
    haystack.includes('kdp') ||
    haystack.includes('produtos digitais') ||
    haystack.includes('investimento inicial') ||
    haystack.includes('print on demand') ||
    haystack.includes('walmart')
  ) {
    return 'cap-09';
  }

  if (
    haystack.includes('testes e qa') ||
    haystack.includes('testes e ux') ||
    haystack.includes('entrevistas b2b') ||
    haystack.includes('pesquisa de mercado') ||
    haystack.includes('nyte-x')
  ) {
    return 'cap-05';
  }

  if (
    haystack.includes('conteúdo e vídeo') ||
    haystack.includes('conteudo e video') ||
    haystack.includes('ugc') ||
    haystack.includes('elevenlabs') ||
    haystack.includes('áudio e voz') ||
    haystack.includes('criadores')
  ) {
    return 'cap-06';
  }

  if (
    haystack.includes('freelance') ||
    haystack.includes('estudar e ganhar') ||
    haystack.includes('ensino') ||
    haystack.includes('mentoria')
  ) {
    return 'cap-07';
  }

  if (
    haystack.includes('inteligência artificial') ||
    haystack.includes('inteligencia artificial') ||
    haystack.includes('pesquisas') ||
    haystack.includes('avaliação de ia') ||
    haystack.includes('avaliacao de ia') ||
    haystack.includes('microtarefas') ||
    haystack.includes('dados e idiomas') ||
    haystack.includes('dados e avaliação')
  ) {
    return 'cap-04';
  }

  if (
    haystack.includes('afiliad') ||
    haystack.includes('indicaç') ||
    haystack.includes('indicac') ||
    haystack.includes('finanças digitais') ||
    haystack.includes('renda passiva') ||
    haystack.includes('oportunidades digitais')
  ) {
    return 'cap-08';
  }

  return 'cap-08';
}

function resolveChapterId(program: BookProgramRow): ChapterId {
  const mapped = SLUG_TO_CHAPTER[program.slug];
  if (mapped) {
    return mapped;
  }
  return classifyByKeywords(program);
}

function formatCleanUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return 'Consultar página oficial';
  }
  try {
    const parsed = new URL(trimmed);
    const cleanPath = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/+$/u, '');
    return `${parsed.host}${cleanPath}`;
  } catch {
    return trimmed.replace(/^https?:\/\//iu, '').replace(/\/+$/u, '');
  }
}

function formatEditorialRating(rating: number): string {
  const safe = Number.isFinite(rating) ? Math.max(0, rating) : 0;
  const normalized = safe > 10 ? safe / 10 : safe;
  return `${Math.min(10, normalized).toFixed(1)}/10`;
}

function inferLanguages(program: BookProgramRow): string {
  const text = `${program.slug} ${program.tags.join(' ')} ${program.longDescription}`.toLowerCase();
  const langs: string[] = [];

  if (
    text.includes('português') ||
    text.includes('portugues') ||
    text.includes('brasil') ||
    text.includes('pix') ||
    text.includes('quintoandar') ||
    text.includes('mercado-pago') ||
    text.includes('fluencify') ||
    text.includes('montink') ||
    text.includes('hotmart')
  ) {
    langs.push('Português');
  }

  if (
    text.includes('inglês') ||
    text.includes('ingles') ||
    text.includes('dólar') ||
    text.includes('dolar') ||
    text.includes('internacional') ||
    text.includes('global') ||
    text.includes('eua')
  ) {
    langs.push('Inglês');
  }

  if (program.slug === 'bilibili' || text.includes('china')) {
    langs.push('Chinês / Inglês');
  }

  if (langs.length === 0) {
    return 'Português / Inglês (conforme campanha)';
  }
  return Array.from(new Set(langs)).join(', ');
}

function formatTags(tags: readonly string[]): string {
  const cleaned = tags
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .slice(0, 6);
  return cleaned.length > 0 ? cleaned.join(' · ') : 'Curadoria Portal NKL';
}

function formatDifficulty(difficulty: string): string {
  const clean = difficulty.trim().toLowerCase();
  if (clean === 'fácil' || clean === 'facil') return 'Entrada acessível (Fácil)';
  if (clean === 'médio' || clean === 'medio') return 'Intermediária (Médio)';
  if (clean === 'difícil' || clean === 'dificil') return 'Exigente (Difícil)';
  return difficulty.trim() || 'Intermediária';
}

function buildOperationalGuidance(program: BookProgramRow, chapterId: ChapterId): string[] {
  const shortText = program.shortDescription.trim();
  const longText = program.longDescription.trim();
  const paragraphs: string[] = [];

  if (longText.length > 0) {
    paragraphs.push(longText);
    if (shortText.length > 0 && !longText.toLowerCase().includes(shortText.slice(0, 28).toLowerCase())) {
      paragraphs.unshift(shortText);
    }
  } else if (shortText.length > 0) {
    paragraphs.push(shortText);
  }

  const operationalNoteByChapter: Record<ChapterId, string> = {
    'cap-04':
      'Na operação diária, trate a plataforma como trabalho técnico por precisão: leia toda a rubrica antes de começar, evite trabalhar cansado para não derrubar sua taxa de aprovação e meça o valor líquido considerando tempo de estudo não remunerado.',
    'cap-05':
      'Na prática, quem recebe mais convites mantém o inventário de dispositivos sempre atualizado, responde rapidamente às chamadas de ciclo e entrega evidências (vídeo curto, print e log) que o desenvolvedor consegue reproduzir de primeira.',
    'cap-06':
      'Para ganhar tração sem depender de sorte, padronize um fluxo enxuto de roteiro, gravação com áudio limpo e edição vertical. Separe exemplos de demonstração do portfólio oficial e negocie prazos reais antes de aceitar revisões.',
    'cap-07':
      'O resultado financeiro vem da clareza do escopo: empacote uma entrega bem delimitada, comprove execução com 3 amostras objetivas e mantenha toda comunicação e entrega documentadas dentro da plataforma até consolidar avaliações.',
    'cap-08':
      'Trate indicações e renda complementar com critério editorial: só recomende o que você verificou na prática, acompanhe métricas reais de conversão e respeite rigorosamente os termos de origem de tráfego para não perder comissões acumuladas.',
    'cap-09':
      'Antes de ampliar gastos com ferramentas, anúncios ou produção, valide demanda com um lote mínimo testável. Controle margem líquida descontando taxas da plataforma, câmbio, impostos e eventuais reembolsos desde o primeiro cliente ou venda.',
  };

  paragraphs.push(operationalNoteByChapter[chapterId]);
  return paragraphs;
}

function buildFirstWithdrawalRoadmap(
  program: BookProgramRow,
  chapter: ChapterSpec,
): { strategies: PartnerStrategy[] | null; phases: RoadmapPhase[] } {
  const strategies = getProgramStrategies({
    slug: program.slug,
    category: program.category,
    tags: program.tags,
  });

  if (strategies && strategies.length > 0) {
    return { strategies, phases: [] };
  }

  const reqs =
    program.requirements.length > 0
      ? program.requirements
      : chapter.defaultRequirements;

  const isHard = program.difficulty.toLowerCase().includes('dif');
  const payoutHint =
    program.paymentMethods.length > 0
      ? program.paymentMethods.join(', ')
      : chapter.defaultPayments.join(', ');

  const phase1Items = [
    `Conclua o cadastro oficial em ${formatCleanUrl(program.websiteUrl)} usando seus dados reais e documento compatível com a conta de recebimento.`,
    ...reqs.slice(0, 2).map((req) => `Requisito imediato: ${req}.`),
    `Configure antecipadamente o método de saque compatível (${payoutHint}) para não travar na hora da retirada.`,
  ];

  const phase2Items = [
    isHard
      ? 'Reserve blocos sem interrupção para concluir a qualificação inicial ou montar suas 3 amostras técnicas de entrada, revisando cada critério antes de enviar.'
      : 'Execute os primeiros testes, entregas ou campanhas em volume pequeno, priorizando 100% de aderência às regras antes de buscar velocidade.',
    'Registre data, minutos investidos (incluindo estudo e preparação) e eventuais recusas em uma folha de acompanhamento.',
  ];

  const phase3Items = [
    'Ao atingir o limite mínimo de saque, realize o primeiro resgate de validação para confirmar taxas, prazo de compensação e câmbio líquido.',
    'Compare o retorno líquido por hora com outras frentes do capítulo; mantenha apenas se a relação esforço-retorno fizer sentido na sua rotina.',
  ];

  return {
    strategies: null,
    phases: [
      { label: 'Dias 1 a 3 — Configuração e Qualificação', items: phase1Items },
      { label: 'Dias 4 a 9 — Primeiras Entregas e Controle de Qualidade', items: phase2Items },
      { label: 'Dias 10 a 14 — Revisão de Retorno e Primeiro Saque', items: phase3Items },
    ],
  };
}

function buildBanChecklist(program: BookProgramRow, chapter: ChapterSpec): string[] {
  const slugOverrides: Record<string, string[]> = {
    honeygain: [
      'Instalar em rede corporativa, universitária ou VPN/VPS (gera bloqueio automático por IP não residencial)',
      'Conectar mais dispositivos por IP do que o limite permitido nos termos atuais',
      'Esperar retorno alto sem considerar consumo de energia e pacote de dados móveis',
    ],
    'pawns-app': [
      'Usar VPN, proxy ou múltiplos emuladores no mesmo IP residencial',
      'Responder pesquisas internas de forma contraditória ou rápida demais (atenção a checagens automáticas)',
      'Tentar sacar abaixo do mínimo sem validar a carteira ou método disponível no Brasil',
    ],
    repocket: [
      'Rodar em servidores em nuvem ou redes compartilhadas de terceiros',
      'Deixar permissões de rede sem revisão em dispositivos que contêm dados sensíveis',
      'Contar apenas com tráfego passivo sem conferir limite mínimo de retirada',
    ],
    sideshift: [
      'Enviar criptoativos na rede blockchain errada (perda irreversível de fundos)',
      'Ignorar variação de taxas de rede, spread e obrigações fiscais locais no Brasil',
      'Promover operações cripto como ganho garantido para terceiros',
    ],
    'mercado-pago': [
      'Criar indicações simuladas entre contas próprias ou de familiares sem uso real',
      'Divulgar valores promocionais expirados como se fossem permanentes',
      'Ignorar o prazo e a exigência de primeira transação qualificada do indicado',
    ],
    'quintoandar-indica-ai': [
      'Cadastrar imóveis sem autorização explícita do proprietário',
      'Indicar imóveis fora das cidades e bairros cobertos pela plataforma',
      'Duplicar indicações já cadastradas anteriormente na base',
    ],
    'amazon-kdp-ebooks': [
      'Publicar conteúdo copiado, de domínio público mal formatado ou gerado sem revisão humana',
      'Usar palavras-chave, subtítulos com spam ou capas enganosas na página da Amazon',
      'Esquecer de configurar corretamente o formulário fiscal W-8BEN e dados da conta Wise/Payoneer',
    ],
  };

  return slugOverrides[program.slug] ?? chapter.defaultBanChecklist;
}

function buildToolsAndPrompt(
  program: BookProgramRow,
  chapter: ChapterSpec,
): { tools: string[]; promptTitle: string; promptText: string } {
  return {
    tools: chapter.defaultTools,
    promptTitle: chapter.promptTitle,
    promptText: chapter.buildPrompt(program),
  };
}

function renderListItems(items: readonly string[]): string {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
}

function renderDossierKindle(
  program: BookProgramRow,
  chapter: ChapterSpec,
  seqNumber: number,
): string {
  const numberLabel = String(seqNumber).padStart(2, '0');
  const cleanUrl = formatCleanUrl(program.websiteUrl);
  const investmentLabel = program.zeroInvestmentRequired
    ? 'Zero investimento inicial'
    : 'Com investimento inicial';
  const payments =
    program.paymentMethods.length > 0
      ? program.paymentMethods.join(', ')
      : chapter.defaultPayments.join(', ');
  const earning =
    program.earningPotential && program.earningPotential.trim().length > 0
      ? program.earningPotential.trim()
      : 'Variável conforme demanda, qualificação e volume de entregas (sem ganho fixo)';
  const rating = formatEditorialRating(program.editorialRating);
  const languages = inferLanguages(program);
  const tags = formatTags(program.tags);

  const guidanceParagraphs = buildOperationalGuidance(program, chapter.id);
  const { strategies, phases } = buildFirstWithdrawalRoadmap(program, chapter);
  const pros = program.pros.length > 0 ? program.pros : chapter.defaultPros;
  const cons = program.cons.length > 0 ? program.cons : chapter.defaultCons;
  const banChecklist = buildBanChecklist(program, chapter);
  const { tools, promptTitle, promptText } = buildToolsAndPrompt(program, chapter);

  const roadmapHtml = strategies
    ? strategies
        .map(
          (strategy) =>
            `<h5>${escapeHtml(strategy.title)}</h5><ol>${renderListItems(strategy.steps)}</ol>`,
        )
        .join('')
    : phases
        .map(
          (phase) =>
            `<h5>${escapeHtml(phase.label)}</h5><ul>${renderListItems(phase.items)}</ul>`,
        )
        .join('');

  return [
    `<article class="dossier" id="programa-${escapeHtml(program.slug)}">`,
    `<h3>${numberLabel}. ${escapeHtml(program.name)}</h3>`,
    `<p class="dossier-url"><strong>Site oficial:</strong> ${escapeHtml(cleanUrl)}</p>`,
    `<div class="xray-block">`,
    `<h4>Raio-X Rápido</h4>`,
    `<ul>`,
    `<li><strong>Categoria:</strong> ${escapeHtml(program.category)}</li>`,
    `<li><strong>Investimento:</strong> ${escapeHtml(investmentLabel)}</li>`,
    `<li><strong>Dificuldade:</strong> ${escapeHtml(formatDifficulty(program.difficulty))}</li>`,
    `<li><strong>Pagamento:</strong> ${escapeHtml(payments)}</li>`,
    `<li><strong>Potencial de ganho:</strong> ${escapeHtml(earning)}</li>`,
    `<li><strong>Nota Editorial NKL:</strong> ${escapeHtml(rating)}</li>`,
    `<li><strong>Idiomas e Tags:</strong> ${escapeHtml(languages)} — ${escapeHtml(tags)}</li>`,
    `</ul>`,
    `</div>`,
    `<h4>Como Funciona na Prática</h4>`,
    guidanceParagraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join(''),
    `<h4>Roteiro do Primeiro Saque (Dias 1 a 14)</h4>`,
    roadmapHtml,
    `<h4>Pontos Fortes vs. Cuidados Reais</h4>`,
    `<p><strong>Pontos fortes:</strong></p>`,
    `<ul>${renderListItems(pros)}</ul>`,
    `<p><strong>Cuidados reais:</strong></p>`,
    `<ul>${renderListItems(cons)}</ul>`,
    `<h4>Erros Comuns que Causam Reprovação ou Banimento</h4>`,
    `<ul>${renderListItems(banChecklist)}</ul>`,
    `<h4>Ferramentas de Apoio &amp; Prompt de IA Aplicado</h4>`,
    `<ul>${renderListItems(tools)}</ul>`,
    `<p><strong>${escapeHtml(promptTitle)}:</strong></p>`,
    `<blockquote class="ai-prompt"><p>${escapeHtml(promptText)}</p></blockquote>`,
    `<hr />`,
    `</article>`,
  ].join('\n');
}

function renderDossierPrint(
  program: BookProgramRow,
  chapter: ChapterSpec,
  seqNumber: number,
): string {
  const numberLabel = String(seqNumber).padStart(2, '0');
  const cleanUrl = formatCleanUrl(program.websiteUrl);
  const investmentLabel = program.zeroInvestmentRequired
    ? 'Zero investimento inicial'
    : 'Com investimento inicial';
  const payments =
    program.paymentMethods.length > 0
      ? program.paymentMethods.join(', ')
      : chapter.defaultPayments.join(', ');
  const earning =
    program.earningPotential && program.earningPotential.trim().length > 0
      ? program.earningPotential.trim()
      : 'Variável conforme demanda, qualificação e volume de entregas (sem ganho fixo)';
  const rating = formatEditorialRating(program.editorialRating);
  const languages = inferLanguages(program);
  const tags = formatTags(program.tags);

  const guidanceParagraphs = buildOperationalGuidance(program, chapter.id);
  const { strategies, phases } = buildFirstWithdrawalRoadmap(program, chapter);
  const pros = program.pros.length > 0 ? program.pros : chapter.defaultPros;
  const cons = program.cons.length > 0 ? program.cons : chapter.defaultCons;
  const banChecklist = buildBanChecklist(program, chapter);
  const { tools, promptTitle, promptText } = buildToolsAndPrompt(program, chapter);

  const roadmapHtml = strategies
    ? strategies
        .map(
          (strategy) =>
            `<div class="roadmap-block"><h5>${escapeHtml(strategy.title)}</h5><ol>${renderListItems(strategy.steps)}</ol></div>`,
        )
        .join('')
    : phases
        .map(
          (phase) =>
            `<div class="roadmap-block"><h5>${escapeHtml(phase.label)}</h5><ul>${renderListItems(phase.items)}</ul></div>`,
        )
        .join('');

  return [
    `<article class="dossier dossier-print" id="print-programa-${escapeHtml(program.slug)}">`,
    `<header class="dossier-header">`,
    `<div class="dossier-badge">Dossiê ${numberLabel} · ${escapeHtml(investmentLabel)}</div>`,
    `<h3>${numberLabel}. ${escapeHtml(program.name)}</h3>`,
    `<p class="dossier-url">URL oficial: <span>${escapeHtml(cleanUrl)}</span></p>`,
    `</header>`,
    `<div class="xray-grid">`,
    `<div class="xray-title">Raio-X Rápido</div>`,
    `<ul class="xray-list">`,
    `<li><strong>Categoria:</strong> ${escapeHtml(program.category)}</li>`,
    `<li><strong>Investimento:</strong> ${escapeHtml(investmentLabel)}</li>`,
    `<li><strong>Dificuldade:</strong> ${escapeHtml(formatDifficulty(program.difficulty))}</li>`,
    `<li><strong>Pagamento:</strong> ${escapeHtml(payments)}</li>`,
    `<li><strong>Potencial de ganho:</strong> ${escapeHtml(earning)}</li>`,
    `<li><strong>Nota Editorial NKL:</strong> ${escapeHtml(rating)}</li>`,
    `<li><strong>Idiomas:</strong> ${escapeHtml(languages)}</li>`,
    `<li><strong>Tags:</strong> ${escapeHtml(tags)}</li>`,
    `</ul>`,
    `</div>`,
    `<section class="dossier-section">`,
    `<h4>Como Funciona na Prática</h4>`,
    guidanceParagraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join(''),
    `</section>`,
    `<section class="dossier-section">`,
    `<h4>Roteiro do Primeiro Saque (Dias 1 a 14)</h4>`,
    roadmapHtml,
    `</section>`,
    `<section class="dossier-section two-col">`,
    `<div class="col-pros"><h4>Pontos Fortes</h4><ul>${renderListItems(pros)}</ul></div>`,
    `<div class="col-cons"><h4>Cuidados Reais</h4><ul>${renderListItems(cons)}</ul></div>`,
    `</section>`,
    `<section class="dossier-section warning-box">`,
    `<h4>Erros Comuns que Causam Reprovação ou Banimento</h4>`,
    `<ul>${renderListItems(banChecklist)}</ul>`,
    `</section>`,
    `<section class="dossier-section prompt-box">`,
    `<h4>Ferramentas de Apoio &amp; Prompt de IA Aplicado</h4>`,
    `<ul>${renderListItems(tools)}</ul>`,
    `<p class="prompt-label"><strong>${escapeHtml(promptTitle)}:</strong></p>`,
    `<div class="ai-prompt"><p>${escapeHtml(promptText)}</p></div>`,
    `</section>`,
    `</article>`,
  ].join('\n');
}

function renderPrintWorksheet(chapter: ChapterSpec): string {
  const blankRows = Array.from({ length: 6 }, (_, index) => {
    const slot = index + 1;
    return [
      `<div class="worksheet-entry">`,
      `<p class="worksheet-line"><strong>Teste 0${slot}</strong> · Plataforma: __________________________ · Data início: ____/____ · Data saque: ____/____</p>`,
      `<p class="worksheet-line">Horas totais (estudo + execução): _______ h · Ganho bruto: ____________ · Custos/Taxas: ____________ · <strong>Retorno líquido: ____________</strong></p>`,
      `<p class="worksheet-line">Observações e decisão (Continuar / Ajustar / Descartar): ____________________________________________________________________</p>`,
      `</div>`,
    ].join('\n');
  }).join('\n');

  return [
    `<div class="worksheet">`,
    `<h3>Diário de Teste do Capítulo — Anotações de Execução</h3>`,
    `<p class="worksheet-subtitle">${escapeHtml(chapter.title)} · Registre horas reais (incluindo preparação) e saldo líquido após taxas de câmbio.</p>`,
    blankRows,
    `<p class="worksheet-summary"><strong>Conclusão do Capítulo ${chapter.number}:</strong> Principal frente validada: _____________________________ · Valor/hora líquido médio: ____________</p>`,
    `</div>`,
  ].join('\n');
}

export function buildEncyclopediaChapters(
  programs: readonly BookProgramRow[],
): BookChapterPayload[] {
  const buckets: Record<ChapterId, BookProgramRow[]> = {
    'cap-04': [],
    'cap-05': [],
    'cap-06': [],
    'cap-07': [],
    'cap-08': [],
    'cap-09': [],
  };

  for (const program of programs) {
    const targetChapter = resolveChapterId(program);
    buckets[targetChapter].push(program);
  }

  let runningIndex = 0;

  return CHAPTER_ORDER.map((chapterId) => {
    const spec = CHAPTER_SPECS[chapterId];
    const sortedPrograms = [...buckets[chapterId]].sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR'),
    );

    const kindleDossiers = sortedPrograms
      .map((program) => {
        runningIndex += 1;
        return renderDossierKindle(program, spec, runningIndex);
      })
      .join('\n');

    const chapterStartIndex = runningIndex - sortedPrograms.length;
    const printDossiers = sortedPrograms
      .map((program, idx) =>
        renderDossierPrint(program, spec, chapterStartIndex + idx + 1),
      )
      .join('\n');

    const htmlKindle = [
      `<section class="chapter" id="${spec.id}">`,
      `<h2>${escapeHtml(spec.title)}</h2>`,
      `<p class="chapter-subtitle"><em>${escapeHtml(spec.subtitle)}</em></p>`,
      `<p class="chapter-intro">${escapeHtml(spec.intro)}</p>`,
      `<p class="chapter-count"><strong>Frentes analisadas neste capítulo:</strong> ${sortedPrograms.length}</p>`,
      `<hr />`,
      kindleDossiers,
      `</section>`,
    ].join('\n');

    const htmlPrint = [
      `<section class="chapter chapter-print" id="print-${spec.id}">`,
      `<header class="chapter-header">`,
      `<h2>${escapeHtml(spec.title)}</h2>`,
      `<p class="chapter-subtitle"><em>${escapeHtml(spec.subtitle)}</em></p>`,
      `<p class="chapter-intro">${escapeHtml(spec.intro)}</p>`,
      `<p class="chapter-count"><strong>Frentes analisadas neste capítulo:</strong> ${sortedPrograms.length}</p>`,
      `</header>`,
      printDossiers,
      renderPrintWorksheet(spec),
      `</section>`,
    ].join('\n');

    return {
      id: spec.id,
      tocLabel: spec.tocLabel,
      title: spec.title,
      subtitle: spec.subtitle,
      htmlKindle,
      htmlPrint,
    };
  });
}
