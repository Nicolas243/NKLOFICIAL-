import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateAiProgress, getAiCourseLessons, getAiCourseModules } from '@/lib/ai-course';
import { canAccessAiProduct } from '@/lib/ai-access';
import { getAiPromptCategories, getAiPromptById } from '@/lib/ai-prompts';

test('exposes ordered course modules with unique lessons and complete teaching fields', () => {
  const modules = getAiCourseModules();
  const lessons = getAiCourseLessons();
  assert.equal(modules.length, 7);
  assert.equal(new Set(lessons.map((lesson) => lesson.id)).size, lessons.length);
  for (const lesson of lessons) {
    assert.ok(lesson.objective);
    assert.ok(lesson.exampleBad);
    assert.ok(lesson.exampleBetter);
    assert.ok(lesson.exercise);
    assert.ok(lesson.checklist.length >= 2);
  }
});

test('calculates bounded progress without counting unknown lessons', () => {
  const lessonIds = ['one', 'two', 'three'];
  assert.deepEqual(calculateAiProgress(['one', 'unknown', 'one'], lessonIds), {
    completed: 1,
    total: 3,
    percentage: 33,
  });
  assert.deepEqual(calculateAiProgress([], []), { completed: 0, total: 0, percentage: 0 });
});

test('only active access or unexpired canceling access can open content', () => {
  const now = new Date('2026-11-15T00:00:00.000Z');
  assert.equal(canAccessAiProduct({ userId: 'user-1', accessStatus: 'active', now }), true);
  assert.equal(canAccessAiProduct({ userId: 'user-1', accessStatus: 'pending', now }), false);
  assert.equal(canAccessAiProduct({
    userId: 'user-1',
    accessStatus: 'canceling',
    accessUntil: new Date('2026-11-16T00:00:00.000Z'),
    now,
  }), true);
  assert.equal(canAccessAiProduct({
    userId: 'user-1',
    accessStatus: 'canceling',
    accessUntil: new Date('2026-11-14T00:00:00.000Z'),
    now,
  }), false);
  assert.equal(canAccessAiProduct({ userId: 'user-1', accessStatus: 'mystery', now }), false);
});

test('exposes prompt categories and returns only known prompts', () => {
  assert.ok(getAiPromptCategories().includes('programar'));
  assert.ok(getAiPromptById('programar-especificacao'));
  assert.equal(getAiPromptById('not-a-prompt'), null);
});
