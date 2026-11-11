import type { CreateCheckoutSessionParams } from './checkout';

export function buildPremiumCheckoutParams({
  userId,
  siteUrl,
  priceCents,
}: {
  userId: string;
  siteUrl: string;
  priceCents: number;
}): CreateCheckoutSessionParams {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, '');
  return {
    mode: 'subscription',
    lineItems: [{
      price_data: {
        currency: 'brl',
        product_data: { name: 'Plano Premium para Luthiers Portal NKL' },
        recurring: { interval: 'month' },
        unit_amount: priceCents,
      },
      quantity: 1,
    }],
    metadata: {
      reference: `premium_subscription:${userId}`,
    },
    successUrl: `${normalizedSiteUrl}/dashboard/luthier/planos?checkout=success`,
    cancelUrl: `${normalizedSiteUrl}/dashboard/luthier/planos?checkout=canceled`,
  };
}

export function buildBookingCheckoutParams({
  bookingId,
  siteUrl,
  totalCents,
  description,
}: {
  bookingId: string;
  siteUrl: string;
  totalCents: number;
  description: string;
}): CreateCheckoutSessionParams {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, '');
  return {
    mode: 'payment',
    lineItems: [{
      price_data: {
        currency: 'brl',
        product_data: { name: description },
        unit_amount: totalCents,
      },
      quantity: 1,
    }],
    metadata: {
      reference: `booking:${bookingId}`,
    },
    successUrl: `${normalizedSiteUrl}/checkout/${bookingId}/sucesso`,
    cancelUrl: `${normalizedSiteUrl}/checkout/${bookingId}`,
  };
}
