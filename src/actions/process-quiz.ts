'use server';

import { z } from 'zod';
import { asc } from 'drizzle-orm';
import { db } from '@/db';
import { businessProfiles, quizLeads } from '@/db/schema';
import { QUIZ_QUESTIONS } from '@/config/quiz-questions';
import { calculateQuizProfile, rankBusinessProfiles, type BusinessProfile } from '@/lib/quiz-engine';
import { buildDeterministicResult, type QuizResult } from '@/lib/quiz-result';

const answerSchema = z.record(z.string(), z.number().int().min(1).max(5));
const payloadSchema = z.object({
  email: z.string().trim().email().max(320),
  answers: answerSchema,
  privacyConsent: z.literal(true, {
    error: 'Confirme o consentimento com a Política de Privacidade para processar o diagnóstico.',
  }),
});

const profileSchema = z.object({
  archetype: z.string(),
  analysis: z.string(),
  top_3_businesses: z.array(z.object({
    name: z.string(),
    action_plan_3_steps: z.array(z.string()).length(3),
  })).max(3),
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

async function enhanceWithOpenAi(result: QuizResult, businesses: BusinessProfile[]): Promise<QuizResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return result;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Retorne somente JSON válido com archetype, analysis e top_3_businesses. Não invente negócios fora da lista.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              profile: result.profile,
              businesses,
              required_shape: '{ "archetype": "...", "analysis": "...", "top_3_businesses": [{ "name": "...", "action_plan_3_steps": ["...", "...", "..."] }] }',
            }),
          },
        ],
      }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      throw new Error(`A análise avançada falhou (HTTP ${response.status}).`);
    }

    const body: unknown = await response.json();
    const content = z.object({
      choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1),
    }).parse(body).choices[0].message.content;
    const parsed = profileSchema.parse(JSON.parse(content));
    if (parsed.top_3_businesses.length === 0) {
      return result;
    }
    return {
      ...result,
      archetype: parsed.archetype,
      analysis: parsed.analysis,
      top3Businesses: parsed.top_3_businesses.map((business) => ({
        name: business.name,
        actionPlan3Steps: [
          business.action_plan_3_steps[0],
          business.action_plan_3_steps[1],
          business.action_plan_3_steps[2],
        ],
      })),
    };
  } catch (error) {
    console.warn(
      '[PROCESS_QUIZ] Usando resultado determinístico após falha na análise OpenAI:',
      error instanceof Error ? error.message : 'erro desconhecido',
    );
    return result;
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
  const result = await enhanceWithOpenAi(baseResult, selected);
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
