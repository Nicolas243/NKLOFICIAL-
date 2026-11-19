'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  getRifaCampaignSurface,
  isRifaCampaignRoute,
  reserveRifaCampaignSurface,
  type RifaCampaignSurface,
} from '@/lib/rifa-campaign';
import { RifaCampaignBanner } from './rifa-campaign-banner';
import { RifaCampaignExitPopup } from './rifa-campaign-exit-popup';

const RIFA_CAMPAIGN_DELAY_MS = 30_000;

export function RifaCampaignShell() {
  const pathname = usePathname();
  const [surface, setSurface] = useState<RifaCampaignSurface | null>(null);
  const [readyPathname, setReadyPathname] = useState<string | null>(null);
  const isEligibleRoute = isRifaCampaignRoute(pathname ?? '/');

  useEffect(() => {
    if (!isEligibleRoute) return;

    const timer = window.setTimeout(() => {
      const existingSurface = getRifaCampaignSurface();
      if (existingSurface) {
        setSurface(existingSurface);
        setReadyPathname(pathname);
        return;
      }

      const initialSurface: RifaCampaignSurface = pathname === '/programas' ? 'card' : 'banner';
      if (reserveRifaCampaignSurface(initialSurface)) {
        setSurface(initialSurface);
        setReadyPathname(pathname);
      }
    }, RIFA_CAMPAIGN_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [isEligibleRoute, pathname]);

  if (!isEligibleRoute || readyPathname !== pathname || !surface) return null;
  return (
    surface === 'card' ? null :
      surface === 'banner' ? <RifaCampaignBanner /> :
        <RifaCampaignExitPopup />
  );
}
