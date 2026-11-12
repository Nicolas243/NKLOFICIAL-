'use client';

import { usePathname } from 'next/navigation';
import { isRifaCampaignRoute } from '@/lib/rifa-campaign';
import { RifaCampaignBanner } from './rifa-campaign-banner';
import { RifaCampaignCard } from './rifa-campaign-card';
import { RifaCampaignExitPopup } from './rifa-campaign-exit-popup';

export function RifaCampaignShell() {
  const pathname = usePathname();
  if (!isRifaCampaignRoute(pathname)) return null;
  return (
    <>
      <RifaCampaignCard />
      <RifaCampaignBanner />
      <RifaCampaignExitPopup />
    </>
  );
}
