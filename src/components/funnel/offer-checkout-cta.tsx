'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { trackPortalFunnelEvent } from '@/lib/analytics';

type OfferCheckoutCtaProps = {
  href: string;
  label: string;
  productSlug: string;
  trackId: string;
  placement: 'hero' | 'footer';
  className: string;
  testId?: string;
};

/** Botao cliente de ida ao checkout que registra telemetria `offer_cta_click` mantendo a pagina de oferta estatica (SSG). */
export function OfferCheckoutCta({
  href,
  label,
  productSlug,
  trackId,
  placement,
  className,
  testId,
}: OfferCheckoutCtaProps) {
  return (
    <Link
      href={href}
      data-testid={testId}
      className={className}
      onClick={() =>
        trackPortalFunnelEvent('offer_cta_click', {
          product_slug: productSlug,
          track_id: trackId,
          placement,
          source: 'offer_page',
        })
      }
    >
      <span>{label}</span>
      <ArrowRight size={17} aria-hidden="true" />
    </Link>
  );
}
