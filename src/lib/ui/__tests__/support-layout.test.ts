import assert from 'node:assert/strict';
import test from 'node:test';
import { getHiddenScrollbarClassName, getSupportLinkClassName } from '../support-layout';

test('support links can share a row and wrap at narrow widths', () => {
  const className = getSupportLinkClassName();
  assert.match(className, /\bflex-1\b/);
  assert.match(className, /basis-\[12rem\]/);
  assert.match(className, /\bmin-w-0\b/);
});

test('hidden scrollbar utility preserves horizontal scrolling', () => {
  const className = getHiddenScrollbarClassName();
  assert.match(className, /\boverflow-x-auto\b/);
  assert.match(className, /\bnkl-scrollbar-hidden\b/);
});
