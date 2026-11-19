import type { AiDiagnosticAxis } from '@/config/ai-learning-questions';
import { AI_DIAGNOSTIC_QUESTIONS } from '@/config/ai-learning-questions';
import { AI_COURSE_MODULES } from '@/lib/ai-course';
import { AI_PROMPTS, getAiPromptById, type AiPrompt, type AiPromptCategory } from '@/lib/ai-prompts';

export type AiDiagnosticAnswerMap = Record<string, number>;
export type AiLearningProfile = Record<AiDiagnosticAxis, number>;

export type AiRecommendedLesson = {
  lessonId: string;
  lessonTitle: string;
  objective: string;
  moduleSlug: string;
  moduleTitle: string;
  href: string;
};

export type AiRecommendedPrompt = {
  id: string;
  title: string;
  category: AiPromptCategory;
  level: AiPrompt['level'];
  template: string;
};

export type AiLearningPath = {
  title: string;
  summary: string;
  pacingAdvice: string;
  lessonSlugs: readonly string[];
  promptIds: readonly string[];
  recommendedLessons: readonly AiRecommendedLesson[];
  recommendedPrompts: readonly AiRecommendedPrompt[];
};

const AXES: readonly AiDiagnosticAxis[] = ['goal', 'level', 'time', 'confidence'];

const ALL_PROMPT_IDS: readonly string[] = AI_PROMPTS.map((prompt) => prompt.id);

export function calculateAiLearningProfile(answers: AiDiagnosticAnswerMap): AiLearningProfile {
  const profile = Object.fromEntries(AXES.map((axis) => [axis, 0])) as AiLearningProfile;
  for (const question of AI_DIAGNOSTIC_QUESTIONS) {
    const value = answers[question.id];
    if (Number.isInteger(value) && value >= 1 && value <= 4) {
      profile[question.axis] += value;
    }
  }
  return profile;
}

function selectUniqueItems(candidates: readonly string[], fallbackPool: readonly string[], count: number): string[] {
  const selected: string[] = [];
  const seen = new Set<string>();

  for (const item of [...candidates, ...fallbackPool]) {
    if (!seen.has(item)) {
      seen.add(item);
      selected.push(item);
      if (selected.length === count) break;
    }
  }

  return selected;
}

function buildRecommendedLesson(slugOrLessonId: string, useAdvancedLesson: boolean): AiRecommendedLesson | null {
  for (const courseModule of AI_COURSE_MODULES) {
    const directLesson = courseModule.lessons.find((lesson) => lesson.id === slugOrLessonId);
    if (directLesson) {
      return {
        lessonId: directLesson.id,
        lessonTitle: directLesson.title,
        objective: directLesson.objective,
        moduleSlug: courseModule.slug,
        moduleTitle: courseModule.title,
        href: `/ia/curso/${courseModule.slug}`,
      };
    }

    if (courseModule.slug === slugOrLessonId) {
      const lesson = courseModule.lessons[useAdvancedLesson ? 1 : 0] ?? courseModule.lessons[0];
      if (!lesson) return null;
      return {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        objective: lesson.objective,
        moduleSlug: courseModule.slug,
        moduleTitle: courseModule.title,
        href: `/ia/curso/${courseModule.slug}`,
      };
    }
  }

  return null;
}

function buildRecommendedPrompt(promptId: string): AiRecommendedPrompt | null {
  const prompt = getAiPromptById(promptId);
  if (!prompt) return null;
  return {
    id: prompt.id,
    title: prompt.title,
    category: prompt.category,
    level: prompt.level,
    template: prompt.template,
  };
}

export function resolveAiLearningPathDetails(
  path: Partial<AiLearningPath> & Pick<AiLearningPath, 'title' | 'summary' | 'lessonSlugs' | 'promptIds'>,
  profile?: AiLearningProfile,
): AiLearningPath {
  const useAdvancedLesson = (profile?.level ?? 0) >= 5;
  const recommendedLessons = (
    path.recommendedLessons && path.recommendedLessons.length > 0
      ? path.recommendedLessons
      : path.lessonSlugs
          .map((slug) => buildRecommendedLesson(slug, useAdvancedLesson))
          .filter((item): item is AiRecommendedLesson => item !== null)
  );

  const uniquePromptIds = selectUniqueItems(
    path.promptIds.filter((id) => getAiPromptById(id) !== null),
    ALL_PROMPT_IDS,
    5,
  );

  const recommendedPrompts = (
    path.recommendedPrompts && path.recommendedPrompts.length === 5
      ? path.recommendedPrompts
      : uniquePromptIds
          .map((id) => buildRecommendedPrompt(id))
          .filter((item): item is AiRecommendedPrompt => item !== null)
  );

  return {
    title: path.title,
    summary: path.summary,
    pacingAdvice:
      path.pacingAdvice
      ?? 'Reserve blocos curtos semanais para aplicar cada lição com um exercício real.',
    lessonSlugs: path.lessonSlugs,
    promptIds: uniquePromptIds,
    recommendedLessons,
    recommendedPrompts,
  };
}

