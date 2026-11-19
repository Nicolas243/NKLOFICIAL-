import test from 'node:test';
import assert from 'node:assert/strict';
import { QUIZ_QUESTIONS } from '@/config/quiz-questions';
import { calculateQuizProfile, rankBusinessProfiles, resolveRequiredSocial } from './quiz-engine';

test('calculates one normalized score for each quiz axis', () => {
  const answers = Object.fromEntries(
    Array.from({ length: 50 }, (_, index) => [
      `${['capital', 'time', 'tech', 'risk', 'social'][Math.floor(index / 10)]}-${String((index % 10) + 1).padStart(2, '0')}`,
      5,
    ]),
  );

  assert.deepEqual(calculateQuizProfile(answers), {
    capital: 5,
    time: 5,
    tech: 5,
    risk: 5,
    social: 5,
  });
});

test('ranks profiles by deterministic fit and returns at most three', () => {
  const profiles = [
    { id: '1', name: 'Baixo risco', minCapital: '0', minTimeHours: 2, techLevel: 'low' as const, riskLevel: 'low' as const },
    { id: '2', name: 'Alto risco', minCapital: '500', minTimeHours: 20, techLevel: 'high' as const, riskLevel: 'high' as const },
    { id: '3', name: 'Equilibrado', minCapital: '100', minTimeHours: 6, techLevel: 'medium' as const, riskLevel: 'medium' as const },
    { id: '4', name: 'Extra', minCapital: '100', minTimeHours: 6, techLevel: 'medium' as const, riskLevel: 'medium' as const },
  ];

  const ranked = rankBusinessProfiles(profiles, { capital: 2, time: 2, tech: 2, risk: 2, social: 3 });

  assert.equal(ranked.length, 3);
  assert.equal(ranked[0]?.name, 'Baixo risco');
});

test('varying social score differentiates behind-the-scenes vs public/camera business profiles', () => {
  const profiles = [
    { id: '1', name: 'Avaliação de IA e dados', minCapital: '100', minTimeHours: 8, techLevel: 'medium' as const, riskLevel: 'medium' as const },
    { id: '2', name: 'Testes de usabilidade', minCapital: '100', minTimeHours: 8, techLevel: 'medium' as const, riskLevel: 'medium' as const },
    { id: '3', name: 'Produção de conteúdo UGC', minCapital: '100', minTimeHours: 8, techLevel: 'medium' as const, riskLevel: 'medium' as const },
    { id: '4', name: 'Comunidade e produtos digitais', minCapital: '100', minTimeHours: 8, techLevel: 'medium' as const, riskLevel: 'medium' as const },
  ];

  assert.equal(resolveRequiredSocial(profiles[0]), 1);
  assert.equal(resolveRequiredSocial(profiles[2]), 5);

  const lowSocialRanking = rankBusinessProfiles(profiles, {
    capital: 3,
    time: 3,
    tech: 3,
    risk: 3,
    social: 1,
  });
  const highSocialRanking = rankBusinessProfiles(profiles, {
    capital: 3,
    time: 3,
    tech: 3,
    risk: 3,
    social: 5,
  });

  assert.equal(lowSocialRanking[0]?.name, 'Avaliação de IA e dados');
  assert.notEqual(lowSocialRanking[0]?.name, highSocialRanking[0]?.name);
  assert.ok(
    highSocialRanking[0]?.name === 'Comunidade e produtos digitais'
    || highSocialRanking[0]?.name === 'Produção de conteúdo UGC',
  );
});

test('all 50 quiz questions have coherent question-specific 1-5 option labels', () => {
  assert.equal(QUIZ_QUESTIONS.length, 50);
  for (const question of QUIZ_QUESTIONS) {
    assert.equal(question.options.length, 5, `Question ${question.id} must have 5 options`);
    assert.deepEqual(
      question.options.map((option) => option.weight),
      [1, 2, 3, 4, 5],
      `Question ${question.id} must have weights 1..5`,
    );
    assert.equal(
      new Set(question.options.map((option) => option.label)).size,
      5,
      `Question ${question.id} must have 5 distinct option labels`,
    );
  }

  const equipmentQuestion = QUIZ_QUESTIONS.find((item) => item.id === 'capital-06');
  assert.ok(equipmentQuestion);
  for (const option of equipmentQuestion.options) {
    assert.doesNotMatch(option.label, /R\$/);
  }

  const frequencyQuestion = QUIZ_QUESTIONS.find((item) => item.id === 'time-02');
  assert.ok(frequencyQuestion);
  for (const option of frequencyQuestion.options) {
    assert.doesNotMatch(option.label, /horas por semana/i);
  }
});
