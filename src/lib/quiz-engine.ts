import type { CalculatedQuizProfile, QuizAnswerMap } from '@/db/schema';
import type { QuizAxis } from '@/config/quiz-questions';

type BusinessProfile = {
  id: string;
  name: string;
  minCapital: string;
  minTimeHours: number;
  techLevel: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
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

function profileScore(profile: BusinessProfile, calculated: CalculatedQuizProfile): number {
  const capitalCapacity = calculated.capital * 500;
  const timeCapacity = calculated.time * 4;
  const capitalGap = Math.max(0, Number(profile.minCapital) - capitalCapacity) / 500;
  const timeGap = Math.max(0, profile.minTimeHours - timeCapacity) / 20;
  const levelGap = levelDistance(calculated.tech, profile.techLevel) + levelDistance(calculated.risk, profile.riskLevel);
  const socialFit = Math.abs(calculated.social - 3) / 5;

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
