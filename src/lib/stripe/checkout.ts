import type Stripe from 'stripe';
import { isValidProductSlug } from '@/config/products';
import { getStripeClient } from './server';

const ALLOWED_CANCEL_PATH_PREFIXES = [
  '/ofertas/',
  '/guias/',
  '/ia/oferta',
  '/programas/anuncie',
  '/checkout/',
  '/dashboard/luthier/planos',
] as const;

export function sanitizeInternalCancelPath(
  rawPath: string | null | undefined,
): string | null {
  if (typeof rawPath !== 'string') return null;
  const trimmed = rawPath.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed, 'https://portal-nkl.invalid');
  } catch {
    return null;
  }

  if (parsed.origin !== 'https://portal-nkl.invalid') {
    return null;
  }

  const isAllowed = ALLOWED_CANCEL_PATH_PREFIXES.some((prefix) =>
    prefix.endsWith('/')
      ? parsed.pathname.startsWith(prefix)
      : parsed.pathname === prefix,
  );
  if (!isAllowed) {
    return null;
  }

  return `${parsed.pathname}${parsed.search}`;
}

export function extractSameOriginCancelPath(
  referer: string | null | undefined,
  siteUrl: string,
): string | null {
  if (typeof referer !== 'string' || !referer.trim()) return null;
  try {
    const refererUrl = new URL(referer);
    const siteOrigin = new URL(siteUrl).origin;
    if (refererUrl.origin !== siteOrigin) {
      return null;
    }
    return sanitizeInternalCancelPath(`${refererUrl.pathname}${refererUrl.search}`);
  } catch {
    return null;
  }
}

export function resolveSafeCheckoutCancelUrl({
  siteUrl,
  cancelPath,
  productSlug,
  referer,
  fallbackPath,
}: {
  siteUrl: string;
  cancelPath?: string | null;
  productSlug?: string | null;
  referer?: string | null;
  fallbackPath: string;
}): string {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, '');
  const explicitPath = sanitizeInternalCancelPath(cancelPath);
  if (explicitPath) {
    return `${normalizedSiteUrl}${explicitPath}`;
  }

  if (productSlug && isValidProductSlug(productSlug)) {
    return `${normalizedSiteUrl}/ofertas/${productSlug}/checkout`;
  }

  const refererPath = extractSameOriginCancelPath(referer, normalizedSiteUrl);
  if (refererPath) {
    return `${normalizedSiteUrl}${refererPath}`;
  }

  const safeFallback = sanitizeInternalCancelPath(fallbackPath) ?? '/';
  return `${normalizedSiteUrl}${safeFallback}`;
}

export type CreateCheckoutSessionParams = {
  mode: Stripe.Checkout.SessionCreateParams.Mode;
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
  metadata: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  integrationIdentifier?: string;
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
    integration_identifier: params.integrationIdentifier ?? `portal_nkl_${randomLetters(8)}`,
    ...(params.mode === 'subscription' ? { subscription_data: { metadata: params.metadata } } : {}),
  });
}

function randomLetters(length: number): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}
