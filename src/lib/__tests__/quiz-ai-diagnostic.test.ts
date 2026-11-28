import assert from 'node:assert/strict';
import test from 'node:test';
import type { BusinessProfile } from '../quiz-engine';
import { buildDeterministicResult } from '../quiz-result';
import { enhanceQuizResultWithNineRouter } from '../quiz-ai-diagnostic';

const SAMPLE_PROFILE = {
  capital: 2.2,
  time: 3.4,
  tech: 4.1,
  risk: 2.8,
  social: 2.5,
};

const SAMPLE_BUSINESSES: BusinessProfile[] = [
  {
    id: 'b1',
    name: 'Avaliação de IA e dados',
    minCapital: '0',
    minTimeHours: 6,
    techLevel: 'medium',
    riskLevel: 'low',
  },
  {
    id: 'b2',
    name: 'Loja de templates e produtos digitais',
    minCapital: '100',
    minTimeHours: 8,
    techLevel: 'medium',
    riskLevel: 'low',
  },
  {
    id: 'b3',
    name: 'Publicação de e-books e livros na Amazon KDP',
    minCapital: '0',
    minTimeHours: 6,
    techLevel: 'medium',
    riskLevel: 'low',
  },
];

test('uses 9router to produce personalized AI diagnostic and strips emojis/hype', async () => {
  const base = buildDeterministicResult(SAMPLE_PROFILE, SAMPLE_BUSINESSES);
  const calledUrls: string[] = [];

  const enhanced = await enhanceQuizResultWithNineRouter(base, SAMPLE_BUSINESSES, {
    env: {
      NINE_ROUTER_BASE_URL: 'http://127.0.0.1:20128/v1',
      NINE_ROUTER_API_KEY: 'test-key',
      NINE_ROUTER_WORKER_MODEL: 'NKL-OPERARIOS',
    },
    fetchImpl: async (url) => {
      calledUrls.push(String(url));
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  archetype: 'Arquiteto Digital 🚀',
                  diagnostic_headline: 'Seu perfil combina precisão técnica com renda garantida em dados.',
                  analysis: 'Com domínio técnico alto e orçamento enxuto, você se adapta muito bem à avaliação de modelos de IA e produtos digitais escaláveis.',
                  strengths: ['Boa autonomia com tecnologia', 'Disciplina de custo inicial'],
                  watchouts: ['Evite abrir frentes demais antes do 7º dia'],
                  first_week_focus: 'Foque nos testes de qualificação da primeira frente por 7 dias.',
                  top_3_businesses: [
                    {
                      name: 'Avaliação de IA e dados',
                      why_it_fits: 'Exige zero capital e aproveita sua facilidade técnica.',
                      action_plan_3_steps: [
                        'Crie conta na Micro1 e Outlier AI com perfil completo.',
                        'Complete a primeira avaliação de qualificação em até 48 horas.',
                        'Meça o ganho real por hora durante 7 dias.',
                      ],
                    },
                    {
                      name: 'Negócio Inventado Fora da Lista',
                      action_plan_3_steps: [
                        'Passo inventado fora da lista 1',
                        'Passo inventado fora da lista 2',
                        'Passo inventado fora da lista 3',
                      ],
                    },
                  ],
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    },
  });

  assert.deepEqual(calledUrls, ['http://127.0.0.1:20128/v1/chat/completions']);
  assert.equal(enhanced.diagnosticSource, '9router');
  assert.equal(enhanced.archetype, 'Arquiteto Digital');
  assert.doesNotMatch(enhanced.diagnosticHeadline ?? '', /renda garantida/i);
  assert.equal(enhanced.top3Businesses.length, 1);
  assert.equal(enhanced.top3Businesses[0]?.name, 'Avaliação de IA e dados');
});

test('falls back safely to structured diagnostic when 9router is offline or returns HTTP error', async () => {
  const base = buildDeterministicResult(SAMPLE_PROFILE, SAMPLE_BUSINESSES);

  const offlineResult = await enhanceQuizResultWithNineRouter(base, SAMPLE_BUSINESSES, {
    env: {
      NINE_ROUTER_BASE_URL: 'http://127.0.0.1:20128/v1',
      NINE_ROUTER_API_KEY: 'test-key',
    },
    fetchImpl: async () => {
      throw new Error('ECONNREFUSED');
    },
  });

  assert.equal(offlineResult.diagnosticSource, 'fallback');
  assert.equal(offlineResult.top3Businesses.length, 3);
  assert.ok(offlineResult.strengths && offlineResult.strengths.length > 0);
  assert.ok(offlineResult.watchouts && offlineResult.watchouts.length > 0);
  assert.ok(offlineResult.firstWeekFocus);

  const errorStatusResult = await enhanceQuizResultWithNineRouter(base, SAMPLE_BUSINESSES, {
    env: {
      NINE_ROUTER_BASE_URL: 'http://127.0.0.1:20128/v1',
      NINE_ROUTER_API_KEY: 'test-key',
    },
    fetchImpl: async () => new Response('down', { status: 503 }),
  });

  assert.equal(errorStatusResult.diagnosticSource, 'fallback');
});
