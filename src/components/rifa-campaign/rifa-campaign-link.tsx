'use client';

import type { ReactNode } from 'react';
import {
  getRifaCampaignUrl,
  markRifaCampaignInteracted,
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
        markRifaCampaignInteracted();
      }}
    >
      {children}
    </a>
  );
}
