import assert from 'node:assert/strict';
import test from 'node:test';
import { hasStripeConfiguration } from './config';

test('does not require Stripe secrets for an unconfigured local environment', () => {
  assert.equal(hasStripeConfiguration({}), false);
  assert.equal(hasStripeConfiguration({
    STRIPE_SECRET_KEY: 'sk_test_local',
  }), false);
});

test('recognizes a complete Stripe configuration without exposing its values', () => {
  assert.equal(hasStripeConfiguration({
    STRIPE_SECRET_KEY: 'sk_test_local',
    STRIPE_WEBHOOK_SECRET: 'whsec_local',
  }), true);
});
