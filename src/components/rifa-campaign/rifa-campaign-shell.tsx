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
import { RifaCampaignCard } from './rifa-campaign-card';
import { RifaCampaignExitPopup } from './rifa-campaign-exit-popup';

export function RifaCampaignShell() {
  const pathname = usePathname();
  const [surface, setSurface] = useState<RifaCampaignSurface | null>(null);
  const isEligibleRoute = isRifaCampaignRoute(pathname ?? '/');

  useEffect(() => {
    if (!isEligibleRoute) return;
    const frame = requestAnimationFrame(() => {
      const existingSurface = getRifaCampaignSurface();
      if (existingSurface) {
        setSurface(existingSurface);
        return;
      }

      const initialSurface: RifaCampaignSurface = pathname === '/programas' ? 'card' : 'banner';
      if (reserveRifaCampaignSurface(initialSurface)) setSurface(initialSurface);
    });
    return () => cancelAnimationFrame(frame);
  }, [isEligibleRoute, pathname]);

  if (!isEligibleRoute || !surface) return null;
  return (
    surface === 'card' ? <RifaCampaignCard /> :
      surface === 'banner' ? <RifaCampaignBanner /> :
        <RifaCampaignExitPopup />
  );
}
