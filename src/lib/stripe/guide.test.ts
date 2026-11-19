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

  test('builds the English ebook checkout at R$47 with the English product title', () => {
    const params = buildGuidePurchaseCheckoutParams({
      purchaseId: 'purchase-english',
      siteUrl: 'https://nkloficial.com.br',
      offerVariant: 'english-ebook-sales-page',
    });

    assert.equal(params.lineItems[0]?.price_data?.unit_amount, 4700);
    assert.equal(params.lineItems[0]?.price_data?.product_data?.name, 'Inglês para ganhar dinheiro | E-book Portal NKL');
    assert.equal(params.metadata.reference, 'guide_purchase:purchase-english');
  });

  assert.equal(params.mode, 'payment');
  assert.equal(params.lineItems[0]?.price_data?.unit_amount, 3900);
  assert.deepEqual(params.metadata, {
    reference: 'guide_purchase:purchase-id',
    offer_variant: 'guide-page-cta:2',
  });
  assert.equal(params.successUrl, 'https://nkloficial.com.br/guias/renda-extra/sucesso?session_id={CHECKOUT_SESSION_ID}');
});

test('builds a recurring Guide Checkout session with the payer email', () => {
  const params = buildGuideSubscriptionCheckoutParams({
    subscriptionId: 'subscription-id',
    siteUrl: 'https://nkloficial.com.br',
    payerEmail: 'cliente@example.com',
    offerVariant: undefined,
  });

  test('builds each language ebook checkout at R$47', () => {
    for (const [offerVariant, title] of [
      ['italian-ebook-sales-page', 'Italiano para ganhar possibilidades | E-book Portal NKL'],
      ['french-ebook-sales-page', 'Francês para ganhar possibilidades | E-book Portal NKL'],
      ['german-ebook-sales-page', 'Alemão para ganhar possibilidades | E-book Portal NKL'],
      ['spanish-ebook-sales-page', 'Espanhol para ganhar possibilidades | E-book Portal NKL'],
      ['mandarin-ebook-sales-page', 'Mandarim para ganhar possibilidades | E-book Portal NKL'],
    ] as const) {
      const params = buildGuidePurchaseCheckoutParams({
        purchaseId: `purchase-${offerVariant}`,
        siteUrl: 'https://nkloficial.com.br',
        offerVariant,
      });
      assert.equal(params.lineItems[0]?.price_data?.unit_amount, 4700);
      assert.equal(params.lineItems[0]?.price_data?.product_data?.name, title);
    }
  });

  assert.equal(params.mode, 'subscription');
  assert.equal(params.lineItems[0]?.price_data?.unit_amount, 1900);
  assert.equal(params.lineItems[0]?.price_data?.recurring?.interval, 'month');
  assert.deepEqual(params.metadata, {
    reference: 'guide_subscription:subscription-id',
  });
  assert.equal(params.customerEmail, 'cliente@example.com');
});

test('keeps guest access token only in the success handoff and out of Stripe metadata', () => {
  const purchase = buildGuidePurchaseCheckoutParams({
    purchaseId: 'purchase-id',
    siteUrl: 'https://nkloficial.com.br',
    guestAccessToken: 'opaque-token',
  });
  const subscription = buildGuideSubscriptionCheckoutParams({
    subscriptionId: 'subscription-id',
    siteUrl: 'https://nkloficial.com.br',
    payerEmail: 'cliente@example.com',
    guestAccessToken: 'opaque-token',
  });

  assert.match(purchase.successUrl, /guest_access_token=opaque-token/u);
  assert.match(subscription.successUrl, /guest_access_token=opaque-token/u);
  assert.equal(Object.values(purchase.metadata).includes('opaque-token'), false);
  assert.equal(Object.values(subscription.metadata).includes('opaque-token'), false);
});
