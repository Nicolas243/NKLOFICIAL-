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
  'retail-hospitality': 'Varejo e atendimento',
  robotics: 'Robótica e vídeo',
  'sales-marketing': 'Vendas e marketing',
  'sciences-research': 'Ciência e pesquisa',
  'skilled-trades-construction': 'Ofícios e construção',
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
    translateMicro1Title(opportunity.jobName),
    formatMicro1CompactSummary(opportunity),
    getMicro1CategoryLabel(opportunity.domainSlug),
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
  [/\bMechanical Design Engineer\b/giu, 'Engenheiro de projeto mecânico'],
  [/\bOptomechanical Design Engineer\b/giu, 'Engenheiro optomecânico'],
  [/\bForward Deployed Engineer\b/giu, 'Engenheiro de implantação'],
  [/\bBackend Developer\b/giu, 'Desenvolvedor backend'],
  [/\bData Scientist\b/giu, 'Cientista de dados'],
  [/\bResearch Scientist\b/giu, 'Cientista pesquisador'],
  [/\bPolymer Scientist\b/giu, 'Cientista de polímeros'],
  [/\bFormulation Scientist\b/giu, 'Cientista de formulações'],
  [/\bEnglish Language Expert\b/giu, 'Especialista em idioma inglês'],
  [/\bPortuguese Bilingual Expert\b/giu, 'Especialista bilíngue em português'],
  [/\bAt-Home Video Recorder\b/giu, 'Gravador de vídeo em casa'],
  [/\bSmartphone Video Recorder\b/giu, 'Gravador de vídeo no celular'],
  [/\bVideo Recorder\b/giu, 'Gravador de vídeo'],
  [/\bCar-Mounted\b/giu, 'Montado em carro'],
  [/\bImage Annotator\b/giu, 'Anotador de imagens'],
  [/\bHuman Data Manager\b/giu, 'Gerente de dados humanos'],
  [/\bGeneral Counsel\b/giu, 'Diretor jurídico'],
  [/\bTransactional Attorney\b/giu, 'Advogado de transações'],
  [/\bCommercial Attorney\b/giu, 'Advogado comercial'],
  [/\bContracts? Attorney\b/giu, 'Advogado de contratos'],
  [/\bInvestment Funds Attorney\b/giu, 'Advogado de fundos'],
  [/\bIn-House Counsel\b/giu, 'Advogado corporativo'],
  [/\bDerivatives Counsel\b/giu, 'Advogado de derivativos'],
  [/\bMilitary Legal Advisor\b/giu, 'Consultor jurídico militar'],
  [/\bJunior Lawyer\b/giu, 'Advogado júnior'],
  [/\bLaw Student\b/giu, 'Estudante de direito'],
  [/\bLawyer\b/giu, 'Advogado'],
  [/\bAttorney\b/giu, 'Advogado'],
  [/\bCounsel\b/giu, 'Consultor jurídico'],
  [/\bFighter Pilot\b/giu, 'Piloto de caça'],
  [/\bRadiation Oncologist\b/giu, 'Oncologista de radiação'],
  [/\bRegistered Nurse\b/giu, 'Enfermeiro registrado'],
  [/\bClinical Psychologist\b/giu, 'Psicólogo clínico'],
  [/\bPsychiatrist\b/giu, 'Psiquiatra'],
  [/\bPhysician\b/giu, 'Médico'],
  [/\bMedical Doctor\b/giu, 'Médico'],
  [/\bMedical Coder\b/giu, 'Codificador médico'],
  [/\bInpatient Coder\b/giu, 'Codificador hospitalar'],
  [/\bInpatient facility coder\b/giu, 'Codificador hospitalar'],
  [/\bHospitalist\b/giu, 'Médico hospitalista'],
  [/\bFamily Medicine\b/giu, 'Medicina de família'],
  [/\bMental Health Clinician\b/giu, 'Clínico de saúde mental'],
  [/\bTax Reviewer\b/giu, 'Revisor tributário'],
  [/\bTax Expert\b/giu, 'Especialista tributário'],
  [/\bFinance & Accounting\b/giu, 'Finanças e contabilidade'],
  [/\bCustomer Experience\b/giu, 'Experiência do cliente'],
  [/\bCustomer Support\b/giu, 'Suporte ao cliente'],
  [/\bCustomer Service\b/giu, 'Atendimento ao cliente'],
  [/\bHospitality Worker\b/giu, 'Profissional de hospitalidade'],
  [/\bProfessional Photographer\b/giu, 'Fotógrafo profissional'],
  [/\bProfessional Shopper\b/giu, 'Comprador misterioso'],
  [/\bUI\/UX Designer\b/giu, 'Designer UI/UX'],
  [/\bProduct Owner\b/giu, 'Dono de produto'],
  [/\bCategory Manager\b/giu, 'Gerente de categoria'],
  [/\bData Partnerships Manager\b/giu, 'Gerente de parcerias de dados'],
  [/\bMusic Teacher\b/giu, 'Professor de música'],
  [/\bAI Trainer\b/giu, 'Treinador de IA'],
  [/\bAI Product Tester\b/giu, 'Testador de produtos de IA'],
  [/\bDomain Researcher\b/giu, 'Pesquisador de área'],
  [/\bSenior\b/giu, 'Sênior'],
  [/\bJunior\b/giu, 'Júnior'],
  [/\bPrincipal\b/giu, 'Principal'],
  [/\bDistinguished\b/giu, 'Sênior'],
  [/\bLead\b/giu, 'Líder'],
  [/\bExpert\b/giu, 'Especialista'],
  [/\bSpecialist\b/giu, 'Especialista'],
  [/\bPractitioner\b/giu, 'Especialista'],
  [/\bAdvisor\b/giu, 'Consultor'],
  [/\bExaminer\b/giu, 'Analista'],
  [/\bAuditor\b/giu, 'Auditor'],
  [/\bEngineer\b/giu, 'Engenheiro'],
  [/\bEngineering\b/giu, 'Engenharia'],
  [/\bDeveloper\b/giu, 'Desenvolvedor'],
  [/\bProgrammer\b/giu, 'Programador'],
  [/\bArchitect\b/giu, 'Arquiteto'],
  [/\bScientist\b/giu, 'Cientista'],
  [/\bResearcher\b/giu, 'Pesquisador'],
  [/\bResearch\b/giu, 'Pesquisa'],
  [/\bAnalyst\b/giu, 'Analista'],
  [/\bDesigner\b/giu, 'Designer'],
  [/\bWriter\b/giu, 'Redator'],
  [/\bEditor\b/giu, 'Editor'],
  [/\bReviewer\b/giu, 'Avaliador'],
  [/\bEvaluator\b/giu, 'Avaliador'],
  [/\bTester\b/giu, 'Testador'],
  [/\bTeacher\b/giu, 'Professor'],
  [/\bTutor\b/giu, 'Tutor'],
  [/\bRecruiter\b/giu, 'Recrutador'],
  [/\bStatistician\b/giu, 'Estatístico'],
  [/\bContributor\b/giu, 'Colaborador'],
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
  [/\bLATAM\b/giu, 'América Latina'],
  [/\bU\.S\.?\b/giu, 'EUA'],
];

