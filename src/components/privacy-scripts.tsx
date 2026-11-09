'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Analytics } from '@vercel/analytics/next';
import { isIncomePortalPath } from '@/lib/income-portal';

export const CONSENT_STORAGE_KEY = 'nkl_privacy_consent';
export const CONSENT_EVENT = 'nkl:privacy-consent';
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
type Consent = 'accepted' | 'rejected';

type PostHogClient = typeof import('posthog-js').default;

let posthogClient: PostHogClient | null = null;
let posthogInitialized = false;

export function getPostHogClient(): PostHogClient | null {
  return posthogClient;
}

function ConsentAnalytics({ consent, isIncomePortal }: { consent: Consent | null; isIncomePortal: boolean }) {
  useEffect(() => {
    if (consent !== 'accepted') {
      if (posthogClient) {
        posthogClient.opt_out_capturing();
        posthogClient.reset();
        posthogClient = null;
        posthogInitialized = false;
      }
      return;
    }

    if (!POSTHOG_KEY) return;

    let cancelled = false;
    void import('posthog-js')
      .then(({ default: posthog }) => {
        if (cancelled) return;

        if (!posthogInitialized) {
          posthog.init(POSTHOG_KEY, {
            api_host: POSTHOG_HOST,
            capture_pageview: true,
            capture_pageleave: true,
            persistence: 'localStorage',
            respect_dnt: true,
          });
          posthogInitialized = true;
        }

        posthogClient = posthog;
        posthog.register({ portal_area: isIncomePortal ? 'income' : 'music' });
      })
      .catch((error: unknown) => {
        console.error('Não foi possível inicializar o PostHog.', error);
      });

    return () => {
      cancelled = true;
    };
  }, [consent, isIncomePortal]);

  if (consent !== 'accepted') return null;

  return (
    <>
      <Analytics />
      {CLARITY_PROJECT_ID && (
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", ${JSON.stringify(CLARITY_PROJECT_ID)});
          `}
        </Script>
      )}
    </>
  );
}

export function PrivacyScripts() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent | null>(null);
  const isIncomePortal = isIncomePortalPath(pathname);

  useEffect(() => {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored === 'accepted' || stored === 'rejected') {
      const frame = window.requestAnimationFrame(() => setConsent(stored));
      return () => window.cancelAnimationFrame(frame);
    }
  }, []);

  function saveConsent(value: Consent) {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
    setConsent(value);
    window.dispatchEvent(new Event(CONSENT_EVENT));
  }

  return (
    <>
      <ConsentAnalytics consent={consent} isIncomePortal={isIncomePortal} />
      {consent === 'accepted' && (
        <>
          <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8249438839607534"
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
          <Script
            async
            src="https://www.googletagmanager.com/gtag/js?id=G-QD0HQJFWVW"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-QD0HQJFWVW');
            `}
          </Script>
        </>
      )}

      {consent === null && (
        <aside
          className="fixed inset-x-3 bottom-3 z-[100000] mx-auto max-w-2xl rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur-md"
          aria-label="Preferências de privacidade"
        >
          <p className="text-sm leading-relaxed">
            Usamos recursos necessários para o funcionamento do site. Com sua autorização,
            também ativamos Google Analytics, Microsoft Clarity, PostHog, Vercel Analytics e anúncios
            para medir audiência, melhorar a experiência e manter o Portal NKL.
            Saiba mais na <Link href="/privacidade" className="font-bold text-neon hover:underline">Política de Privacidade</Link>.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => saveConsent('accepted')} className="rounded-lg bg-neon px-4 py-2 text-sm font-bold text-background">
              Aceitar não essenciais
            </button>
            <button type="button" onClick={() => saveConsent('rejected')} className="rounded-lg border border-border px-4 py-2 text-sm font-bold hover:bg-surface">
              Recusar não essenciais
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
