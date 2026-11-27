import type { PartnerProgramCard } from '@/actions/partner-programs';

export type ProgramComparisonDefinition = {
  slug: string;
  leftSlug: string;
  rightSlug: string;
  title: string;
  focusKeyword: string;
};

export const PROGRAM_COMPARISONS: ProgramComparisonDefinition[] = [
  {
    slug: 'outlier-ai-vs-dataannotation',
    leftSlug: 'outlier-ai',
    rightSlug: 'dataannotation',
    title: 'Outlier AI vs DataAnnotation: qual paga melhor para treinar IA?',
    focusKeyword: 'outlier ai vs dataannotation',
  },
  {
    slug: 'micro1-vs-outlier-ai',
    leftSlug: 'micro1',
    rightSlug: 'outlier-ai',
    title: 'Micro1 vs Outlier AI: comparativo de vagas e ganhos em IA',
    focusKeyword: 'micro1 vs outlier ai',
  },
  {
    slug: 'prolific-vs-dscout',
    leftSlug: 'prolific',
    rightSlug: 'dscout',
    title: 'Prolific vs Dscout: qual paga melhor em pesquisas remuneradas?',
    focusKeyword: 'prolific vs dscout',
  },
  {
    slug: 'utest-vs-testlio',
    leftSlug: 'utest',
    rightSlug: 'testlio',
    title: 'uTest vs Testlio: qual plataforma de testes QA vale mais a pena?',
    focusKeyword: 'utest vs testlio',
  },
  {
    slug: 'fiverr-vs-upwork',
    leftSlug: 'fiverr',
    rightSlug: 'upwork',
    title: 'Fiverr vs Upwork: onde começar a prestar serviços em dólar?',
    focusKeyword: 'fiverr vs upwork',
  },
  {
    slug: 'billo-vs-joinbrands',
    leftSlug: 'billo',
    rightSlug: 'joinbrands',
    title: 'Billo vs JoinBrands: qual escolher para criar conteúdo UGC?',
    focusKeyword: 'billo vs joinbrands',
  },
  {
    slug: 'honeygain-vs-repocket',
    leftSlug: 'honeygain',
    rightSlug: 'repocket',
    title: 'Honeygain vs Repocket: qual paga mais por compartilhamento de rede?',
    focusKeyword: 'honeygain vs repocket',
  },
  {
    slug: 'clickworker-vs-oneforma',
    leftSlug: 'clickworker',
    rightSlug: 'oneforma',
    title: 'Clickworker vs OneForma: comparativo de microtarefas e coleta de dados',
    focusKeyword: 'clickworker vs oneforma',
  },
  {
    slug: 'amazon-kdp-ebooks-vs-hotmart',
    leftSlug: 'amazon-kdp-ebooks',
    rightSlug: 'hotmart',
    title: 'Amazon KDP vs Hotmart: onde vender livros e produtos digitais?',
    focusKeyword: 'amazon kdp vs hotmart',
  },
  {
    slug: 'printful-print-on-demand-vs-montink-embaixador',
    leftSlug: 'printful-print-on-demand',
    rightSlug: 'montink-embaixador',
    title: 'Printful vs Montink: qual operação de impressão sob demanda escolher?',
    focusKeyword: 'printful vs montink',
  },
  {
    slug: 'mindrift-vs-claru-ia',
    leftSlug: 'mindrift',
    rightSlug: 'claru-ia',
    title: 'Mindrift vs Claru IA: comparativo para avaliadores e redatores de IA',
    focusKeyword: 'mindrift vs claru ia',
  },
  {
    slug: 'jumptask-vs-attapoll',
    leftSlug: 'jumptask',
    rightSlug: 'attapoll',
    title: 'JumpTask vs AttaPoll: qual aplicativo rende melhor em tarefas rápidas?',
    focusKeyword: 'jumptask vs attapoll',
  },
];

export function getProgramComparisonBySlug(slug: string): ProgramComparisonDefinition | null {
  const normalized = slug.trim().toLowerCase();
  return PROGRAM_COMPARISONS.find((entry) => entry.slug === normalized) ?? null;
}

export function getProgramComparisonsForSlug(programSlug: string): ProgramComparisonDefinition[] {
  const normalized = programSlug.trim().toLowerCase();
  return PROGRAM_COMPARISONS.filter(
    (entry) => entry.leftSlug === normalized || entry.rightSlug === normalized,
  );
}

