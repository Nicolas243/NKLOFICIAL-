import assert from 'node:assert/strict';
import test from 'node:test';
import { getStripeApiKey, hasStripeConfiguration } from './config';

test('does not require Stripe secrets for an unconfigured local environment', () => {
  assert.equal(hasStripeConfiguration({}), false);
  assert.equal(hasStripeConfiguration({
    STRIPE_SECRET_KEY: 'sk_test_local',
  }), false);
});

test('prefers the dedicated Stripe API key over the legacy variable', () => {
  assert.equal(getStripeApiKey({
    STRIPE_API_KEY: 'rk_test_portal',
    STRIPE_SECRET_KEY: 'sk_test_legacy',
  }), 'rk_test_portal');
});

test('recognizes a complete Stripe configuration without exposing its values', () => {
  assert.equal(hasStripeConfiguration({
    STRIPE_SECRET_KEY: 'sk_test_local',
    STRIPE_WEBHOOK_SECRET: 'whsec_local',
  }), true);
});
