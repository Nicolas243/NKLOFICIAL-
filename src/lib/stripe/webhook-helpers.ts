import type Stripe from 'stripe';

export type StripeReference = {
  type: 'guide_purchase' | 'guide_subscription' | 'booking' | 'premium_subscription';
  id: string;
};

const REFERENCE_PATTERN = /^(guide_purchase|guide_subscription|booking|premium_subscription):([^:]+)$/;

export function getStripeReference(metadata: Stripe.Metadata | null | undefined): StripeReference | null {
  const reference = metadata?.reference;
  if (typeof reference !== 'string') return null;
  const match = REFERENCE_PATTERN.exec(reference);
  if (!match) return null;
  return { type: match[1] as StripeReference['type'], id: match[2] };
}

export function normalizeStripeSubscriptionStatus(status: string | null | undefined): string {
  if (!status) return 'pending';
  if (['active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing'].includes(status)) {
    return status;
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