export function translateMicro1Title(title: string): string {
  return TRANSLATIONS.reduce((translated, [pattern, replacement]) => translated.replace(pattern, replacement), title).trim();
}

export function enforceMaxSevenWords(text: string): string {
  const words = text.trim().split(/\s+/u).filter(Boolean);
  if (words.length <= 7) return words.join(' ');
  return words.slice(0, 7).join(' ');
}

export function formatMicro1CompactSummary(opportunity: Micro1Opportunity): string {
  const source = `${opportunity.jobName} ${opportunity.skills.join(' ')}`.toLocaleLowerCase('en-US');

  let summary: string;

  if (/(lawyer|attorney|counsel|legal|law\b)/u.test(source)) {
    summary = 'Avaliar contratos e pareceres jurídicos com IA';
  } else if (/(image annotator|imagery|drone|maritime|photographer)/u.test(source)) {
    summary = 'Analisar ou capturar fotos e imagens';
  } else if (/(video recorder|gravador|smartphone video|data-video|robotics)/u.test(source)) {
    summary = 'Gravar vídeos reais seguindo o roteiro';
  } else if (/(tax|budget|accounting|finance|derivatives|m&a|auditor|claims)/u.test(source)) {
    summary = 'Revisar finanças, tributos e análises para IA';
  } else if (/(oncologist|physician|medical|nurse|psychologist|psychiatrist|mental health|inpatient|coder)/u.test(source)) {
    summary = 'Revisar conteúdos médicos e saúde para IA';
  } else if (/(scientist|physics|polymer|formulation|life sciences|math|statistician|lean 4)/u.test(source)) {
    summary = 'Avaliar pesquisas científicas e raciocínio lógico';
  } else if (/(software|backend|rust|cuda|gpu|electron|it specialist|cybersecurity|deployed engineer)/u.test(source)) {
    summary = 'Avaliar códigos e projetos de engenharia';
  } else if (/(mechanical|optomechanical|manufacturing|cnc|semiconductor|autodesk)/u.test(source)) {
    summary = 'Revisar projetos mecânicos e engenharia aplicada';
  } else if (/(education|teacher|tutor|learning|assessment)/u.test(source)) {
    summary = 'Criar e avaliar materiais de ensino';
  } else if (/(pilot|military|intelligence|combat|defense|humanitarian|federal)/u.test(source)) {
    summary = 'Avaliar cenários operacionais e políticas públicas';
  } else if (/(hospitality|travel|customer|retail|telecom|airline|shopper|recruiter|talent)/u.test(source)) {
    summary = 'Avaliar atendimento, suporte e processos comerciais';
  } else if (/(ui\/ux|creative|marketing|category|product owner)/u.test(source)) {
    summary = 'Avaliar design, marketing ou produto digital';
  } else if (opportunity.domainSlug === 'language-audio' || /(language|portuguese|english|spanish|french|german|audio|linguist|translator)/u.test(source)) {
    summary = 'Avaliar áudios, traduções e textos em idiomas';
  } else if (opportunity.domainSlug === 'software-engineering' || opportunity.domainSlug === 'cybersecurity') {
    summary = 'Avaliar códigos e soluções de tecnologia';
  } else if (opportunity.domainSlug === 'robotics') {
    summary = 'Gravar ou revisar vídeos para robótica';
  } else if (opportunity.domainSlug === 'medicine') {
    summary = 'Revisar conteúdos técnicos na área médica';
  } else if (opportunity.domainSlug === 'law') {
    summary = 'Avaliar questões e textos da área jurídica';
  } else if (opportunity.domainSlug === 'finance') {
    summary = 'Revisar análises financeiras para treinar IA';
  } else if (opportunity.domainSlug === 'sciences-research') {
    summary = 'Avaliar pesquisas científicas para modelos IA';
  } else if (opportunity.domainSlug === 'applied-engineering') {
    summary = 'Revisar projetos técnicos de engenharia aplicada';
  } else if (opportunity.domainSlug === 'education') {
    summary = 'Avaliar questões e conteúdos educacionais';
  } else if (opportunity.domainSlug === 'arts-design') {
    summary = 'Avaliar peças visuais, design e criatividade';
  } else if (opportunity.domainSlug === 'sales-marketing') {
    summary = 'Avaliar estratégias comerciais e de marketing';
  } else if (opportunity.domainSlug === 'business-operations') {
    summary = 'Avaliar operações e fluxos empresariais';
  } else {
    summary = 'Revisar dados e respostas para treinar IA';
  }

  return enforceMaxSevenWords(summary);
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
    if (min >= 5000) {
      return {
        original: `US$ ${formatNumber(min)}–${formatNumber(max)}/ano`,
        estimatedBrl: null,
      };
    }
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
  return { original: 'Valor no projeto', estimatedBrl: null };
}
