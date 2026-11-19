import {
  ENGLISH_EBOOK_OFFER_VARIANT,
  ENGLISH_EBOOK_PRICE_CENTS,
  ENGLISH_EBOOK_TITLE,
  GUIDE_PRICE_CENTS,
  GUIDE_SUBSCRIPTION_PRICE_CENTS,
  GUIDE_SUBSCRIPTION_TITLE,
  GUIDE_TITLE,
  getGuideCancelPath,
  getLanguageEbookByOffer,
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
  const languageEbook = getLanguageEbookByOffer(offerVariant);
  const isEnglishEbook = offerVariant === ENGLISH_EBOOK_OFFER_VARIANT;
  const isPaidEbook = isEnglishEbook || Boolean(languageEbook);
  return {
    mode: 'payment',
    lineItems: [{
      price_data: {
        currency: 'brl',
        product_data: { name: isEnglishEbook ? ENGLISH_EBOOK_TITLE : languageEbook?.title ?? GUIDE_TITLE },
        unit_amount: isPaidEbook ? ENGLISH_EBOOK_PRICE_CENTS : GUIDE_PRICE_CENTS,
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
    cancelUrl: `${normalizedSiteUrl}${getGuideCancelPath(offerVariant)}`,
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
