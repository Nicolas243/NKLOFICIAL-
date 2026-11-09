'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { trackOfferFunnelEvent } from '@/lib/analytics';

type CompactSecondaryOfferProps = {
  variant: string;
  programSlug: string;
  currentPage: number;
};

const secondaryStrategies = [
  {
    title: 'Melhor renda extra é saber economizar',
    description: 'Compare custos, tempo e critérios antes de escolher uma plataforma e evite desperdiçar energia.',
    cta: 'Quero começar com clareza',
  },
  {
    title: 'Ganhe tempo escolhendo melhor',
    description: 'Use um mapa prático para separar oportunidades compatíveis com sua rotina das que só parecem promissoras.',
    cta: 'Ver o mapa prático',
  },
  {
    title: 'Comece com um plano claro',
    description: 'Siga um roteiro de primeiros passos, aprovação e organização para sair da pesquisa e agir.',
    cta: 'Montar meu próximo passo',
  },
] as const;

export function CompactSecondaryOffer({ variant, programSlug, currentPage }: CompactSecondaryOfferProps) {
  const adIndex = Math.min(Math.max(Number(variant), 0), secondaryStrategies.length - 1);
  const strategy = secondaryStrategies[adIndex];
  const offerVariant = `program-secondary-cta:${adIndex}`;
  const href = `/guias/renda-extra?cta_variant=${adIndex}`;
  const hasTrackedImpression = useRef(false);

  useEffect(() => {
    if (hasTrackedImpression.current) return;

    try {
      const storageKey = `nkl_offer_impression:program-secondary-cta:${programSlug}`;
      if (window.sessionStorage.getItem(storageKey)) {
        hasTrackedImpression.current = true;
        return;
      }
      window.sessionStorage.setItem(storageKey, 'true');
    } catch (error) {
      console.error('[COMPACT_SECONDARY_OFFER] Não foi possível deduplicar impressão:', error instanceof Error ? error.message : 'armazenamento indisponível');
    }

    hasTrackedImpression.current = true;
    trackOfferFunnelEvent(offerVariant, 'impression');
  }, [offerVariant, programSlug]);

  return (
    <article
      data-testid="compact-secondary-offer"
      data-current-page={currentPage}
      aria-label="Recomendação editorial"
      className="rounded-xl border border-neon/35 bg-neon/5 p-4 shadow-sm transition hover:border-neon/60 md:p-5"
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon">Recomendação editorial</p>
      <h2 className="mt-2 font-playfair text-xl font-bold">{strategy.title}</h2>
      <p className="mt-2 text-sm leading-relaxed opacity-75">{strategy.description}</p>
      <Link
        href={href}
        onClick={() => trackOfferFunnelEvent(offerVariant, 'click')}
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-neon px-4 py-2 text-sm font-bold text-black hover:opacity-90"
      >
        {strategy.cta}
      </Link>
    </article>
  );
}
