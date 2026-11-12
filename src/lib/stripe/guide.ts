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
  guestAccessToken?: string;
};

export function buildGuidePurchaseCheckoutParams({
  purchaseId,
  siteUrl,
  offerVariant,
  guestAccessToken,
}: GuideCheckoutBase & { purchaseId: string }): CreateCheckoutSessionParams {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, '');
  const successUrl = `${normalizedSiteUrl}/guias/renda-extra/sucesso?session_id={CHECKOUT_SESSION_ID}`;
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
    successUrl: guestAccessToken
      ? `${successUrl}&reference=${encodeURIComponent(`guide_purchase:${purchaseId}`)}&guest_access_token=${encodeURIComponent(guestAccessToken)}`
      : successUrl,
    cancelUrl: `${normalizedSiteUrl}/guias/renda-extra`,
  };
}

export function buildGuideSubscriptionCheckoutParams({
  subscriptionId,
  siteUrl,
  payerEmail,
  offerVariant,
  guestAccessToken,
}: GuideCheckoutBase & {
  subscriptionId: string;
  payerEmail: string;
}): CreateCheckoutSessionParams {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, '');
  const successParams = new URLSearchParams({
    plan: 'subscription',
    subscription_id: subscriptionId,
  });
  if (guestAccessToken) {
    successParams.set('reference', `guide_subscription:${subscriptionId}`);
    successParams.set('guest_access_token', guestAccessToken);
  }
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
    successUrl: `${normalizedSiteUrl}/guias/renda-extra/sucesso?${successParams.toString()}`,
    cancelUrl: `${normalizedSiteUrl}/guias/renda-extra`,
    customerEmail: payerEmail,
  };
}
