import type { PartnerProgramCard } from '@/actions/partner-programs';

export type ProgramHubSlug = 'celular' | 'sem-investimento' | 'trabalho-remoto' | 'pesquisas-remuneradas';

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
    relatedHubs: ['sem-investimento', 'pesquisas-remuneradas'],
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
    relatedHubs: ['celular', 'trabalho-remoto'],
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
    relatedHubs: ['celular', 'pesquisas-remuneradas'],
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
    relatedHubs: ['sem-investimento', 'trabalho-remoto'],
    matches: (program) => includesAny(searchableProgramText(program), [
      'pesquisa',
      'pesquisas',
      'estudo',
      'estudos',
      'entrevista',
    ]),
  },
};

export function getProgramHub(slug: string): ProgramHubDefinition | null {
  return slug in PROGRAM_HUBS ? PROGRAM_HUBS[slug as ProgramHubSlug] : null;
}

export function filterProgramsForHub(programs: PartnerProgramCard[], slug: ProgramHubSlug): PartnerProgramCard[] {
  return programs.filter(PROGRAM_HUBS[slug].matches);
}
