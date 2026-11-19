import type { AiDiagnosticAxis } from '@/config/ai-learning-questions';
import { AI_DIAGNOSTIC_QUESTIONS } from '@/config/ai-learning-questions';

export type AiDiagnosticAnswerMap = Record<string, number>;
export type AiLearningProfile = Record<AiDiagnosticAxis, number>;

export type AiLearningPath = {
  title: string;
  summary: string;
  lessonSlugs: readonly string[];
  promptIds: readonly string[];
};

const AXES: readonly AiDiagnosticAxis[] = ['goal', 'level', 'time', 'confidence'];

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

export function recommendAiLearningPath(profile: AiLearningProfile): AiLearningPath {
  if (profile.goal >= 6) {
    return {
      title: 'Criador de entregas com IA',
      summary: 'Comece transformando ideias em briefs, conteúdo e processos que você consegue revisar.',
      lessonSlugs: ['texto-imagem-voz', 'conteudo-negocios', 'prompting'],
      promptIds: ['escrever-revisao', 'aprender-plano', 'pesquisar-comparacao', 'programar-especificacao', 'escrever-revisao'],
    };
  }
  if (profile.goal >= 4) {
    return {
      title: 'Profissional mais produtivo',
      summary: 'Comece por contexto, prompts reutilizáveis e planos com uma próxima ação clara.',
      lessonSlugs: ['pensar-com-ia', 'prompting', 'produtividade'],
      promptIds: ['aprender-plano', 'escrever-revisao', 'pesquisar-comparacao', 'aprender-plano', 'programar-especificacao'],
    };
  }
  return {
    title: 'Explorador seguro de IA',
    summary: 'Comece entendendo limites, verificação e pequenos exercícios antes de automatizar.',
    lessonSlugs: ['pensar-com-ia', 'pesquisa-verificacao', 'prompting'],
    promptIds: ['aprender-plano', 'pesquisar-comparacao', 'escrever-revisao', 'aprender-plano', 'programar-especificacao'],
  };
}
