const MICRO1_REFERRAL_CODE = '1ec6a2a7-5769-47a2-bbc8-5f9db5198d04';
const MICRO1_API_BASE = 'https://prod-api.micro1.ai/api/v1/job/portal/referral';
const MICRO1_PAGE_SIZE = 100;
const MICRO1_MAX_PAGES = 20;
export const MICRO1_REFERRAL_URL = `https://refer.micro1.ai/referral/jobs?referralCode=${MICRO1_REFERRAL_CODE}&utm_source=referral&utm_medium=share&utm_campaign=job_referral`;
export const MICRO1_EDITORIAL_USD_BRL_RATE = 5.2;

export type Micro1HourlyRate = {
  min: number;
  max: number;
};

export type Micro1Opportunity = {
  jobId: string;
  jobName: string;
  companyName: string;
  datePosted: string | null;
  openings: number | null;
  highDemand: boolean;
  roleType: string | null;
  jobType: string | null;
  domainSlug: string;
  skills: string[];
  referralRewardUsd: number | null;
  applyUrl: string;
  hourlyRate: Micro1HourlyRate | null;
  monthlySalary: { min: number; max: number } | null;
  yearlyCompensation: string | null;
};

export type Micro1OpportunityCategory = {
  slug: string;
  label: string;
  count: number;
};

