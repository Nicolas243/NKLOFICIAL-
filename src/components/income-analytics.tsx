'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

const INCOME_ANALYTICS_ID = 'G-2RQX95N7TW';
const CONSENT_STORAGE_KEY = 'nkl_privacy_consent';
const CONSENT_EVENT = 'nkl:privacy-consent';

type Consent = 'accepted' | 'rejected';

export function IncomeAnalytics() {
  const [consent, setConsent] = useState<Consent | null>(null);

  useEffect(() => {
    function syncConsent(): void {
      const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
      setConsent(stored === 'accepted' || stored === 'rejected' ? stored : null);
    }

    syncConsent();
    window.addEventListener(CONSENT_EVENT, syncConsent);
    return () => window.removeEventListener(CONSENT_EVENT, syncConsent);
  }, []);

  if (consent !== 'accepted') return null;

  return (
    <>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${INCOME_ANALYTICS_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-income" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${INCOME_ANALYTICS_ID}');
        `}
      </Script>
    </>
  );
}
