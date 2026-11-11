import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getOfferExperimentVariants,
  validateOfferEvent,
} from './route';

test('registers five balanced Guide CTA variants alongside the program experiment', () => {
  assert.deepEqual(getOfferExperimentVariants('guide-page-cta'), ['0', '1', '2', '3', '4']);
  assert.deepEqual(getOfferExperimentVariants('program-secondary-cta'), ['0', '1', '2']);
});

test('accepts a Guide impression and rejects an unsupported variant', () => {
  assert.equal(validateOfferEvent({
    experiment: 'guide-page-cta',
    variant: '0',
    eventType: 'impression',
  }), true);
  assert.equal(validateOfferEvent({
    experiment: 'guide-page-cta',
    variant: '5',
    eventType: 'impression',
  }), false);
});
