import type { CreateCheckoutSessionParams } from './checkout';

export function buildPremiumCheckoutParams({
  userId,
  siteUrl,
  priceCents,
  interval = 'month',
  planLabel,
}: {
  userId: string;
  siteUrl: string;
  priceCents: number;
  interval?: 'month' | 'year';
  planLabel?: string;
}): CreateCheckoutSessionParams {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, '');
  const resolvedLabel = planLabel ?? (
    interval === 'year'
      ? 'Plano Premium Anual — Mestre Luthier Portal NKL'
      : 'Plano Premium para Luthiers Portal NKL'
  );
  return {
    mode: 'subscription',
    lineItems: [{
      price_data: {
        currency: 'brl',
        product_data: { name: resolvedLabel },
        recurring: { interval },
        unit_amount: priceCents,
      },
      quantity: 1,
    }],
    metadata: {
      reference: `premium_subscription:${userId}`,
      ...(interval !== 'month' ? { billingInterval: interval } : {}),
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
