import { getPostHogClient } from '@/components/privacy-scripts';
import { getOfferExperimentFromVariant, parseProgramSecondaryCtaVariant } from '@/lib/offer-experiment';

type AnalyticsParams = Record<string, string | number | boolean>;

type Gtag = (command: 'event', eventName: string, params?: AnalyticsParams) => void;
export type OfferFunnelEventType = 'impression' | 'click' | 'checkout' | 'conversion';

declare global {
  interface Window {
    gtag?: Gtag;
  }
}

export function trackAnalyticsEvent(eventName: string, params: AnalyticsParams): void {
  if (typeof window === 'undefined') return;
  window.gtag?.('event', eventName, params);
}

export function trackOfferFunnelEvent(offerVariant: string, eventType: OfferFunnelEventType): void {
  if (typeof window === 'undefined') return;
  const attribution = getOfferExperimentFromVariant(offerVariant);
  const variant = attribution?.experiment === 'program-secondary-cta'
    ? parseProgramSecondaryCtaVariant(attribution.variant)
    : null;
  if (variant === null) return;

  const eventName = `program_secondary_cta_${eventType}`;
  trackAnalyticsEvent(eventName, { variant });
  getPostHogClient()?.capture(eventName, { variant });

  void fetch('/api/sales/offer-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      experiment: 'program-secondary-cta',
      variant,
      eventType,
    }),
  }).catch((error: unknown) => {
    console.error('[PROGRAM_SECONDARY_CTA] Falha ao registrar evento:', error instanceof Error ? error.message : 'erro desconhecido');
  });
}
