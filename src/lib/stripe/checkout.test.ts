import assert from 'node:assert/strict';
import test from 'node:test';
import Stripe from 'stripe';

test('creates a hosted Checkout session with BRL items and domain metadata', async () => {
  const { createCheckoutSession } = await import('./checkout');
  const session = await createCheckoutSession({
    mode: 'payment',
    lineItems: [{
      price_data: {
        currency: 'brl',
        product_data: { name: 'Guia Portal NKL' },
        unit_amount: 3900,
      },
      quantity: 1,
    }],
    metadata: { reference: 'guide_purchase:purchase-id' },
    successUrl: 'https://nkloficial.com.br/sucesso',
    cancelUrl: 'https://nkloficial.com.br/guia',
    customerEmail: 'cliente@example.com',
  }, {
    checkout: {
      sessions: {
        create: async (params) => {
          assert.ok(params);
          return {
            id: 'cs_test_portal_nkl',
            url: 'https://checkout.stripe.com/c/pay/cs_test_portal_nkl',
            metadata: params.metadata,
          } as Stripe.Response<Stripe.Checkout.Session>;
        },
      },
    },
  } as Pick<Stripe, 'checkout'>);

  assert.equal(session.url, 'https://checkout.stripe.com/c/pay/cs_test_portal_nkl');
  assert.deepEqual(session.metadata, { reference: 'guide_purchase:purchase-id' });
});

test('fails explicitly when the Stripe secret is missing', async () => {
  delete process.env.STRIPE_SECRET_KEY;
  const { createCheckoutSession } = await import('./checkout');

  await assert.rejects(
    createCheckoutSession({
      mode: 'payment',
      lineItems: [{
        price_data: {
          currency: 'brl',
          product_data: { name: 'Guia Portal NKL' },
          unit_amount: 3900,
        },
        quantity: 1,
      }],
      metadata: { reference: 'guide_purchase:purchase-id' },
      successUrl: 'https://nkloficial.com.br/sucesso',
      cancelUrl: 'https://nkloficial.com.br/guia',
    }),
    /STRIPE_SECRET_KEY/,
  );
});

test('buildGuidePurchaseCheckoutParams forwards exact productSlug and specialized SKU titles', async () => {
  const { buildGuidePurchaseCheckoutParams } = await import('./guide');

  const bussolaParams = buildGuidePurchaseCheckoutParams({
    purchaseId: 'purchase-bussola',
    siteUrl: 'https://nkloficial.com.br',
    offerVariant: 'sales-page',
    productSlug: 'bussola-negocios',
  });
  assert.equal(bussolaParams.metadata.productSlug, 'bussola-negocios');
  assert.equal(
    (bussolaParams.lineItems[0] as { price_data?: { product_data?: { name?: string } } })?.price_data?.product_data?.name,
    'Bússola de Negócios',
  );

  const idiomasParams = buildGuidePurchaseCheckoutParams({
    purchaseId: 'purchase-idiomas',
    siteUrl: 'https://nkloficial.com.br',
    offerVariant: 'english-ebook-sales-page',
    productSlug: 'pacote-idiomas-ia',
  });
  assert.equal(idiomasParams.metadata.productSlug, 'pacote-idiomas-ia');
  assert.equal(
    (idiomasParams.lineItems[0] as { price_data?: { product_data?: { name?: string } } })?.price_data?.product_data?.name,
    'Pacote Idiomas com IA',
  );
});

test('resolveGuideProductSlug prioritizes valid metadata.productSlug across all guide SKUs', async () => {
  const { resolveGuideProductSlug } = await import('./webhook-helpers');

  assert.equal(resolveGuideProductSlug('sales-page', 'bussola-negocios'), 'bussola-negocios');
  assert.equal(resolveGuideProductSlug('english-ebook-sales-page', 'pacote-idiomas-ia'), 'pacote-idiomas-ia');
  assert.equal(resolveGuideProductSlug('sales-page', 'pacote-renda-extra'), 'pacote-renda-extra');
  assert.equal(resolveGuideProductSlug('english-ebook-sales-page', 'ebook-ingles'), 'ebook-ingles');
  assert.equal(resolveGuideProductSlug('sales-page', 'slug-desconhecido'), 'pacote-renda-extra');
});

test('buildGuidePurchaseCheckoutParams applies 30% and 50% progressive language loyalty discounts', async () => {
  const { buildGuidePurchaseCheckoutParams } = await import('./guide');

  const secondLang = buildGuidePurchaseCheckoutParams({
    purchaseId: 'purchase-2nd',
    siteUrl: 'https://nkloficial.com.br',
    offerVariant: 'italian-ebook-sales-page',
    discountPercent: 30,
    overrideAmountCents: 3290,
  });
  assert.equal(secondLang.metadata.loyaltyDiscountPercent, '30');
  assert.equal(
    (secondLang.lineItems[0] as { price_data?: { unit_amount?: number } })?.price_data?.unit_amount,
    3290,
  );

  const thirdLang = buildGuidePurchaseCheckoutParams({
    purchaseId: 'purchase-3rd',
    siteUrl: 'https://nkloficial.com.br',
    offerVariant: 'spanish-ebook-sales-page',
    discountPercent: 50,
    overrideAmountCents: 2350,
    customerEmail: 'comprador@example.com',
  });
  assert.equal(thirdLang.metadata.loyaltyDiscountPercent, '50');
  assert.equal(thirdLang.customerEmail, 'comprador@example.com');
  assert.equal(
    (thirdLang.lineItems[0] as { price_data?: { unit_amount?: number } })?.price_data?.unit_amount,
    2350,
  );

  const essentialGuide = buildGuidePurchaseCheckoutParams({
    purchaseId: 'purchase-essential',
    siteUrl: 'https://nkloficial.com.br',
    offerVariant: 'sales-page:essential',
  });
  assert.equal(
    (essentialGuide.lineItems[0] as { price_data?: { unit_amount?: number } })?.price_data?.unit_amount,
    1900,
  );

  const vipLanguagePassport = buildGuidePurchaseCheckoutParams({
    purchaseId: 'purchase-vip-lang',
    siteUrl: 'https://nkloficial.com.br',
    offerVariant: 'mandarin-ebook-sales-page:vip',
  });
  assert.equal(
    (vipLanguagePassport.lineItems[0] as { price_data?: { unit_amount?: number } })?.price_data?.unit_amount,
    29700,
  );
  assert.equal(vipLanguagePassport.cancelUrl, 'https://nkloficial.com.br/guias/chines');
});