const PORTUGUESE_PATTERN = /portugu[eê]s|pt-br|\bpt\b/iu;

function supportsPortuguese(program: PartnerProgramCard): boolean {
  return program.languages.some((language) => PORTUGUESE_PATTERN.test(language));
}

function buildChooseReasons(
  primary: PartnerProgramCard,
  other: PartnerProgramCard,
): string[] {
  const reasons: string[] = [];

  if (primary.finalRating > other.finalRating) {
    reasons.push(
      `Busca nota geral mais alta na base do Portal NKL (${primary.finalRating}/10 contra ${other.finalRating}/10 de ${other.name}).`,
    );
  } else {
    reasons.push(
      `Tem interesse no formato de ${primary.category} com ganho de referência de ${primary.averageEarning}.`,
    );
  }

  if (primary.zeroInvestmentRequired && !other.zeroInvestmentRequired) {
    reasons.push('Precisa começar sem investimento inicial obrigatório.');
  } else if (primary.zeroInvestmentRequired) {
    reasons.push(
      `Prefere entrada sem taxa inicial e dificuldade ${primary.difficulty.toLowerCase()} na rotina de ${primary.category}.`,
    );
  } else {
    reasons.push(
      `Aceita estruturar o projeto em ${primary.category} mesmo que demande investimento ou recursos próprios.`,
    );
  }

  const primaryPt = supportsPortuguese(primary);
  const otherPt = supportsPortuguese(other);
  if (primaryPt && !otherPt) {
    reasons.push(
      `Prefere operar em português (${primary.languages.join(', ')}), enquanto ${other.name} exige ${other.languages.join(', ') || 'outro idioma'}.`,
    );
  } else if (primary.languages.length > 0) {
    reasons.push(`Atende os idiomas do seu perfil (${primary.languages.join(', ')}).`);
  }

  if (primary.paymentMethods.length > 0) {
    reasons.push(
      `Utiliza os meios de recebimento disponíveis na plataforma (${primary.paymentMethods.slice(0, 3).join(', ')}).`,
    );
  } else if (primary.pros.length > 0) {
    reasons.push(primary.pros[0]);
  } else if (primary.requirements.length > 0) {
    reasons.push(`Cumpre facilmente o requisito principal: ${primary.requirements[0]}.`);
  }

  return reasons.slice(0, 4);
}

export function buildProgramComparisonVerdict(
  left: PartnerProgramCard,
  right: PartnerProgramCard,
): { bluf: string; chooseLeft: string[]; chooseRight: string[] } {
  const categorySummary =
    left.category.trim().toLowerCase() === right.category.trim().toLowerCase()
      ? `Ambas atuam em ${left.category}.`
      : `${left.name} atua em ${left.category}, enquanto ${right.name} tem foco em ${right.category}.`;

  const ratingSummary =
    left.finalRating === right.finalRating
      ? `As duas aparecem com nota ${left.finalRating}/10 no Portal NKL.`
      : left.finalRating > right.finalRating
        ? `${left.name} lidera na nota geral (${left.finalRating}/10 contra ${right.finalRating}/10).`
        : `${right.name} lidera na nota geral (${right.finalRating}/10 contra ${left.finalRating}/10).`;

  const investmentSummary =
    left.zeroInvestmentRequired && right.zeroInvestmentRequired
      ? 'As duas permitem iniciar sem investimento financeiro.'
      : left.zeroInvestmentRequired
        ? `${left.name} permite começar sem investimento inicial, ao contrário de ${right.name}.`
        : right.zeroInvestmentRequired
          ? `${right.name} permite começar sem investimento inicial, ao contrário de ${left.name}.`
          : 'Ambas podem exigir investimento ou estrutura prévia para operar.';

  const bluf = [
    categorySummary,
    `Na referência de ganhos, ${left.name} registra ${left.averageEarning} (dificuldade ${left.difficulty.toLowerCase()}) e ${right.name} registra ${right.averageEarning} (dificuldade ${right.difficulty.toLowerCase()}).`,
    ratingSummary,
    investmentSummary,
  ].join(' ');

  return {
    bluf,
    chooseLeft: buildChooseReasons(left, right),
    chooseRight: buildChooseReasons(right, left),
  };
}
