'use client';

import { useEffect } from 'react';
import { CONSENT_STORAGE_KEY } from '@/components/privacy-scripts';
import { trackPurchaseCompleted } from '@/lib/analytics';
import { extractOfferTier } from '@/lib/guide-offer';

type GuidePurchaseAnalyticsProps = {
  transactionId: string;
  value: number;
  offerVariant?: string | null;
};

export function GuidePurchaseAnalytics({
  transactionId,
  value,
  offerVariant = null,
}: GuidePurchaseAnalyticsProps) {
  useEffect(() => {
    if (window.localStorage.getItem(CONSENT_STORAGE_KEY) !== 'accepted') return;
    const storageKey = `nkl_guide_purchase_tracked:${transactionId}`;
    if (window.localStorage.getItem(storageKey) === '1') return;
    window.localStorage.setItem(storageKey, '1');

    trackPurchaseCompleted({
      transactionId,
      valueBrl: value,
      offerVariant,
      tier: extractOfferTier(offerVariant),
    });
  }, [offerVariant, transactionId, value]);

  return null;
}
