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
