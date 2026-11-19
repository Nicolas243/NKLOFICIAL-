import Stripe from 'stripe';
import { getStripeApiKey } from './config';

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  const apiKey = getStripeApiKey({
    STRIPE_API_KEY: process.env.STRIPE_API_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  });
  if (!apiKey) {
    throw new Error('STRIPE_API_KEY or STRIPE_SECRET_KEY is not configured.');
  }

  stripeClient ??= new Stripe(apiKey);
  return stripeClient;
}

export { stripeClient as stripe };
