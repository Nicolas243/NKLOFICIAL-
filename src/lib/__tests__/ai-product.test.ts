import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AI_ONE_TIME_PRICE_CENTS,
  AI_SUBSCRIPTION_PRICE_CENTS,
  getAiOfferCheckoutMode,
  getAiOfferClientReferenceId,
  getAiOfferPriceCents,
  getAiOfferStripePriceId,
  getAiOfferTitle,
  isAiOfferPlan,
} from '@/lib/ai-product';
import {
  getStripeReference,
  normalizeAiSubscriptionStatus,
  parseClientReferenceId,
} from '@/lib/stripe/webhook-helpers';

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

test('maps AI offer plan to Stripe checkout mode, price ID and client_reference_id', () => {
  assert.equal(getAiOfferCheckoutMode('one_time'), 'payment');
  assert.equal(getAiOfferCheckoutMode('subscription'), 'subscription');
  assert.equal(getAiOfferClientReferenceId('one_time', 'user-123'), 'ai_one_time:user-123');
  assert.equal(getAiOfferClientReferenceId('subscription', 'user-123'), 'ai_subscription:user-123');

  const envVars = {
    AI_ONE_TIME_STRIPE_PRICE_ID: ' price_one_time_123 ',
    AI_SUBSCRIPTION_STRIPE_PRICE_ID: '',
  };
  assert.equal(getAiOfferStripePriceId('one_time', envVars), 'price_one_time_123');
  assert.equal(getAiOfferStripePriceId('subscription', envVars), null);
});

test('parses AI client_reference_id and metadata in Stripe webhook helpers', () => {
  assert.deepEqual(parseClientReferenceId('ai_one_time:user-abc'), {
    type: 'ai_one_time',
    id: 'user-abc',
  });
  assert.deepEqual(parseClientReferenceId('ai_subscription:user-xyz'), {
    type: 'ai_subscription',
    id: 'user-xyz',
  });
  assert.deepEqual(
    getStripeReference({ product: 'ia-na-pratica', plan: 'one_time', userId: 'user-abc' }),
    { type: 'ai_one_time', id: 'user-abc' },
  );
  assert.deepEqual(
    getStripeReference({}, 'ai_subscription:user-xyz'),
    { type: 'ai_subscription', id: 'user-xyz' },
  );
});

test('normalizes AI subscription statuses including cancel_at_period_end', () => {
  assert.equal(normalizeAiSubscriptionStatus({ status: 'active', cancel_at_period_end: false }), 'active');
  assert.equal(normalizeAiSubscriptionStatus({ status: 'active', cancel_at_period_end: true }), 'canceling');
  assert.equal(normalizeAiSubscriptionStatus({ status: 'past_due', cancel_at_period_end: false }), 'past_due');
  assert.equal(normalizeAiSubscriptionStatus({ status: 'canceled', cancel_at_period_end: false }), 'canceled');
  assert.equal(normalizeAiSubscriptionStatus({ status: 'incomplete', cancel_at_period_end: false }), 'pending');
});
