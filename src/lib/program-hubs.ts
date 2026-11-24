import type { PartnerProgramCard } from '@/actions/partner-programs';

export type ProgramHubSlug =
  | 'celular'
  | 'sem-investimento'
  | 'trabalho-remoto'
  | 'pesquisas-remuneradas'
  | 'com-ia'
  | 'afiliados'
  | 'home-office'
  | 'com-investimento';

export type ProgramHubDefinition = {
  slug: ProgramHubSlug;
  title: string;
  description: string;
  intro: string;
  criteria: string[];
  relatedHubs: ProgramHubSlug[];
  matches: (program: PartnerProgramCard) => boolean;
};

function searchableProgramText(program: PartnerProgramCard): string {
  return [
    program.name,
    program.category,
    program.shortDescription,
    program.tags.join(' '),
    program.requirements.join(' '),
  ].join(' ').toLocaleLowerCase('pt-BR');
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

export const PROGRAM_HUBS: Record<ProgramHubSlug, ProgramHubDefinition> = {
  celular: {
    slug: 'celular',
    title: 'Renda extra pelo celular',
    description: 'Caminhos catalogados para usar o celular em indicações, conteúdo, pesquisas e tarefas digitais, com regras para comparar antes de começar.',
    intro: 'Usar o celular pode ser um ponto de partida, mas o aparelho não transforma uma oportunidade em renda garantida. Compare exigências, privacidade, disponibilidade regional e o tempo necessário para cada caminho.',
    criteria: [
      'Verifique se a tarefa funciona no seu aparelho e na sua região.',
      'Leia as regras de indicação, conteúdo ou coleta de dados antes de aceitar.',
      'Comece por uma atividade pequena e registre tempo, custos e retorno real.',
    ],
    relatedHubs: ['sem-investimento', 'home-office', 'pesquisas-remuneradas'],
    matches: (program) => includesAny(searchableProgramText(program), [
      'celular',
      'app',
      'tiktok',
      'internet ociosa',
      'carteira digital',
    ]),
  },
  'sem-investimento': {
    slug: 'sem-investimento',
    title: 'Renda extra sem investimento inicial',
    description: 'Oportunidades marcadas no catálogo como sem necessidade de pagamento inicial, sempre sujeitas às regras e aos requisitos de cada plataforma.',
    intro: '“Sem investimento inicial” significa que a plataforma não exige um pagamento para liberar a oportunidade conforme os dados editoriais disponíveis. Ainda podem existir custos de equipamento, internet, tempo, impostos ou produção.',
    criteria: [
      'Desconfie de qualquer cobrança para desbloquear cadastro, tarefa ou saque.',
      'Separe custos indiretos, como internet, equipamento, transporte e impostos.',
      'Confirme as condições diretamente na plataforma antes de compartilhar dados.',
    ],
    relatedHubs: ['celular', 'com-ia', 'trabalho-remoto'],
    matches: (program) => program.zeroInvestmentRequired,
  },
  'trabalho-remoto': {
    slug: 'trabalho-remoto',
    title: 'Trabalho remoto e serviços pela internet',
    description: 'Explore plataformas de serviços, conteúdo, dados e tarefas que podem ser realizadas remotamente, sem tratar disponibilidade ou aprovação como garantia.',
    intro: 'Trabalho remoto pode significar prestação de serviço, produção de conteúdo, pesquisa ou tarefas sob demanda. A melhor escolha depende das suas habilidades, idioma, equipamento, portfólio e disponibilidade.',
    criteria: [
      'Escolha uma habilidade que você consiga demonstrar com exemplos concretos.',
      'Confirme idioma, horário, país elegível e forma de pagamento.',
      'Leia o briefing e as regras de uso de imagem, dados e propriedade intelectual.',
    ],
    relatedHubs: ['home-office', 'com-ia', 'pesquisas-remuneradas'],
    matches: (program) => includesAny(searchableProgramText(program), [
      'remoto',
      'freelance',
      'serviço',
      'conteúdo',
      'dados',
      'em casa',
    ]),
  },
  'pesquisas-remuneradas': {
    slug: 'pesquisas-remuneradas',
    title: 'Pesquisas remuneradas e estudos',
    description: 'Compare plataformas de pesquisas e estudos remunerados considerando perfil, disponibilidade de convites, idioma e método de pagamento.',
    intro: 'Pesquisas remuneradas dependem do seu perfil e da demanda de cada estudo. Você pode receber convites diferentes de outras pessoas, e a quantidade de tarefas pode variar bastante ao longo do tempo.',
    criteria: [
      'Preencha o perfil com informações consistentes e verdadeiras.',
      'Confira a remuneração, o tempo estimado e o método de saque antes de participar.',
      'Nunca pague para responder uma pesquisa ou liberar um saque.',
    ],
    relatedHubs: ['sem-investimento', 'celular', 'trabalho-remoto'],
    matches: (program) => includesAny(searchableProgramText(program), [
      'pesquisa',
      'pesquisas',
      'estudo',
      'estudos',
      'entrevista',
    ]),
  },
  'com-ia': {
    slug: 'com-ia',
    title: 'Renda extra com Inteligência Artificial (IA)',
    description: 'Plataformas de treinamento de modelos de IA, curadoria de dados, criação de vídeos, cortes virais e automações digitais.',
    intro: 'O mercado de Inteligência Artificial abriu duas frentes práticas: atuar como avaliador e treinador de respostas de IA (em plataformas remotas) ou usar ferramentas de IA para acelerar serviços, vídeos, e-books e automações.',
    criteria: [
      'Verifique se o projeto exige inglês técnico ou testes de qualificação iniciais.',
      'Use contas de recebimento internacional transparentes (como Wise ou Payoneer) quando o pagamento for em dólar.',
      'Não automatize tarefas onde a plataforma exige validação humana autêntica.',
    ],
    relatedHubs: ['trabalho-remoto', 'sem-investimento', 'com-investimento'],
    matches: (program) => includesAny(searchableProgramText(program), [
      'ia ',
      ' ia',
      'inteligência artificial',
      'ai ',
      'outlier',
      'micro1',
      'dataannotation',
      'claru',
      'mindrift',
      'notebooklm',
      'automação',
      'cortes virais',
    ]),
  },
  afiliados: {
    slug: 'afiliados',
    title: 'Renda extra como afiliado',
    description: 'Programas de indicação, marketplaces brasileiros, afiliados B2B recorrentes e recomendações com comissão real por venda ou cadastro.',
    intro: 'Trabalhar com links de afiliado exige audiência qualificada, comparação honesta de produtos ou solução direta de uma dúvida do comprador. Priorize programas oficiais e ferramentas que você realmente testou.',
    criteria: [
      'Sempre informe com clareza quando um link for de indicação ou parceria.',
      'Compare comissão única (marketplaces) versus comissão recorrente (SaaS B2B).',
      'Crie conteúdo útil que resolva o problema da busca antes de enviar o link.',
    ],
    relatedHubs: ['sem-investimento', 'home-office', 'com-ia'],
    matches: (program) => includesAny(searchableProgramText(program), [
      'afiliad',
      'indica',
      'comiss',
      'marketplace',
      'hotmart',
      'amazon',
      'b2b',
    ]),
  },
  'home-office': {
    slug: 'home-office',
    title: 'Renda extra em casa (Home Office)',
    description: 'Ideias e plataformas para trabalhar de casa no computador ou celular com horários flexíveis, UGC, escrita, testes e freelancing.',
    intro: 'Fazer renda extra em casa funciona melhor quando você separa blocos fixos na agenda e escolhe canais compatíveis com a sua estrutura (internet estável, fone/microfone básico ou computador).',
    criteria: [
      'Defina quantas horas por semana você realmente consegue manter com consistência.',
      'Comece por 1 ou 2 plataformas antes de se cadastrar em dez ao mesmo tempo.',
      'Organize custos e recebimentos separados da sua conta pessoal principal.',
    ],
    relatedHubs: ['trabalho-remoto', 'celular', 'afiliados'],
    matches: (program) => includesAny(searchableProgramText(program), [
      'em casa',
      'home office',
      'remoto',
      'ugc',
      'freelance',
      'kdp',
      'ebook',
      'e-book',
    ]),
  },
  'com-investimento': {
    slug: 'com-investimento',
    title: 'Renda extra com baixo investimento inicial',
    description: 'Modelos escaláveis que pedem ferramentas, anúncios ou capital enxuto para acelerar criação de produtos, lojas, automações e canais.',
    intro: 'Diferente das plataformas de tarefas avulsas, modelos com pequeno investimento inicial (como ferramentas de IA, hospedagem, print on demand ou tráfego) exigem gestão de caixa, validação de demanda e disciplina de execução.',
    criteria: [
      'Nunca comprometa reserva de emergência em ferramentas ou anúncios.',
      'Valide a primeira venda no orgânico antes de escalar verba paga.',
      'Calcule margem líquida descontando plataforma, câmbio e impostos.',
    ],
    relatedHubs: ['com-ia', 'afiliados', 'sem-investimento'],
    matches: (program) => !program.zeroInvestmentRequired,
  },
};

export function getProgramHub(slug: string): ProgramHubDefinition | null {
  return slug in PROGRAM_HUBS ? PROGRAM_HUBS[slug as ProgramHubSlug] : null;
}

export function filterProgramsForHub(programs: PartnerProgramCard[], slug: ProgramHubSlug): PartnerProgramCard[] {
  return programs.filter(PROGRAM_HUBS[slug].matches);
}

export function getMatchingProgramHubs(program: PartnerProgramCard): ProgramHubDefinition[] {
  return Object.values(PROGRAM_HUBS).filter((hub) => hub.matches(program));
}
