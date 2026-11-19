import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateQuizProfile, rankBusinessProfiles } from './quiz-engine';

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