export type Micro1FilterOption = Micro1OpportunityCategory & {
  kind: 'quick' | 'domain';
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function positiveNumberPair(value: unknown): { min: number; max: number } | null {
  if (!isRecord(value)) return null;
  const min = numberValue(value.min);
  const max = numberValue(value.max);
  if (min === null || max === null || min < 0 || max < min) return null;
  return { min, max };
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function parseOpportunity(value: unknown): Micro1Opportunity | null {
  if (!isRecord(value)) return null;

  const jobId = stringValue(value.job_id);
  const jobName = stringValue(value.job_name);
  const applyUrl = stringValue(value.apply_url);
  if (!jobId || !jobName || !applyUrl) return null;

  const hourlyRate = positiveNumberPair(value.ideal_hourly_rate);
  const monthlyMin = numberValue(value.ideal_monthly_salary_min);
  const monthlyMax = numberValue(value.ideal_monthly_salary_max);
  const monthlySalary = monthlyMin !== null && monthlyMax !== null && monthlyMin >= 0 && monthlyMax >= monthlyMin
    ? { min: monthlyMin, max: monthlyMax }
    : null;

  return {
    jobId,
    jobName,
    companyName: stringValue(value.company_name) ?? 'micro1',
    datePosted: stringValue(value.date_posted),
    openings: numberValue(value.no_of_openings),
    highDemand: value.is_high_demand_job === '1' || value.is_high_demand_job === 1 || value.is_high_demand_job === true,
    roleType: stringValue(value.role_type),
    jobType: stringValue(value.job_type),
    domainSlug: stringValue(value.domain_slug) ?? 'other',
    skills: stringArray(value.skills),
    referralRewardUsd: numberValue(value.referral_reward_amount),
    applyUrl,
    hourlyRate,
    monthlySalary,
    yearlyCompensation: typeof value.ideal_yearly_compensation === 'string'
      ? value.ideal_yearly_compensation
      : null,
  };
}

export const MICRO1_FETCH_TIMEOUT_MS = 8_000;

type FetchLike = typeof fetch;

async function fetchPage(
  page: number,
  fetchImpl: FetchLike = fetch,
): Promise<{ total: number; opportunities: Micro1Opportunity[] }> {
  const url = `${MICRO1_API_BASE}/${MICRO1_REFERRAL_CODE}/jobs?page=${page}&limit=${MICRO1_PAGE_SIZE}`;
  const response = await fetchImpl(url, {
    headers: {
      accept: 'application/json',
      'x-custom-lang': 'en',
    },
    signal: AbortSignal.timeout(MICRO1_FETCH_TIMEOUT_MS),
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    throw new Error(`Micro1 respondeu HTTP ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload) || payload.status !== true || !Array.isArray(payload.data)) {
    throw new Error('A resposta da Micro1 não contém uma lista de oportunidades válida.');
  }

  const opportunities = payload.data
    .map(parseOpportunity)
    .filter((item): item is Micro1Opportunity => item !== null);
  const total = numberValue(payload.total) ?? opportunities.length;
  return { total, opportunities };
}

export async function getMicro1Opportunities(
  fetchImpl: FetchLike = fetch,
): Promise<Micro1Opportunity[]> {
  const firstPage = await fetchPage(1, fetchImpl);
  const pageCount = Math.ceil(firstPage.total / MICRO1_PAGE_SIZE);
  if (pageCount > MICRO1_MAX_PAGES) {
    throw new Error(`A lista da Micro1 excede o limite editorial de ${MICRO1_MAX_PAGES * MICRO1_PAGE_SIZE} vagas.`);
  }
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(pageCount - 1, 0) }, (_, index) => fetchPage(index + 2, fetchImpl)),
  );
  const opportunities = [firstPage, ...remainingPages].flatMap((page) => page.opportunities);
  const uniqueOpportunities = Array.from(new Map(opportunities.map((item) => [item.jobId, item])).values());
  if (uniqueOpportunities.length < firstPage.total) {
    console.warn(
      `[MICRO1] Paginação retornou ${uniqueOpportunities.length} de ${firstPage.total} vagas esperadas; mantendo itens únicos coletados.`,
    );
  }
  return uniqueOpportunities;
}

const DOMAIN_LABELS: Record<string, string> = {
  'ai-machine-learning': 'IA e aprendizado de máquina',
  'applied-engineering': 'Engenharia aplicada',
  'arts-design': 'Arte e design',
  'business-operations': 'Negócios e operações',
  cybersecurity: 'Cibersegurança',
  'data-analysis': 'Dados e análise',
  education: 'Educação',
  finance: 'Finanças',
  generalist: 'Tarefas gerais',
  humanities: 'Humanidades',
  'language-audio': 'Idiomas e áudio',
  law: 'Direito',
  medicine: 'Medicina e saúde',
  other: 'Outras especialidades',
  robotics: 'Robótica e vídeo',
  'sales-marketing': 'Vendas e marketing',
  'sciences-research': 'Ciência e pesquisa',
  'software-engineering': 'Tecnologia e programação',
};

export function getMicro1CategoryLabel(domainSlug: string): string {
  return DOMAIN_LABELS[domainSlug] ?? 'Outras especialidades';
}

export function getMicro1Categories(opportunities: Micro1Opportunity[]): Micro1OpportunityCategory[] {
  const counts = new Map<string, number>();
  for (const opportunity of opportunities) {
    counts.set(opportunity.domainSlug, (counts.get(opportunity.domainSlug) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([slug, count]) => ({ slug, count, label: getMicro1CategoryLabel(slug) }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, 'pt-BR'));
}

const QUICK_FILTER_LABELS: Array<{ slug: string; label: string }> = [
  { slug: 'portugues', label: 'Português' },
  { slug: 'facil', label: 'Fácil' },
  { slug: 'medio', label: 'Médio' },
  { slug: 'avancado', label: 'Avançado' },
];

function opportunitySearchText(opportunity: Micro1Opportunity): string {
  return [
    opportunity.jobName,
    opportunity.domainSlug,
    opportunity.roleType ?? '',
    ...opportunity.skills,
  ].join(' ').toLocaleLowerCase('pt-BR');
}

export function matchesMicro1QuickFilter(opportunity: Micro1Opportunity, filterSlug: string): boolean {
  const searchText = opportunitySearchText(opportunity);
  if (filterSlug === 'portugues') {
    return /\b(portuguese|português|brazil|brasil)\b/iu.test(searchText);
  }

  const roleType = opportunity.roleType?.toLocaleLowerCase('en-US');
  if (filterSlug === 'facil') return roleType === 'generalist';
  if (filterSlug === 'avancado') return roleType === 'expert' || roleType === 'specialist';
  if (filterSlug === 'medio') return roleType !== 'generalist' && roleType !== 'expert' && roleType !== 'specialist';
  return false;
}

export function matchesMicro1Filter(opportunity: Micro1Opportunity, filterSlug: string): boolean {
  if (filterSlug in DOMAIN_LABELS) return opportunity.domainSlug === filterSlug;
  return matchesMicro1QuickFilter(opportunity, filterSlug);
}

export function getMicro1FilterOptions(opportunities: Micro1Opportunity[]): Micro1FilterOption[] {
  const quickFilters = QUICK_FILTER_LABELS.map((filter) => ({
    ...filter,
    kind: 'quick' as const,
    count: opportunities.filter((opportunity) => matchesMicro1QuickFilter(opportunity, filter.slug)).length,
  }));
  const domainFilters = getMicro1Categories(opportunities).map((category) => ({
    ...category,
    kind: 'domain' as const,
  }));
  return [...quickFilters, ...domainFilters];
}

export function getMicro1FilterLabel(opportunities: Micro1Opportunity[], filterSlug: string | null): string {
  if (!filterSlug) return `Todas (${opportunities.length})`;
  return getMicro1FilterOptions(opportunities).find((option) => option.slug === filterSlug)?.label ?? 'Filtro selecionado';
}

const TRANSLATIONS: Array<[RegExp, string]> = [
  [/\bSenior Software Engineer\b/giu, 'Engenheiro de software sênior'],
  [/\bSoftware Engineer\b/giu, 'Engenheiro de software'],
  [/\bData Scientist\b/giu, 'Cientista de dados'],
  [/\bEnglish Language Expert\b/giu, 'Especialista em idioma inglês'],
  [/\bPortuguese Bilingual Expert\b/giu, 'Especialista bilíngue em português'],
  [/\bVideo Recorder\b/giu, 'Gravador de vídeo'],
  [/\bCar-Mounted\b/giu, 'Montado em carro'],
  [/\bSenior\b/giu, 'Sênior'],
  [/\bJunior\b/giu, 'Júnior'],
  [/\bLead\b/giu, 'Líder'],
  [/\bExpert\b/giu, 'Especialista'],
  [/\bSpecialist\b/giu, 'Especialista'],
  [/\bEngineer\b/giu, 'Engenheiro'],
  [/\bEngineering\b/giu, 'Engenharia'],
  [/\bDeveloper\b/giu, 'Desenvolvedor'],
  [/\bScientist\b/giu, 'Cientista'],
  [/\bResearcher\b/giu, 'Pesquisador'],
  [/\bAnalyst\b/giu, 'Analista'],
  [/\bDesigner\b/giu, 'Designer'],
  [/\bWriter\b/giu, 'Redator'],
  [/\bEditor\b/giu, 'Editor'],
  [/\bReviewer\b/giu, 'Avaliador'],
  [/\bEvaluator\b/giu, 'Avaliador'],
  [/\bTester\b/giu, 'Testador'],
  [/\bTeacher\b/giu, 'Professor'],
  [/\bTutor\b/giu, 'Tutor'],
  [/\bLanguage\b/giu, 'Idioma'],
  [/\bEnglish\b/giu, 'inglês'],
  [/\bPortuguese\b/giu, 'português'],
  [/\bSpanish\b/giu, 'espanhol'],
  [/\bFrench\b/giu, 'francês'],
  [/\bGerman\b/giu, 'alemão'],
  [/\bVideo\b/giu, 'Vídeo'],
  [/\bAudio\b/giu, 'Áudio'],
  [/\bData\b/giu, 'Dados'],
  [/\bMachine Learning\b/giu, 'Aprendizado de máquina'],
  [/\bArtificial Intelligence\b/giu, 'Inteligência artificial'],
  [/\bContent\b/giu, 'Conteúdo'],
  [/\bOperations\b/giu, 'Operações'],
  [/\bManager\b/giu, 'Gerente'],
  [/\bRemote\b/giu, 'Remoto'],
  [/\bBrazil\b/giu, 'Brasil'],
  [/\bUnited States\b/giu, 'Estados Unidos'],
];

export function translateMicro1Title(title: string): string {
  return TRANSLATIONS.reduce((translated, [pattern, replacement]) => translated.replace(pattern, replacement), title);
}

export function describeMicro1Opportunity(opportunity: Micro1Opportunity): string {
  if (opportunity.domainSlug === 'language-audio') {
    return 'Avalie, transcreva ou revise conteúdos de áudio e linguagem seguindo o idioma e as regras do projeto.';
  }
  if (opportunity.domainSlug === 'robotics') {
    return 'Grave, opere ou revise vídeos e dados capturados com câmeras e equipamentos específicos.';
  }
  if (opportunity.domainSlug === 'software-engineering' || opportunity.domainSlug === 'cybersecurity') {
    return 'Use sua experiência em tecnologia para avaliar, construir ou revisar soluções usadas no treinamento de IA.';
  }
  if (opportunity.domainSlug === 'medicine' || opportunity.domainSlug === 'law' || opportunity.domainSlug === 'finance') {
    return 'Aplique seu conhecimento profissional para revisar conteúdo e melhorar sistemas de inteligência artificial.';
  }
  if (opportunity.roleType === 'expert' || opportunity.roleType === 'specialist') {
    return 'Aplique conhecimento especializado em tarefas de avaliação, treinamento e melhoria de sistemas de IA.';
  }
  return 'Realize tarefas de coleta, revisão ou avaliação de dados conforme o briefing e os critérios do projeto.';
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Math.round(value));
}

export function formatMicro1Pay(opportunity: Micro1Opportunity): { original: string; estimatedBrl: string | null } {
  if (opportunity.hourlyRate) {
    const { min, max } = opportunity.hourlyRate;
    const original = `US$ ${formatNumber(min)}–${formatNumber(max)}/hora`;
    const estimatedBrl = `≈ R$ ${formatNumber(min * MICRO1_EDITORIAL_USD_BRL_RATE)}–${formatNumber(max * MICRO1_EDITORIAL_USD_BRL_RATE)}/hora`;
    return { original, estimatedBrl };
  }
  if (opportunity.monthlySalary) {
    const { min, max } = opportunity.monthlySalary;
    const original = `US$ ${formatNumber(min)}–${formatNumber(max)}/mês`;
    const estimatedBrl = `≈ R$ ${formatNumber(min * MICRO1_EDITORIAL_USD_BRL_RATE)}–${formatNumber(max * MICRO1_EDITORIAL_USD_BRL_RATE)}/mês`;
    return { original, estimatedBrl };
  }
  if (opportunity.yearlyCompensation) {
    return { original: opportunity.yearlyCompensation, estimatedBrl: null };
  }
  return { original: 'Valor informado no projeto', estimatedBrl: null };
}
