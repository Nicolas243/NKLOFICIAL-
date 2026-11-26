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

test('preserves the existing program secondary CTA attribution contract and tier suffixes', () => {
  assert.equal(parseValidatedOfferVariant('program-secondary-cta:2'), 'program-secondary-cta:2');
  assert.equal(parseValidatedOfferVariant('guide-page-cta:0:essential'), 'guide-page-cta:0:essential');
  assert.equal(parseValidatedOfferVariant('mandarin-ebook-sales-page:vip'), 'mandarin-ebook-sales-page:vip');
  assert.equal(parseValidatedOfferVariant('bussola-cta:0'), 'bussola-cta:0');
  assert.equal(parseValidatedOfferVariant('bussola-cta:2'), 'bussola-cta:2');
  assert.equal(parseValidatedOfferVariant('languages-hub-cta:1'), 'languages-hub-cta:1');
  assert.equal(parseValidatedOfferVariant('ia-offer-cta:2'), 'ia-offer-cta:2');
  assert.equal(parseValidatedOfferVariant('bussola-cta:3'), null);
});
