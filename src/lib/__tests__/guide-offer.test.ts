import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GUIDE_PAGE_CTA_VARIANTS,
  extractOfferTier,
  getGuideTierPriceCents,
  withOfferTier,
} from '@/lib/guide-offer';

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

test('computes 3-tier Decoy Pricing server-side with loyalty discount for essential/complete and fixed VIP anchor', () => {
  assert.equal(extractOfferTier('sales-page:essential'), 'essential');
  assert.equal(extractOfferTier('sales-page'), 'complete');
  assert.equal(extractOfferTier('mandarin-ebook-sales-page:vip'), 'vip');
  assert.equal(withOfferTier('sales-page:vip', 'complete'), 'sales-page');
  assert.equal(withOfferTier('sales-page', 'vip'), 'sales-page:vip');

  assert.deepEqual(getGuideTierPriceCents('sales-page', 'essential'), { amountCents: 1900, discountPercent: 0 });
  assert.deepEqual(getGuideTierPriceCents('sales-page', 'complete'), { amountCents: 3900, discountPercent: 0 });
  assert.deepEqual(getGuideTierPriceCents('sales-page', 'vip'), { amountCents: 24700, discountPercent: 0 });

  assert.deepEqual(getGuideTierPriceCents('mandarin-ebook-sales-page', 'essential', 0), { amountCents: 2700, discountPercent: 0 });
  assert.deepEqual(getGuideTierPriceCents('mandarin-ebook-sales-page', 'complete', 1), { amountCents: 3290, discountPercent: 30 });
  assert.deepEqual(getGuideTierPriceCents('mandarin-ebook-sales-page', 'vip', 2), { amountCents: 29700, discountPercent: 0 });
});
