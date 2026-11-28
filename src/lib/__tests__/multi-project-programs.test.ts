import assert from 'node:assert/strict';
import test from 'node:test';
import { PARTNER_PROGRAM_SLUGS } from '../partner-program-catalog';
import { getMultiProjectCardHint, getMultiProjectGroup } from '../multi-project-programs';

test('all multi-project platform entries have PT-BR summaries with at most 7 words', () => {
  for (const slug of PARTNER_PROGRAM_SLUGS) {
    const group = getMultiProjectGroup(slug);
    if (!group) continue;

    assert.ok(group.items.length >= 2, `Expected at least 2 items for multi-project slug ${slug}`);
    assert.ok(group.cardHint.trim().length > 0);
    for (const item of group.items) {
      const words = item.summaryPtBr.trim().split(/\s+/u).filter(Boolean);
      assert.ok(
        words.length >= 2 && words.length <= 7,
        `Summary "${item.summaryPtBr}" (${slug}/${item.id}) has ${words.length} words (expected <= 7)`,
      );
      assert.ok(item.payLabel.trim().length > 0);
      assert.match(item.href, /^https:\/\//u);
    }
  }
});

test('preserves Alligner referral job URL and produces clean card hints without featured job boxes', () => {
  const aligner = getMultiProjectGroup('aligner');
  assert.ok(aligner);
  assert.ok(
    aligner.items.some((item) => item.href.includes('referralJobId=f4b9a0e2-e6c2-4388-b01d-b7655b313d9b')),
  );
  assert.equal(getMultiProjectCardHint('micro1', 306), '306 serviços e projetos em várias áreas');
  assert.equal(getMultiProjectCardHint('mercado-pago'), null);
});
