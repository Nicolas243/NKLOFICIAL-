import type { CalculatedQuizProfile, QuizAnswerMap } from '@/db/schema';
import type { QuizAxis } from '@/config/quiz-questions';

type BusinessProfile = {
  id: string;
  name: string;
  minCapital: string;
  minTimeHours: number;
  techLevel: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
  socialLevel?: 'low' | 'medium' | 'high';
  requiredSocial?: number;
};

const AXES: QuizAxis[] = ['capital', 'time', 'tech', 'risk', 'social'];

function axisFromQuestionId(questionId: string): QuizAxis | null {
  const axis = questionId.split('-')[0];
  return AXES.includes(axis as QuizAxis) ? axis as QuizAxis : null;
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((total, value) => total + value, 0) / values.length;
}

export function calculateQuizProfile(answers: QuizAnswerMap): CalculatedQuizProfile {
  return Object.fromEntries(
    AXES.map((axis) => [
      axis,
      Number(average(
        Object.entries(answers)
          .filter(([questionId]) => axisFromQuestionId(questionId) === axis)
          .map(([, weight]) => weight),
      ).toFixed(2)),
    ]),
  ) as CalculatedQuizProfile;
}

function levelDistance(value: number, level: BusinessProfile['techLevel'] | BusinessProfile['riskLevel']): number {
  const target = level === 'low' ? 1 : level === 'medium' ? 3 : 5;
  return Math.abs(value - target);
}

export function resolveRequiredSocial(profile: BusinessProfile): number {
  if (typeof profile.requiredSocial === 'number' && Number.isFinite(profile.requiredSocial)) {
    return Math.min(5, Math.max(1, profile.requiredSocial));
  }
  if (profile.socialLevel === 'low') return 1;
  if (profile.socialLevel === 'medium') return 3;
  if (profile.socialLevel === 'high') return 5;

  const normalized = profile.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (/(ugc|conteudo|comunidade|camera|video|vendas|comunicacao|publico|influenc|mentoria|aula|consultoria)/.test(normalized)) {
    return 5;
  }
  if (/(servico|cliente|atendimento|freelanc|agencia|parceria)/.test(normalized)) {
    return 4;
  }
  if (/(usabilidade|entrevista|moderad)/.test(normalized)) {
    return 3;
  }
  if (/(afiliado|trafego|anuncio)/.test(normalized)) {
    return 2;
  }
  if (/(avaliacao de ia|dados|bastidor|back-office|silencios|automacao|codigo|programacao|tecnic)/.test(normalized)) {
    return 1;
  }

  return 3;
}

function profileScore(profile: BusinessProfile, calculated: CalculatedQuizProfile): number {
  const capitalCapacity = calculated.capital * 500;
  const timeCapacity = calculated.time * 4;
  const capitalGap = Math.max(0, Number(profile.minCapital) - capitalCapacity) / 500;
  const timeGap = Math.max(0, profile.minTimeHours - timeCapacity) / 20;
  const levelGap = levelDistance(calculated.tech, profile.techLevel) + levelDistance(calculated.risk, profile.riskLevel);
  const socialFit = Math.abs(calculated.social - resolveRequiredSocial(profile));

  return capitalGap * 4 + timeGap * 4 + levelGap + socialFit;
}

export function rankBusinessProfiles(
  profiles: BusinessProfile[],
  calculated: CalculatedQuizProfile,
): BusinessProfile[] {
  return profiles
    .map((profile) => ({ profile, score: profileScore(profile, calculated) }))
    .sort((left, right) => left.score - right.score || left.profile.name.localeCompare(right.profile.name, 'pt-BR'))
    .slice(0, 3)
    .map(({ profile }) => profile);
}

export type { BusinessProfile };
