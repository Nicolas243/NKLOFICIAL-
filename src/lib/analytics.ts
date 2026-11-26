import { track as trackVercelEvent } from '@vercel/analytics';
import { CONSENT_STORAGE_KEY, getPostHogClient } from '@/components/privacy-scripts';
import { getOfferExperimentFromVariant, parseValidatedOfferVariant } from '@/lib/offer-experiment';

type AnalyticsParams = Record<string, string | number | boolean>;

type Gtag = (command: 'event', eventName: string, params?: AnalyticsParams) => void;
export type OfferFunnelEventType = 'impression' | 'click' | 'checkout' | 'conversion';
export type PortalFunnelEventName =
  | 'track_select'
  | 'install_cta_click'
  | 'install_prompt_accepted'
  | 'offer_cta_click';
export type PortalAnalyticsArea =
  | 'home'
  | 'income'
  | 'languages'
  | 'ai'
  | 'music'
  | 'partners'
  | 'account'
  | 'other';

declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: unknown[];
    clarity?: (...args: unknown[]) => void;
  }
}

export function getPortalAnalyticsArea(pathname: string): PortalAnalyticsArea {
  if (!pathname || pathname === '/') return 'home';
  if (
    pathname.startsWith('/blog/aprender')
    || ['/guias/ingles', '/guias/italiano', '/guias/frances', '/guias/alemao', '/guias/espanhol', '/guias/chines']
      .some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  ) {
    return 'languages';
  }
  if (pathname === '/ia' || pathname.startsWith('/ia/')) return 'ai';
  if (
    pathname === '/programas'
    || pathname.startsWith('/programas/')
    || pathname === '/guias/renda-extra'
    || pathname.startsWith('/guias/renda-extra/')
    || pathname === '/quiz-negocios'
    || pathname === '/resultado'
    || pathname === '/blog/renda-extra'
  ) {
    return 'income';
  }
  if (pathname === '/mural-de-parceiros' || pathname.startsWith('/anuncie')) return 'partners';
  if (
    pathname.startsWith('/minha-conta')
    || pathname.startsWith('/perfil')
    || pathname.startsWith('/login')
    || pathname.startsWith('/registro')
    || pathname.startsWith('/app/')
  ) {
    return 'account';
  }
  if (
    pathname.startsWith('/musica')
    || pathname.startsWith('/catalogo')
    || pathname.startsWith('/luthiers')
    || pathname.startsWith('/professores')
    || pathname.startsWith('/comparar')
    || pathname.startsWith('/clinica')
    || pathname.startsWith('/fisica-do-som')
    || pathname.startsWith('/guia-de-cordas')
    || pathname.startsWith('/noticias')
    || pathname.startsWith('/lojas')
    || pathname.startsWith('/recomendados')
    || pathname.startsWith('/meu-setup')
    || pathname.startsWith('/contatos')
  ) {
    return 'music';
  }
  return 'other';
}

function hasAcceptedConsent(): boolean {
  return typeof window !== 'undefined' && window.localStorage.getItem(CONSENT_STORAGE_KEY) === 'accepted';
}

function emitVercelSafe(eventName: string, params: AnalyticsParams): void {
  try {
    trackVercelEvent(eventName, params);
  } catch {
    // Ignore client telemetry transport failures in restricted browsers or unit environments.
  }
}

export function trackClarityTag(key: string, value: string): void {
  if (!hasAcceptedConsent()) return;
  try {
    window.clarity?.('set', key, value);
  } catch {
    // Ignore Clarity runtime errors.
  }
}

export function trackClarityEvent(eventName: string): void {
  if (!hasAcceptedConsent()) return;
  try {
    window.clarity?.('event', eventName);
  } catch {
    // Ignore Clarity runtime errors.
  }
}

export function trackAnalyticsEvent(eventName: string, params: AnalyticsParams): void {
  if (!hasAcceptedConsent()) return;
  window.gtag?.('event', eventName, params);
}

/**
 * Emite os 4 marcos do funil principal (trilha -> instalacao -> oferta -> checkout)
 * apenas quando o usuario aceitou o consentimento LGPD de recursos nao essenciais.
 */
export function trackPortalFunnelEvent(
  eventName: PortalFunnelEventName,
  params: AnalyticsParams,
): void {
  if (!hasAcceptedConsent()) return;

  trackAnalyticsEvent(eventName, params);
  getPostHogClient()?.capture(eventName, params);
  emitVercelSafe(eventName, params);
}

export function trackPricingTierSelected(params: {
  funnel: string;
  tier: string;
  valueBrl: number;
  offerVariant?: string;
}): void {
  if (!hasAcceptedConsent()) return;
  const payload: AnalyticsParams = {
    funnel: params.funnel,
    tier: params.tier,
    value: params.valueBrl,
    currency: 'BRL',
    ...(params.offerVariant ? { offer_variant: params.offerVariant } : {}),
  };
  trackAnalyticsEvent('select_pricing_tier', payload);
  getPostHogClient()?.capture('select_pricing_tier', payload);
  emitVercelSafe('select_pricing_tier', payload);
  trackClarityTag('pricing_tier', `${params.funnel}:${params.tier}`);
}

export function trackBeginCheckout(params: {
  funnel: string;
  tier: string;
  valueBrl: number;
  offerVariant?: string;
  productSlug?: string;
}): void {
  if (!hasAcceptedConsent()) return;
  const payload: AnalyticsParams = {
    funnel: params.funnel,
    tier: params.tier,
    value: params.valueBrl,
    currency: 'BRL',
    ...(params.offerVariant ? { offer_variant: params.offerVariant } : {}),
    ...(params.productSlug ? { product_slug: params.productSlug } : {}),
  };
  trackAnalyticsEvent('begin_checkout', payload);
  getPostHogClient()?.capture('begin_checkout', payload);
  emitVercelSafe('begin_checkout', payload);
  trackClarityTag('checkout_tier', `${params.funnel}:${params.tier}`);
  trackClarityEvent('begin_checkout');
}

export function trackPurchaseCompleted(params: {
  transactionId: string;
  valueBrl: number;
  offerVariant?: string | null;
  tier?: string;
}): void {
  if (!hasAcceptedConsent()) return;
  const payload: AnalyticsParams = {
    transaction_id: params.transactionId,
    value: params.valueBrl,
    currency: 'BRL',
    ...(params.offerVariant ? { offer_variant: params.offerVariant } : {}),
    ...(params.tier ? { tier: params.tier } : {}),
  };
  trackAnalyticsEvent('purchase', payload);
  getPostHogClient()?.capture('purchase', payload);
  getPostHogClient()?.capture('guide_page_cta_conversion', payload);
  emitVercelSafe('purchase', payload);
  trackClarityEvent('purchase');
}

export function trackOfferFunnelEvent(offerVariant: string, eventType: OfferFunnelEventType): void {
  if (!hasAcceptedConsent()) return;
  const validatedOfferVariant = parseValidatedOfferVariant(offerVariant);
  const attribution = getOfferExperimentFromVariant(validatedOfferVariant);
  if (!attribution) return;

  const eventName = `${attribution.experiment.replaceAll('-', '_')}_${eventType}`;
  trackAnalyticsEvent(eventName, { variant: attribution.variant });
  getPostHogClient()?.capture(eventName, { variant: attribution.variant });

  void fetch('/api/sales/offer-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      experiment: attribution.experiment,
      variant: attribution.variant,
      eventType,
    }),
  }).catch((error: unknown) => {
    console.error('[OFFER_FUNNEL] Falha ao registrar evento:', error instanceof Error ? error.message : 'erro desconhecido');
  });
}
