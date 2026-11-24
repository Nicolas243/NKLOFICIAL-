import { getProductBySlug, type ProductSlug } from '@/config/products';
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
  productSlug?: ProductSlug;
  discountPercent?: 0 | 30 | 50;
  overrideAmountCents?: number;
};

export function buildGuidePurchaseCheckoutParams({
  purchaseId,
  siteUrl,
  offerVariant,
  guestAccessToken,
  productSlug,
  discountPercent = 0,
  overrideAmountCents,
}: GuideCheckoutBase & { purchaseId: string }): CreateCheckoutSessionParams {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, '');
  const successUrl = `${normalizedSiteUrl}/guias/renda-extra/sucesso?session_id={CHECKOUT_SESSION_ID}`;
  const languageEbook = getLanguageEbookByOffer(offerVariant);
  const isEnglishEbook = offerVariant === ENGLISH_EBOOK_OFFER_VARIANT;
  const isPaidEbook = isEnglishEbook || Boolean(languageEbook);
  const skuTitle =
    productSlug === 'bussola-negocios' || productSlug === 'pacote-idiomas-ia'
      ? getProductBySlug(productSlug)?.title
      : undefined;
  const productName =
    skuTitle ??
    (isEnglishEbook ? ENGLISH_EBOOK_TITLE : languageEbook?.title ?? GUIDE_TITLE);
  const baseUnitAmount = isPaidEbook ? ENGLISH_EBOOK_PRICE_CENTS : GUIDE_PRICE_CENTS;
  const unitAmount =
    typeof overrideAmountCents === 'number' && Number.isInteger(overrideAmountCents) && overrideAmountCents > 0
      ? overrideAmountCents
      : baseUnitAmount;
  const loyaltyDescription =
    discountPercent === 30
      ? 'Desconto fidelidade automático: 30% OFF (2º idioma)'
      : discountPercent === 50
        ? 'Desconto fidelidade automático: 50% OFF (3º+ idioma)'
        : undefined;
  return {
    mode: 'payment',
    lineItems: [{
      price_data: {
        currency: 'brl',
        product_data: {
          name: productName,
          ...(loyaltyDescription ? { description: loyaltyDescription } : {}),
        },
        unit_amount: unitAmount,
      },
      quantity: 1,
    }],
    metadata: {
      reference: `guide_purchase:${purchaseId}`,
      ...(offerVariant ? { offer_variant: offerVariant } : {}),
      ...(productSlug ? { productSlug } : {}),
      ...(discountPercent > 0 ? { loyaltyDiscountPercent: String(discountPercent) } : {}),
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
