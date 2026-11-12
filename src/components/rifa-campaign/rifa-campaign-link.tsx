'use client';

import type { ReactNode } from 'react';
import {
  getRifaCampaignUrl,
  trackRifaCampaignEvent,
  type RifaCampaignAction,
  type RifaCampaignSurface,
} from '@/lib/rifa-campaign';

type RifaCampaignLinkProps = {
  surface: RifaCampaignSurface;
  action: Extract<RifaCampaignAction, 'participate' | 'rules'>;
  children: ReactNode;
  className?: string;
};

export function RifaCampaignLink({ surface, action, children, className }: RifaCampaignLinkProps) {
  return (
    <a
      href={getRifaCampaignUrl(surface)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        void trackRifaCampaignEvent({ surface, action });
        try {
          sessionStorage.setItem('nkl_rifa_campaign_interacted', 'true');
        } catch (error) {
          console.info('[RIFA_CAMPAIGN] Storage indisponível:', error instanceof Error ? error.message : 'erro desconhecido');
        }
      }}
    >
      {children}
    </a>
  );
}