export function recommendAiLearningPath(profile: AiLearningProfile): AiLearningPath {
  const useAdvancedLesson = profile.level >= 5;
  const allModuleSlugs = AI_COURSE_MODULES.map((courseModule) => courseModule.slug);

  let baseTitle: string;
  let baseSummary: string;
  let goalModules: string[];
  let goalPrompts: string[];

  if (profile.goal >= 7) {
    baseTitle = 'Construtor técnico e de automações com IA';
    baseSummary = 'Comece definindo escopo técnico, limites de agentes e revisão rigorosa de código e segurança.';
    goalModules = ['codigo-seguranca', 'prompting', 'pesquisa-verificacao'];
    goalPrompts = ['programar-especificacao', 'revisar-seguranca-dados', 'pesquisar-comparacao'];
  } else if (profile.goal >= 5) {
    baseTitle = 'Criador de entregas com IA';
    baseSummary = 'Comece transformando ideias em briefs, ofertas claras e processos que você consegue revisar.';
    goalModules = ['texto-imagem-voz', 'conteudo-negocios', 'prompting'];
    goalPrompts = ['criar-conteudo-brief', 'vender-analisar-oferta', 'escrever-revisao'];
  } else if (profile.goal >= 4) {
    baseTitle = 'Profissional mais produtivo';
    baseSummary = 'Comece por contexto, prompts reutilizáveis e planos com uma próxima ação clara.';
    goalModules = ['produtividade', 'prompting', 'pensar-com-ia'];
    goalPrompts = ['organizar-proxima-acao', 'escrever-revisao', 'pesquisar-comparacao'];
  } else {
    baseTitle = 'Explorador seguro de IA';
    baseSummary = 'Comece entendendo limites, verificação e pequenos exercícios antes de automatizar.';
    goalModules = ['pensar-com-ia', 'pesquisa-verificacao', 'prompting'];
    goalPrompts = ['aprender-plano', 'pesquisar-comparacao', 'escrever-revisao'];
  }

  let confidenceModule: string;
  let confidencePrompts: string[];
  let confidenceNote: string;

  if (profile.confidence <= 2) {
    confidenceModule = 'pesquisa-verificacao';
    confidencePrompts = ['pesquisar-comparacao', 'aprender-plano'];
    confidenceNote = 'Foco em verificação de fontes para ganhar segurança antes de decidir.';
  } else if (profile.confidence <= 4) {
    confidenceModule = profile.level >= 4 ? 'codigo-seguranca' : 'pensar-com-ia';
    confidencePrompts = ['revisar-seguranca-dados', 'escrever-revisao'];
    confidenceNote = 'Foco em clareza de instrução e proteção de dados sensíveis.';
  } else {
    confidenceModule = profile.goal >= 5 ? 'conteudo-negocios' : 'produtividade';
    confidencePrompts = ['organizar-proxima-acao', 'vender-analisar-oferta'];
    confidenceNote = 'Foco em transformar respostas em processos repetíveis e entregas reais.';
  }

  const levelPrompts = useAdvancedLesson
    ? ['programar-especificacao', 'revisar-seguranca-dados', 'vender-analisar-oferta']
    : ['aprender-plano', 'organizar-proxima-acao', 'escrever-revisao'];

  let pacingAdvice: string;
  let timePrompts: string[];

  if (profile.time <= 3) {
    pacingAdvice = 'Ritmo sugerido: 2 sessões curtas de 15 minutos por semana, aplicando um prompt pronto por vez.';
    timePrompts = ['organizar-proxima-acao', 'escrever-revisao'];
  } else if (profile.time <= 5) {
    pacingAdvice = 'Ritmo sugerido: 2 a 3 blocos de 30 a 45 minutos por semana, combinando lição, exercício e checklist.';
    timePrompts = ['criar-conteudo-brief', 'pesquisar-comparacao'];
  } else {
    pacingAdvice = 'Ritmo sugerido: ciclos semanais de 2 a 5 horas com projetos práticos, revisão crítica e documentação.';
    timePrompts = ['programar-especificacao', 'aprender-plano'];
  }

  const orderedModuleCandidates = [
    goalModules[0],
    confidenceModule,
    ...goalModules.slice(1),
  ];
  const selectedModuleSlugs = selectUniqueItems(orderedModuleCandidates, allModuleSlugs, 3);

  const recommendedLessons = selectedModuleSlugs
    .map((moduleSlug) => buildRecommendedLesson(moduleSlug, useAdvancedLesson))
    .filter((item): item is AiRecommendedLesson => item !== null);

  const lessonSlugs = recommendedLessons.map((lesson) => lesson.lessonId);

  const promptCandidates = [
    ...timePrompts,
    ...goalPrompts,
    ...confidencePrompts,
    ...levelPrompts,
  ].filter((id) => getAiPromptById(id) !== null);

  const promptIds = selectUniqueItems(promptCandidates, ALL_PROMPT_IDS, 5);
  const recommendedPrompts = promptIds
    .map((id) => buildRecommendedPrompt(id))
    .filter((item): item is AiRecommendedPrompt => item !== null);

  const levelNote = useAdvancedLesson
    ? 'Trilha calibrada para iteração, revisão crítica e critérios avançados.'
    : 'Trilha calibrada para construir base sólida com exemplos guiados.';

  return {
    title: baseTitle,
    summary: `${baseSummary} ${confidenceNote} ${levelNote}`,
    pacingAdvice,
    lessonSlugs,
    promptIds,
    recommendedLessons,
    recommendedPrompts,
  };
}
