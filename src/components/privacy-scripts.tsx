'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const CONSENT_STORAGE_KEY = 'nkl_privacy_consent';
export const CONSENT_EVENT = 'nkl:privacy-consent';
type Consent = 'accepted' | 'rejected';

export function PrivacyScripts() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent | null>(null);
  const isIncomePortal = pathname === '/programas'
    || pathname.startsWith('/programas/')
    || pathname === '/blog/renda-extra'
    || pathname.startsWith('/blog/renda-extra/')
    || pathname === '/guias/renda-extra'
    || pathname.startsWith('/guias/renda-extra/');

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
      {consent === 'accepted' && (
        <>
          <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8249438839607534"
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
          {!isIncomePortal && (
            <>
              <Script
                async
                src="https://www.googletagmanager.com/gtag/js?id=G-QD0HQJFWVW"
                strategy="afterInteractive"
              />
              <Script id="google-analytics-music" strategy="afterInteractive">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){window.dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', 'G-QD0HQJFWVW');
                `}
              </Script>
            </>
          )}
        </>
      )}

      {consent === null && (
        <aside
          className="fixed inset-x-3 bottom-3 z-[100000] mx-auto max-w-2xl rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur-md"
          aria-label="Preferências de privacidade"
        >
          <p className="text-sm leading-relaxed">
            Usamos recursos necessários para o funcionamento do site. Com sua autorização,
            também ativamos Google Analytics e anúncios para medir audiência e manter o Portal NKL.
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
