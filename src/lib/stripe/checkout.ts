import type Stripe from 'stripe';
import { getStripeClient } from './server';

export type CreateCheckoutSessionParams = {
  mode: Stripe.Checkout.SessionCreateParams.Mode;
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
  metadata: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
};

export async function createCheckoutSession(
  params: CreateCheckoutSessionParams,
  client?: Pick<Stripe, 'checkout'>,
): Promise<Stripe.Checkout.Session> {
  if (params.lineItems.length === 0) {
    throw new Error('At least one Stripe Checkout line item is required.');
  }

  const stripe = client ?? getStripeClient();
  return stripe.checkout.sessions.create({
    mode: params.mode,
    line_items: params.lineItems,
    metadata: params.metadata,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.customerEmail,
  });
}
