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

declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: unknown[];
  }
}

export function trackAnalyticsEvent(eventName: string, params: AnalyticsParams): void {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(CONSENT_STORAGE_KEY) !== 'accepted') return;
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
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(CONSENT_STORAGE_KEY) !== 'accepted') return;

  trackAnalyticsEvent(eventName, params);
  getPostHogClient()?.capture(eventName, params);

  try {
    trackVercelEvent(eventName, params);
  } catch {
    // Ignore client telemetry transport failures in restricted browsers or unit environments.
  }
}

export function trackOfferFunnelEvent(offerVariant: string, eventType: OfferFunnelEventType): void {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(CONSENT_STORAGE_KEY) !== 'accepted') return;
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
