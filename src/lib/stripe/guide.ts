import {
  GUIDE_PRICE_CENTS,
  GUIDE_SUBSCRIPTION_PRICE_CENTS,
  GUIDE_SUBSCRIPTION_TITLE,
  GUIDE_TITLE,
} from '@/lib/guide-offer';
import type { CreateCheckoutSessionParams } from './checkout';

type GuideCheckoutBase = {
  siteUrl: string;
  offerVariant?: string;
};

export function buildGuidePurchaseCheckoutParams({
  purchaseId,
  siteUrl,
  offerVariant,
}: GuideCheckoutBase & { purchaseId: string }): CreateCheckoutSessionParams {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, '');
  return {
    mode: 'payment',
    lineItems: [{
      price_data: {
        currency: 'brl',
        product_data: { name: GUIDE_TITLE },
        unit_amount: GUIDE_PRICE_CENTS,
      },
      quantity: 1,
    }],
    metadata: {
      reference: `guide_purchase:${purchaseId}`,
      ...(offerVariant ? { offer_variant: offerVariant } : {}),
    },
    successUrl: `${normalizedSiteUrl}/guias/renda-extra/sucesso`,
    cancelUrl: `${normalizedSiteUrl}/guias/renda-extra`,
  };
}

export function buildGuideSubscriptionCheckoutParams({
  subscriptionId,
  siteUrl,
  payerEmail,
  offerVariant,
}: GuideCheckoutBase & {
  subscriptionId: string;
  payerEmail: string;
}): CreateCheckoutSessionParams {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, '');
  return {
    mode: 'subscription',
    lineItems: [{
      price_data: {
        currency: 'brl',
        product_data: { name: GUIDE_SUBSCRIPTION_TITLE },
        recurring: { interval: 'month' },
        unit_amount: GUIDE_SUBSCRIPTION_PRICE_CENTS,
      },
      quantity: 1,
    }],
    metadata: {
      reference: `guide_subscription:${subscriptionId}`,
      ...(offerVariant ? { offer_variant: offerVariant } : {}),
    },
    successUrl: `${normalizedSiteUrl}/guias/renda-extra/sucesso?plan=subscription&subscription_id=${encodeURIComponent(subscriptionId)}`,
    cancelUrl: `${normalizedSiteUrl}/guias/renda-extra`,
    customerEmail: payerEmail,
  };
}
