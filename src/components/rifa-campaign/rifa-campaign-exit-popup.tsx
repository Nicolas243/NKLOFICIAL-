'use client';

import { useEffect, useState } from 'react';
import { RIFA_CAMPAIGN_COPY, trackRifaCampaignEvent } from '@/lib/rifa-campaign';
import { RifaCampaignLink } from './rifa-campaign-link';

const SHOWN_KEY = 'nkl_rifa_campaign_exit_shown';

export function RifaCampaignExitPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SHOWN_KEY) || sessionStorage.getItem('nkl_rifa_campaign_interacted')) return;
    const handleMouseLeave = (event: MouseEvent): void => {
      if (event.clientY > 0) return;
      sessionStorage.setItem(SHOWN_KEY, 'true');
      setOpen(true);
      void trackRifaCampaignEvent({ surface: 'exit_popup', action: 'impression' });
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, []);

  if (!open) return null;
  const close = (): void => {
    void trackRifaCampaignEvent({ surface: 'exit_popup', action: 'dismiss' });
    setOpen(false);
  };
  return (
    <div className="fixed inset-0 z-[260] flex items-end justify-center bg-slate-950/55 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="rifa-exit-title">
      <section className="relative w-full max-w-lg rounded-2xl border border-orange-500/30 bg-income-surface p-6 shadow-2xl">
        <button type="button" onClick={close} className="absolute right-4 top-3 text-2xl opacity-60 hover:opacity-100" aria-label="Fechar ação de apoio">×</button>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-500">Uma forma de apoiar o Portal</p>
        <h2 id="rifa-exit-title" className="mt-2 pr-7 font-playfair text-3xl font-bold">{RIFA_CAMPAIGN_COPY.exitPopup.title}</h2>
        <p className="mt-3 leading-relaxed text-foreground/75">{RIFA_CAMPAIGN_COPY.exitPopup.description}</p>
        <p className="mt-3 text-xs text-foreground/55">{RIFA_CAMPAIGN_COPY.disclosure}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <RifaCampaignLink surface="exit_popup" action="participate" className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">Participar por R$ 3</RifaCampaignLink>
          <RifaCampaignLink surface="exit_popup" action="rules" className="rounded-lg border border-border px-4 py-2 text-sm font-bold">Ver prêmios e regras</RifaCampaignLink>
        </div>
      </section>
    </div>
  );
}
