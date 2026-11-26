'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { trackOfferFunnelEvent } from '@/lib/analytics';

type AdaptiveCtaVariant = {
  id: '0' | '1' | '2';
  label: string;
};

type AdaptiveCtaLinkProps = {
  experiment: 'bussola-cta' | 'languages-hub-cta' | 'ia-offer-cta';
  href: string;
  variants: readonly [AdaptiveCtaVariant, AdaptiveCtaVariant, AdaptiveCtaVariant];
  className?: string;
};

export function AdaptiveCtaLink({
  experiment,
  href,
  variants,
  className = '',
}: AdaptiveCtaLinkProps) {
  const [selectedId, setSelectedId] = useState<'0' | '1' | '2'>('0');

  useEffect(() => {
    const storageKey = `nkl_adaptive_cta:${experiment}`;
    const impressionKey = `${storageKey}:impressed`;
    let active = true;

    async function resolveVariant() {
      let chosen: '0' | '1' | '2' = '0';
      try {
        const cached = window.sessionStorage.getItem(storageKey);
        if (cached === '0' || cached === '1' || cached === '2') {
          chosen = cached;
        } else {
          const response = await fetch(`/api/sales/offer-events?experiment=${encodeURIComponent(experiment)}`, {
            cache: 'no-store',
          });
          if (response.ok) {
            const payload = (await response.json()) as { variant?: string };
            if (payload.variant === '0' || payload.variant === '1' || payload.variant === '2') {
              chosen = payload.variant;
            }
          }
          window.sessionStorage.setItem(storageKey, chosen);
        }
      } catch {
        // Fallback to variant '0' safely.
      }

      if (!active) return;
      setSelectedId(chosen);

      try {
        if (!window.sessionStorage.getItem(impressionKey)) {
          window.sessionStorage.setItem(impressionKey, '1');
          trackOfferFunnelEvent(`${experiment}:${chosen}`, 'impression');
        }
      } catch {
        // Ignore sessionStorage restrictions.
      }
    }

    void resolveVariant();
    return () => {
      active = false;
    };
  }, [experiment]);

  const activeVariant = variants.find((item) => item.id === selectedId) ?? variants[0];

  return (
    <Link
      href={href}
      onClick={() => trackOfferFunnelEvent(`${experiment}:${activeVariant.id}`, 'click')}
      className={className}
    >
      {activeVariant.label}
    </Link>
  );
}
