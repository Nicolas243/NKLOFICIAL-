import assert from 'node:assert/strict';
import test from 'node:test';
import { GUIDE_PAGE_CTA_VARIANTS } from '@/lib/guide-offer';

test('defines five distinct November guide CTA variants with truthful copy', () => {
  assert.equal(GUIDE_PAGE_CTA_VARIANTS.length, 5);
  assert.deepEqual(
    GUIDE_PAGE_CTA_VARIANTS.map((variant) => variant.id),
    ['0', '1', '2', '3', '4'],
  );

  for (const variant of GUIDE_PAGE_CTA_VARIANTS) {
    assert.ok(variant.title.trim());
    assert.ok(variant.summary.trim());
    assert.ok(variant.ctaLabel.trim());
    assert.ok(variant.angle.trim());
    assert.match(`${variant.title} ${variant.summary}`, /novembro/i);
    assert.doesNotMatch(`${variant.title} ${variant.summary}`, /garant|promess? de renda|lucro certo/i);
  }
});
