'use client';

import { HelpCircle, Palette, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isIncomePortalPath } from '@/lib/income-portal';

const THEME_HINT_DELAY_MS = 14000;
const OPEN_ONBOARDING_EVENT = 'nkl:open-onboarding';

export function SiteGuidance() {
  const pathname = usePathname();
  const isPartnerPortal = isIncomePortalPath(pathname);
  const appLabel = isPartnerPortal ? 'Renda Extra' : 'NKL Música';
  const [themeHintOpen, setThemeHintOpen] = useState(false);

  useEffect(() => {
    if (isPartnerPortal) return;
    if (window.localStorage.getItem('nkl-theme-hint-seen')) return;
    const themeTimer = window.setTimeout(() => setThemeHintOpen(true), THEME_HINT_DELAY_MS);
    return () => window.clearTimeout(themeTimer);
  }, [isPartnerPortal]);

  function closeThemeHint(): void {
    window.localStorage.setItem('nkl-theme-hint-seen', 'true');
    setThemeHintOpen(false);
  }

  function openTutorial(): void {
    document.dispatchEvent(new Event(OPEN_ONBOARDING_EVENT));
  }

  return (
    <>
      <button
        type="button"
        onClick={openTutorial}
        className="fixed bottom-5 left-5 z-[180] inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface/95 px-4 py-3 text-sm font-bold text-foreground shadow-[0_8px_24px_rgba(16,24,40,0.16)] backdrop-blur transition hover:border-orange hover:text-orange max-[640px]:bottom-4 max-[640px]:left-4"
        aria-label={`Abrir guia do ${appLabel}`}
      >
        <HelpCircle size={18} aria-hidden="true" />
        <span className="inline">Guia rápido</span>
      </button>

      {themeHintOpen && (
        <div className="fixed right-4 top-20 z-[180] flex max-w-[min(22rem,calc(100vw-2rem))] items-start gap-3 rounded-xl border border-orange/40 bg-surface p-4 text-sm text-foreground shadow-[0_12px_30px_rgba(16,24,40,0.16)]">
          <Palette className="mt-0.5 shrink-0 text-orange" size={19} aria-hidden="true" />
          <p className="flex-1 leading-relaxed">Você pode mudar o tema pelo botão de sol e lua no cabeçalho.</p>
          <button type="button" onClick={closeThemeHint} className="rounded-md p-1 text-foreground/60 hover:text-foreground" aria-label="Fechar dica de tema">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  );
}
