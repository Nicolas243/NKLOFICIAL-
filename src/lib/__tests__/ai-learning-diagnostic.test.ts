import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateAiLearningProfile, recommendAiLearningPath } from '@/lib/ai-learning-diagnostic';

test('ignores malformed diagnostic answers and calculates known axes', () => {
  const profile = calculateAiLearningProfile({
    'goal-1': 4,
    'goal-2': 3,
    'level-1': 9,
    'unknown-1': 4,
  });
  assert.deepEqual(profile, { goal: 7, level: 0, time: 0, confidence: 0 });
});

test('returns a deterministic path with three lessons and five prompts', () => {
  const path = recommendAiLearningPath({ goal: 2, level: 1, time: 1, confidence: 2 });
  assert.equal(path.lessonSlugs.length, 3);
  assert.equal(path.promptIds.length, 5);
  assert.ok(path.title);
  assert.ok(path.summary);
});
