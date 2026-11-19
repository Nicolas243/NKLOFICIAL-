'use client';

import { useEffect } from 'react';
import { CONSENT_STORAGE_KEY, getPostHogClient } from '@/components/privacy-scripts';

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

    const params = {
      transaction_id: transactionId,
      value,
      currency: 'BRL',
      ...(offerVariant ? { offer_variant: offerVariant } : {}),
    };
    window.gtag?.('event', 'purchase', params);
    getPostHogClient()?.capture('guide_page_cta_conversion', params);
  }, [offerVariant, transactionId, value]);

  return null;
}
