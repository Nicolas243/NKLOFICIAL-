import assert from 'node:assert/strict';
import test from 'node:test';
import { getCanonicalShareUrl, getProgramShareUrl } from '@/lib/share-url';

test('prefers the same-origin canonical page URL', () => {
  assert.equal(
    getCanonicalShareUrl({
      canonicalHref: 'https://nkloficial.com.br/programas/utest?utm_source=instagram',
      currentHref: 'https://nkloficial.com.br/programas/utest?ref=2535825',
    }),
    'https://nkloficial.com.br/programas/utest',
  );
});

test('removes affiliate and tracking parameters from the current URL', () => {
  assert.equal(
    getCanonicalShareUrl({
      currentHref: 'https://nkloficial.com.br/programas/celular?ref=abc&utm_source=threads&category=pesquisas#top',
    }),
    'https://nkloficial.com.br/programas/celular?category=pesquisas',
  );
});

test('does not trust an external canonical URL', () => {
  assert.equal(
    getCanonicalShareUrl({
      canonicalHref: 'https://example.com/ref/affiliate',
      currentHref: 'https://nkloficial.com.br/programas/utest?utm_campaign=x',
    }),
    'https://nkloficial.com.br/programas/utest',
  );
});

test('builds the share URL from the complete Portal NKL program page', () => {
  assert.equal(
    getProgramShareUrl('uTest', 'https://nkloficial.com.br'),
    'https://nkloficial.com.br/programas/uTest',
  );
});

test('preserves a specific project URL when one is provided', () => {
  const projectUrl = 'https://app.alignerr.com/signin?referralJobId=project-123';

  assert.equal(
    getProgramShareUrl('aligner', 'https://nkloficial.com.br', projectUrl),
    projectUrl,
  );
});
