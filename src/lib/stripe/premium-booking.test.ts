import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildBookingCheckoutParams,
  buildPremiumCheckoutParams,
} from './premium-booking';

test('builds the Premium subscription with the authenticated user reference', () => {
  const params = buildPremiumCheckoutParams({
    userId: 'luthier-id',
    siteUrl: 'https://nkloficial.com.br',
    priceCents: 2900,
  });

  assert.equal(params.mode, 'subscription');
  assert.equal(params.lineItems[0]?.price_data?.unit_amount, 2900);
  assert.deepEqual(params.metadata, {
    reference: 'premium_subscription:luthier-id',
  });
});

test('builds a booking payment from the server-calculated total', () => {
  const params = buildBookingCheckoutParams({
    bookingId: 'booking-id',
    siteUrl: 'https://nkloficial.com.br',
    totalCents: 15750,
    description: 'Aula individual Portal NKL',
  });

  assert.equal(params.mode, 'payment');
  assert.equal(params.lineItems[0]?.price_data?.unit_amount, 15750);
  assert.deepEqual(params.metadata, {
    reference: 'booking:booking-id',
  });
});
