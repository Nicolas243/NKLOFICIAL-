import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getStripeReference,
  normalizeStripeSubscriptionStatus,
  parseStripePeriodEnd,
} from './webhook-helpers';

test('accepts only known domain references from Stripe metadata', () => {
  assert.deepEqual(getStripeReference({ reference: 'guide_purchase:purchase-id' }), {
    type: 'guide_purchase',
    id: 'purchase-id',
  });
  assert.deepEqual(getStripeReference({ reference: 'booking:booking-id' }), {
    type: 'booking',
    id: 'booking-id',
  });
  assert.equal(getStripeReference({ reference: 'forged:record-id' }), null);
  assert.equal(getStripeReference({}), null);
});

test('normalizes Stripe subscription statuses for domain access', () => {
  assert.equal(normalizeStripeSubscriptionStatus('active'), 'active');
  assert.equal(normalizeStripeSubscriptionStatus('past_due'), 'past_due');
  assert.equal(normalizeStripeSubscriptionStatus('canceled'), 'canceled');
  assert.equal(normalizeStripeSubscriptionStatus('unrecognized'), 'pending');
});

test('parses Stripe period timestamps and rejects invalid values', () => {
  assert.equal(parseStripePeriodEnd(1735689600)?.toISOString(), '2025-01-01T00:00:00.000Z');
  assert.equal(parseStripePeriodEnd('2025-01-01T00:00:00.000Z')?.toISOString(), '2025-01-01T00:00:00.000Z');
  assert.equal(parseStripePeriodEnd('invalid'), null);
  assert.equal(parseStripePeriodEnd(undefined), null);
});
