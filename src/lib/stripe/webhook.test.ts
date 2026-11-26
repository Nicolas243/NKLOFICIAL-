import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractStripeInvoiceSubscriptionId,
  getStripeReference,
  normalizeAiSubscriptionStatus,
  normalizeStripeSubscriptionStatus,
  parseClientReferenceId,
  parseStripePeriodEnd,
} from './webhook-helpers';

test('accepts only known domain references from Stripe metadata and client_reference_id', () => {
  assert.deepEqual(getStripeReference({ reference: 'guide_purchase:purchase-id' }), {
    type: 'guide_purchase',
    id: 'purchase-id',
  });
  assert.deepEqual(getStripeReference({ reference: 'booking:booking-id' }), {
    type: 'booking',
    id: 'booking-id',
  });
  assert.deepEqual(parseClientReferenceId('ai_one_time:user-1'), {
    type: 'ai_one_time',
    id: 'user-1',
  });
  assert.deepEqual(parseClientReferenceId('ai_subscription:user-2'), {
    type: 'ai_subscription',
    id: 'user-2',
  });
  assert.deepEqual(
    getStripeReference({ product: 'ia-na-pratica', plan: 'subscription', userId: 'user-2' }),
    { type: 'ai_subscription', id: 'user-2' },
  );
  assert.deepEqual(
    getStripeReference({ product: 'ia-na-pratica', plan: 'vip', userId: 'user-3' }),
    { type: 'ai_one_time', id: 'user-3' },
  );
  assert.equal(getStripeReference({ reference: 'forged:record-id' }), null);
  assert.equal(getStripeReference({}), null);
});

test('normalizes Stripe subscription statuses for domain access', () => {
  assert.equal(normalizeStripeSubscriptionStatus('active'), 'active');
  assert.equal(normalizeStripeSubscriptionStatus('past_due'), 'past_due');
  assert.equal(normalizeStripeSubscriptionStatus('canceled'), 'canceled');
  assert.equal(normalizeStripeSubscriptionStatus('unrecognized'), 'pending');
  assert.equal(normalizeAiSubscriptionStatus({ status: 'active', cancel_at_period_end: true }), 'canceling');
  assert.equal(normalizeAiSubscriptionStatus({ status: 'active', cancel_at_period_end: false }), 'active');
  assert.equal(normalizeAiSubscriptionStatus('past_due'), 'past_due');
  assert.equal(normalizeAiSubscriptionStatus('canceled'), 'canceled');
});

test('parses Stripe period timestamps and rejects invalid values', () => {
  assert.equal(parseStripePeriodEnd(1735689600)?.toISOString(), '2025-01-01T00:00:00.000Z');
  assert.equal(parseStripePeriodEnd('2025-01-01T00:00:00.000Z')?.toISOString(), '2025-01-01T00:00:00.000Z');
  assert.equal(parseStripePeriodEnd('invalid'), null);
  assert.equal(parseStripePeriodEnd(undefined), null);
});

test('extracts subscription id from both 2026-10-28.endive parent shape and legacy invoice shape', () => {
  assert.equal(
    extractStripeInvoiceSubscriptionId({ parent: { subscription_details: { subscription: 'sub_endive_1' } } }),
    'sub_endive_1',
  );
  assert.equal(
    extractStripeInvoiceSubscriptionId({ parent: { subscription_details: { subscription: { id: 'sub_endive_2' } } } }),
    'sub_endive_2',
  );
  assert.equal(
    extractStripeInvoiceSubscriptionId({ subscription: 'sub_legacy_1' }),
    'sub_legacy_1',
  );
  assert.equal(
    extractStripeInvoiceSubscriptionId({ subscription: { id: 'sub_legacy_2' } }),
    'sub_legacy_2',
  );
  assert.equal(extractStripeInvoiceSubscriptionId({ parent: null, subscription: null }), null);
  assert.equal(extractStripeInvoiceSubscriptionId(null), null);
});
