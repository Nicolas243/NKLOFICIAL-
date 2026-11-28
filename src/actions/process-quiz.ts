'use server';

import { z } from 'zod';
import { asc } from 'drizzle-orm';
import { db } from '@/db';
import { businessProfiles, quizLeads } from '@/db/schema';
import { QUIZ_QUESTIONS } from '@/config/quiz-questions';
import { enhanceQuizResultWithNineRouter } from '@/lib/quiz-ai-diagnostic';
import { calculateQuizProfile, rankBusinessProfiles } from '@/lib/quiz-engine';
import { buildDeterministicResult, type QuizResult } from '@/lib/quiz-result';

const answerSchema = z.record(z.string(), z.number().int().min(1).max(5));
const payloadSchema = z.object({
  email: z.string().trim().email().max(320),
  answers: answerSchema,
  privacyConsent: z.literal(true, {
    error: 'Confirme o consentimento com a Política de Privacidade para gerar seu perfil prático.',
  }),
});

function toSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function validateAnswers(answers: Record<string, number>): void {
  const expectedIds = new Set(QUIZ_QUESTIONS.map((question) => question.id));
  const answerIds = Object.keys(answers);
  if (answerIds.length !== expectedIds.size || answerIds.some((id) => !expectedIds.has(id))) {
    throw new Error('Responda todas as perguntas antes de processar o resultado.');
  }
}

export async function processQuiz(payload: unknown): Promise<QuizResult> {
  const { email, answers } = payloadSchema.parse(payload);
  validateAnswers(answers);
  const calculatedProfile = calculateQuizProfile(answers);
  const rows = await db.select({
    id: businessProfiles.id,
    name: businessProfiles.name,
    minCapital: businessProfiles.minCapital,
    minTimeHours: businessProfiles.minTimeHours,
    techLevel: businessProfiles.techLevel,
    riskLevel: businessProfiles.riskLevel,
  }).from(businessProfiles).orderBy(asc(businessProfiles.name));
  if (rows.length === 0) {
    throw new Error('Os perfis de negócios ainda não foram configurados. Aplique a migration do quiz e tente novamente.');
  }

  const selected = rankBusinessProfiles(rows, calculatedProfile);
  const baseResult = buildDeterministicResult(calculatedProfile, selected);
  const result = await enhanceQuizResultWithNineRouter(baseResult, selected);
  await db.insert(quizLeads).values({
    email,
    answersJsonb: answers,
    calculatedProfile: {
      ...calculatedProfile,
      archetype: result.archetype,
      top3Businesses: result.top3Businesses.map((business) => ({
        slug: toSlug(business.name),
        title: business.name,
      })),
    },
  });
  return result;
}
