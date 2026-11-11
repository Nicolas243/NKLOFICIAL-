import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GUIDE_PAGE_CTA_EXPERIMENT,
  GUIDE_PAGE_CTA_VARIANTS,
  parseGuidePageCtaVariant,
  parseValidatedOfferVariant,
} from '@/lib/offer-experiment';

test('accepts all Guide page CTA variants and rejects invalid values', () => {
  assert.equal(GUIDE_PAGE_CTA_EXPERIMENT, 'guide-page-cta');
  assert.deepEqual(GUIDE_PAGE_CTA_VARIANTS, ['0', '1', '2', '3', '4']);

  for (const variant of GUIDE_PAGE_CTA_VARIANTS) {
    assert.equal(parseGuidePageCtaVariant(variant), variant);
    assert.equal(parseValidatedOfferVariant(`guide-page-cta:${variant}`), `guide-page-cta:${variant}`);
  }

  assert.equal(parseGuidePageCtaVariant('5'), null);
  assert.equal(parseGuidePageCtaVariant('not-a-number'), null);
  assert.equal(parseValidatedOfferVariant('guide-page-cta:5'), null);
  assert.equal(parseValidatedOfferVariant('guide-page-cta:not-a-number'), null);
});

test('preserves the existing program secondary CTA attribution contract', () => {
  assert.equal(parseValidatedOfferVariant('program-secondary-cta:2'), 'program-secondary-cta:2');
});
