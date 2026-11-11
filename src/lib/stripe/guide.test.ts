import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildGuidePurchaseCheckoutParams,
  buildGuideSubscriptionCheckoutParams,
} from './guide';

test('builds a one-time Guide Checkout session from the server price', () => {
  const params = buildGuidePurchaseCheckoutParams({
    purchaseId: 'purchase-id',
    siteUrl: 'https://nkloficial.com.br',
    offerVariant: 'guide-page-cta:2',
  });

  assert.equal(params.mode, 'payment');
  assert.equal(params.lineItems[0]?.price_data?.unit_amount, 3900);
  assert.deepEqual(params.metadata, {
    reference: 'guide_purchase:purchase-id',
    offer_variant: 'guide-page-cta:2',
  });
  assert.equal(params.successUrl, 'https://nkloficial.com.br/guias/renda-extra/sucesso');
});

test('builds a recurring Guide Checkout session with the payer email', () => {
  const params = buildGuideSubscriptionCheckoutParams({
    subscriptionId: 'subscription-id',
    siteUrl: 'https://nkloficial.com.br',
    payerEmail: 'cliente@example.com',
    offerVariant: undefined,
  });

  assert.equal(params.mode, 'subscription');
  assert.equal(params.lineItems[0]?.price_data?.unit_amount, 1900);
  assert.equal(params.lineItems[0]?.price_data?.recurring?.interval, 'month');
  assert.deepEqual(params.metadata, {
    reference: 'guide_subscription:subscription-id',
  });
  assert.equal(params.customerEmail, 'cliente@example.com');
});
