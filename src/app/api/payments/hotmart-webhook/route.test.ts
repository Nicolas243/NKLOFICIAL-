import assert from 'node:assert/strict';
import test from 'node:test';
import { getValidatedCtaVariant } from './route';

test('accepts validated Guide CTA attribution from Hotmart purchase data', () => {
  assert.equal(getValidatedCtaVariant({
    purchase: { origin: { sck: 'guide-page-cta:4' } },
  }, false), 'guide-page-cta:4');
  assert.equal(getValidatedCtaVariant({
    purchase: { origin: { sck: 'guide-page-cta:5' } },
  }, false), null);
});
