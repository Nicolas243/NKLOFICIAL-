import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getTutorialArea,
  getTutorialEventArea,
  getTutorialRoute,
  getTutorialSuggestionKey,
  HOME_TUTORIAL_SEEN_KEY,
} from '@/lib/tutorial-areas';

test('maps income routes to the income tutorial and home/music routes to music', () => {
  assert.equal(getTutorialArea('/programas'), 'income');
  assert.equal(getTutorialArea('/programas/celular'), 'income');
  assert.equal(getTutorialArea('/'), 'music');
  assert.equal(getTutorialArea('/catalogo'), 'music');
  assert.equal(getTutorialArea('/luthiers/123'), 'music');
  assert.equal(getTutorialArea('/login'), null);
});

test('keeps the home tutorial key separate from area suggestion keys', () => {
  assert.equal(HOME_TUTORIAL_SEEN_KEY, 'nkl_tutorial_seen');
  assert.equal(getTutorialSuggestionKey('income'), 'nkl_area_tutorial_suggestion_seen:income');
  assert.equal(getTutorialSuggestionKey('music'), 'nkl_area_tutorial_suggestion_seen:music');
  assert.notEqual(HOME_TUTORIAL_SEEN_KEY, getTutorialSuggestionKey('music'));
});

test('creates independent route keys for static and dynamic pages', () => {
  assert.equal(getTutorialRoute('/catalogo')?.key, 'music:/catalogo');
  assert.equal(getTutorialRoute('/noticias/123')?.key, 'music:/noticias/:slug');
  assert.equal(getTutorialRoute('/programas/celular')?.key, 'income:/programas/celular');
  assert.equal(getTutorialRoute('/login'), null);
});

test('uses a route key for suggestion persistence', () => {
  assert.equal(
    getTutorialSuggestionKey('music:/catalogo'),
    'nkl_route_tutorial_suggestion_seen:music:/catalogo',
  );
});

test('ignores tutorial events without detail instead of throwing', () => {
  assert.equal(getTutorialEventArea(new Event('nkl:open-onboarding')), undefined);
  assert.equal(
    getTutorialEventArea(new CustomEvent('nkl:open-onboarding', { detail: { area: 'income' } })),
    'income',
  );
});
