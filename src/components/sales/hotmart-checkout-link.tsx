import { trackOfferFunnelEvent } from '@/lib/analytics';
import {
  getOfferExperimentFromVariant,
  parseValidatedOfferVariant,
  PROGRAM_SECONDARY_CTA_EXPERIMENT,
  GUIDE_PAGE_CTA_EXPERIMENT,
} from '@/lib/offer-experiment';

type HotmartCheckoutLinkProps = {
  href?: string;
  label: string;
  offerVariant?: string;
};

function withValidatedAttribution(href: string, offerVariant: string | undefined): string {
  const validatedVariant = parseValidatedOfferVariant(offerVariant);
  const attribution = getOfferExperimentFromVariant(validatedVariant);
  if (
    !validatedVariant
    || (attribution?.experiment !== PROGRAM_SECONDARY_CTA_EXPERIMENT && attribution?.experiment !== GUIDE_PAGE_CTA_EXPERIMENT)
  ) return href;

  try {
    const url = new URL(href);
    url.searchParams.set('sck', validatedVariant);
    return url.toString();
  } catch {
    return href;
  }
}

export function HotmartCheckoutLink({ href, label, offerVariant }: HotmartCheckoutLinkProps) {
  if (!href) return null;

  return (
    <a
      href={withValidatedAttribution(href, offerVariant)}
      onClick={() => trackOfferFunnelEvent(offerVariant ?? 'sales-page', 'checkout')}
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-foreground/25 px-4 py-2 text-sm font-bold text-foreground transition hover:border-foreground/50 hover:bg-foreground/5"
    >
      {label}
    </a>
  );
}
