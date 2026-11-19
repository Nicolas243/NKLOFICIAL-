import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AI_ONE_TIME_PRICE_CENTS,
  AI_SUBSCRIPTION_PRICE_CENTS,
  getAiOfferPriceCents,
  getAiOfferTitle,
  isAiOfferPlan,
} from '@/lib/ai-product';

test('keeps AI offer prices server-owned and explicit', () => {
  assert.equal(AI_ONE_TIME_PRICE_CENTS, 9900);
  assert.equal(AI_SUBSCRIPTION_PRICE_CENTS, 3900);
  assert.equal(getAiOfferPriceCents('one_time'), 9900);
  assert.equal(getAiOfferPriceCents('subscription'), 3900);
  assert.match(getAiOfferTitle('subscription'), /mensal/i);
});

test('rejects unknown AI offer plans', () => {
  assert.equal(isAiOfferPlan('one_time'), true);
  assert.equal(isAiOfferPlan('subscription'), true);
  assert.equal(isAiOfferPlan('free'), false);
});
