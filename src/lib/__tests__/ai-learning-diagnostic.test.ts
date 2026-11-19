import assert from 'node:assert/strict';
import test from 'node:test';
import { getAiCourseModules } from '@/lib/ai-course';
import {
  calculateAiLearningProfile,
  recommendAiLearningPath,
  resolveAiLearningPathDetails,
} from '@/lib/ai-learning-diagnostic';
import { getAiPromptById } from '@/lib/ai-prompts';

test('ignores malformed diagnostic answers and calculates known axes', () => {
  const profile = calculateAiLearningProfile({
    'goal-1': 4,
    'goal-2': 3,
    'level-1': 9,
    'unknown-1': 4,
  });
  assert.deepEqual(profile, { goal: 7, level: 0, time: 0, confidence: 0 });
});

test('returns a deterministic path with three lessons, five unique known prompts, and resolved module links', () => {
  const validModuleSlugs = new Set(getAiCourseModules().map((courseModule) => courseModule.slug));
  const sampleProfiles = [
    { goal: 2, level: 2, time: 2, confidence: 2 },
    { goal: 4, level: 3, time: 4, confidence: 4 },
    { goal: 6, level: 5, time: 5, confidence: 6 },
    { goal: 8, level: 7, time: 8, confidence: 8 },
  ];

  for (const profile of sampleProfiles) {
    const path = recommendAiLearningPath(profile);
    assert.equal(path.lessonSlugs.length, 3);
    assert.equal(new Set(path.lessonSlugs).size, 3);
    assert.equal(path.recommendedLessons.length, 3);
    for (const lesson of path.recommendedLessons) {
      assert.ok(validModuleSlugs.has(lesson.moduleSlug));
      assert.ok(lesson.moduleTitle);
      assert.ok(lesson.lessonTitle);
      assert.equal(lesson.href, `/ia/curso/${lesson.moduleSlug}`);
    }

    assert.equal(path.promptIds.length, 5);
    assert.equal(new Set(path.promptIds).size, 5, 'promptIds must not contain duplicates');
    assert.equal(path.recommendedPrompts.length, 5);
    for (const promptId of path.promptIds) {
      assert.ok(getAiPromptById(promptId), `Expected promptId ${promptId} to exist in AI_PROMPTS`);
    }
    assert.ok(path.title);
    assert.ok(path.summary);
    assert.ok(path.pacingAdvice);
  }
});

test('tailors recommendation across all 4 axes (goal, level, time, confidence)', () => {
  const baseline = recommendAiLearningPath({ goal: 2, level: 2, time: 2, confidence: 2 });
  const higherGoal = recommendAiLearningPath({ goal: 6, level: 2, time: 2, confidence: 2 });
  const higherLevel = recommendAiLearningPath({ goal: 2, level: 6, time: 2, confidence: 2 });
  const higherTime = recommendAiLearningPath({ goal: 2, level: 2, time: 7, confidence: 2 });
  const higherConfidence = recommendAiLearningPath({ goal: 2, level: 2, time: 2, confidence: 7 });

  assert.notEqual(baseline.title, higherGoal.title);
  assert.notDeepEqual(baseline.lessonSlugs, higherLevel.lessonSlugs);
  assert.notEqual(baseline.pacingAdvice, higherTime.pacingAdvice);
  assert.notDeepEqual(baseline.promptIds, higherTime.promptIds);
  assert.notDeepEqual(baseline.lessonSlugs, higherConfidence.lessonSlugs);
});

test('hydrates legacy stored diagnostic paths with real module titles and unique prompts', () => {
  const hydrated = resolveAiLearningPathDetails({
    title: 'Explorador seguro de IA',
    summary: 'Resumo inicial',
    lessonSlugs: ['pensar-com-ia', 'pesquisa-verificacao', 'prompting'],
    promptIds: ['aprender-plano', 'aprender-plano', 'escrever-revisao'],
  });

  assert.equal(hydrated.recommendedLessons.length, 3);
  assert.equal(hydrated.recommendedLessons[0]?.moduleSlug, 'pensar-com-ia');
  assert.equal(hydrated.recommendedLessons[0]?.moduleTitle, 'Como pensar com IA');
  assert.equal(hydrated.promptIds.length, 5);
  assert.equal(new Set(hydrated.promptIds).size, 5);
});
