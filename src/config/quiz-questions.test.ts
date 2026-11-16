import assert from 'node:assert/strict';
import test from 'node:test';
import { QUIZ_QUESTIONS, type QuizAxis } from './quiz-questions';

const AXES: QuizAxis[] = ['capital', 'time', 'risk', 'tech', 'social'];

test('contains 50 unique questions distributed evenly across the five axes', () => {
  assert.equal(QUIZ_QUESTIONS.length, 50);
  assert.equal(new Set(QUIZ_QUESTIONS.map((question) => question.id)).size, 50);

  for (const axis of AXES) {
    assert.equal(
      QUIZ_QUESTIONS.filter((question) => question.axis === axis).length,
      10,
      `expected 10 questions for ${axis}`,
    );
  }
});

test('provides usable weighted options for every question', () => {
  for (const question of QUIZ_QUESTIONS) {
    assert.ok(question.text.length > 20);
    assert.ok(question.options.length >= 3);
    assert.ok(question.options.every((option) => option.label.length > 0));
    assert.ok(question.options.every((option) => Number.isInteger(option.weight) && option.weight >= 1 && option.weight <= 5));
  }
});
