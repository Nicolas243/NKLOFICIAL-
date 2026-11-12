'use client';

import { useEffect, useState } from 'react';
import {
  getDismissalExpiry,
  markRifaCampaignInteracted,
  RIFA_CAMPAIGN_COPY,
  trackRifaCampaignEvent,
} from '@/lib/rifa-campaign';
import { RifaCampaignLink } from './rifa-campaign-link';

const DISMISSED_UNTIL_KEY = 'nkl_rifa_campaign_dismissed_until';

export function RifaCampaignBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        if (Number(localStorage.getItem(DISMISSED_UNTIL_KEY) ?? 0) <= Date.now()) setVisible(true);
      } catch (error) {
        console.info('[RIFA_CAMPAIGN] LocalStorage indisponível:', error instanceof Error ? error.message : 'erro desconhecido');
        setVisible(true);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (visible) void trackRifaCampaignEvent({ surface: 'banner', action: 'impression' });
  }, [visible]);

  if (!visible) return null;

  function dismiss(): void {
    localStorage.setItem(DISMISSED_UNTIL_KEY, String(getDismissalExpiry(Date.now())));
    markRifaCampaignInteracted();
    void trackRifaCampaignEvent({ surface: 'banner', action: 'dismiss' });
    setVisible(false);
  }

  return (
    <aside className="fixed inset-x-3 bottom-3 z-[180] mx-auto max-w-3xl rounded-2xl border border-orange-500/30 bg-income-surface/95 p-4 shadow-xl backdrop-blur-md sm:inset-x-auto sm:right-6 sm:w-[min(42rem,calc(100vw-3rem))]" aria-label="Ação de apoio ao Portal NKL">
      <button type="button" onClick={dismiss} aria-label="Fechar aviso da ação" className="absolute right-3 top-2 text-xl opacity-60 hover:opacity-100">×</button>
      <p className="pr-6 text-xs font-bold uppercase tracking-[0.16em] text-orange-500">Apoie a curadoria do Portal NKL</p>
      <h2 className="mt-1 pr-6 font-playfair text-xl font-bold">{RIFA_CAMPAIGN_COPY.banner.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-foreground/75">{RIFA_CAMPAIGN_COPY.banner.description}</p>
      <p className="mt-2 text-xs text-foreground/55">{RIFA_CAMPAIGN_COPY.disclosure}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <RifaCampaignLink surface="banner" action="participate" className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">Participar</RifaCampaignLink>
        <RifaCampaignLink surface="banner" action="rules" className="rounded-lg border border-border px-4 py-2 text-sm font-bold hover:border-orange-500">Ver prêmios e regras</RifaCampaignLink>
      </div>
    </aside>
  );
}
