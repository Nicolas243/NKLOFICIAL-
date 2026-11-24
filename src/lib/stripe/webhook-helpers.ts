import type Stripe from 'stripe';
import { isValidProductSlug, type ProductSlug } from '@/config/products';

export type StripeReference =
  | {
      type:
        | 'guide_purchase'
        | 'guide_subscription'
        | 'booking'
        | 'premium_subscription'
        | 'ad_campaign'
        | 'ai_one_time'
        | 'ai_subscription';
      id: string;
    }
  | {
      type: 'product_entitlement';
      id: string;
      userId: string;
      productSlug: ProductSlug;
    };

export type AiGrantStatus = 'pending' | 'active' | 'canceling' | 'canceled' | 'past_due';

const REFERENCE_PATTERN = /^(guide_purchase|guide_subscription|booking|premium_subscription|ad_campaign|ai_one_time|ai_subscription):([^:]+)$/;
const PRODUCT_ENTITLEMENT_PATTERN = /^product_entitlement:([^:]+):([^:]+)$/;

export function parseClientReferenceId(reference: string | null | undefined): StripeReference | null {
  if (typeof reference !== 'string') return null;
  const trimmed = reference.trim();
  const match = REFERENCE_PATTERN.exec(trimmed);
  if (match) {
    return { type: match[1] as Exclude<StripeReference['type'], 'product_entitlement'>, id: match[2] };
  }

  const entitlementMatch = PRODUCT_ENTITLEMENT_PATTERN.exec(trimmed);
  if (entitlementMatch) {
    const userId = entitlementMatch[1].trim();
    const productSlug = entitlementMatch[2].trim();
    if (userId.length > 0 && isValidProductSlug(productSlug)) {
      return {
        type: 'product_entitlement',
        id: userId,
        userId,
        productSlug,
      };
    }
  }

  return null;
}

export function getStripeReference(
  metadata: Stripe.Metadata | null | undefined,
  clientReferenceId?: string | null,
): StripeReference | null {
  const fromReference = parseClientReferenceId(metadata?.reference);
  if (fromReference) return fromReference;

  const fromClientReference = parseClientReferenceId(clientReferenceId);
  if (fromClientReference) return fromClientReference;

  const productSlug = metadata?.productSlug?.trim();
  const userId = metadata?.userId?.trim();
  if (productSlug && userId && !userId.includes(':') && isValidProductSlug(productSlug)) {
    return {
      type: 'product_entitlement',
      id: userId,
      userId,
      productSlug,
    };
  }

  const product = metadata?.product?.trim();
  const plan = metadata?.plan?.trim();
  if ((product === 'ia-na-pratica' || product === 'ai-na-pratica') && userId && !userId.includes(':')) {
    if (plan === 'one_time') return { type: 'ai_one_time', id: userId };
    if (plan === 'subscription') return { type: 'ai_subscription', id: userId };
  }

  return null;
}

export function resolveGuideProductSlug(
  offerVariant: string | null | undefined,
  metadataProductSlug?: string | null,
): ProductSlug {
  const normalizedMetadataSlug = metadataProductSlug?.trim();
  if (normalizedMetadataSlug && isValidProductSlug(normalizedMetadataSlug)) {
    return normalizedMetadataSlug;
  }
  const normalizedVariant = offerVariant?.trim();
  if (normalizedVariant === 'english-ebook-sales-page') {
    return 'ebook-ingles';
  }
  if (normalizedVariant && isValidProductSlug(normalizedVariant)) {
    return normalizedVariant;
  }
  return 'pacote-renda-extra';
}

export function normalizeStripeSubscriptionStatus(status: string | null | undefined): string {
  if (!status) return 'pending';
  if (['active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing'].includes(status)) {
    return status;
  }
  return 'pending';
}

export function normalizeAiSubscriptionStatus(
  subscription: { status?: string | null; cancel_at_period_end?: boolean | null } | string | null | undefined,
): AiGrantStatus {
  const status = typeof subscription === 'string' ? subscription : subscription?.status;
  const cancelAtPeriodEnd = typeof subscription === 'object' && subscription !== null
    ? Boolean(subscription.cancel_at_period_end)
    : false;

  if (status === 'active' || status === 'trialing') {
    return cancelAtPeriodEnd ? 'canceling' : 'active';
  }
  if (status === 'past_due' || status === 'unpaid') {
    return 'past_due';
  }
  if (status === 'canceled' || status === 'incomplete_expired') {
    return 'canceled';
  }
  return 'pending';
}

export function parseStripePeriodEnd(value: number | string | null | undefined): Date | null {
  if (typeof value === 'number' && Number.isFinite(value)) return new Date(value * 1000);
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}
