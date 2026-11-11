'use client';

import { useEffect, useMemo, useState } from 'react';
import { DiscountSimulator } from '@/components/sales/discount-simulator';
import { GuideSubscriptionButton } from '@/components/sales/guide-subscription-button';
import { trackOfferFunnelEvent } from '@/lib/analytics';
import {
  GUIDE_PAGE_CTA_VARIANTS,
  type GuidePageCtaVariant,
} from '@/lib/guide-offer';
import type { GuideResumeIntent } from '@/lib/auth/return-intent';

const STORAGE_KEY = 'nkl_guide_page_cta_variant_v1';
const IMPRESSION_KEY_PREFIX = `${STORAGE_KEY}:impression:`;

type GuidePageOfferProps = {
  initialVariant: GuidePageCtaVariant | null;
  purchaseOfferVariant?: string;
  subscriptionOfferVariant?: string;
  resumeIntent?: GuideResumeIntent | null;
};

function randomVariant(): GuidePageCtaVariant {
  const index = Math.floor(Math.random() * GUIDE_PAGE_CTA_VARIANTS.length);
  return GUIDE_PAGE_CTA_VARIANTS[index]?.id ?? '0';
}

function readStoredVariant(): GuidePageCtaVariant | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return GUIDE_PAGE_CTA_VARIANTS.some((variant) => variant.id === stored)
      ? stored as GuidePageCtaVariant
      : null;
  } catch {
    return null;
  }
}

function persistVariant(variant: GuidePageCtaVariant): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, variant);
  } catch (error) {
    console.error('[GUIDE_PAGE_CTA] Falha ao persistir variante:', error instanceof Error ? error.message : 'erro desconhecido');
  }
}

export function GuidePageOffer({
  initialVariant,
  purchaseOfferVariant = 'sales-page',
  subscriptionOfferVariant = 'sales-page:subscription',
  resumeIntent = null,
}: GuidePageOfferProps) {
  const [variantId, setVariantId] = useState<GuidePageCtaVariant | null>(initialVariant);
  const variant = useMemo(
    () => GUIDE_PAGE_CTA_VARIANTS.find((item) => item.id === variantId) ?? null,
    [variantId],
  );

  useEffect(() => {
    if (initialVariant !== null) {
      persistVariant(initialVariant);
      return;
    }

    const storedVariant = readStoredVariant();
    if (storedVariant !== null) {
      const frame = window.requestAnimationFrame(() => setVariantId(storedVariant));
      return () => window.cancelAnimationFrame(frame);
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);

    async function selectVariant(): Promise<void> {
      try {
        const response = await fetch('/api/sales/offer-events?experiment=guide-page-cta', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Resposta ${response.status}`);
        const payload: { variant?: string } = await response.json();
        const selected = GUIDE_PAGE_CTA_VARIANTS.find((item) => item.id === payload.variant)?.id;
        if (!selected) throw new Error('Variante inválida.');
        persistVariant(selected);
        if (!cancelled) setVariantId(selected);
      } catch (error) {
        if (controller.signal.aborted || cancelled) return;
        console.error('[GUIDE_PAGE_CTA] Falha ao escolher variante:', error instanceof Error ? error.message : 'erro desconhecido');
        const fallback = randomVariant();
        persistVariant(fallback);
        if (!cancelled) setVariantId(fallback);
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void selectVariant();
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [initialVariant]);

  useEffect(() => {
    if (variantId === null) return;
    try {
      const impressionKey = `${IMPRESSION_KEY_PREFIX}${variantId}`;
      if (window.localStorage.getItem(impressionKey) === '1') return;
      window.localStorage.setItem(impressionKey, '1');
    } catch {
      return;
    }
    trackOfferFunnelEvent(`guide-page-cta:${variantId}`, 'impression');
  }, [variantId]);

  if (variant === null) {
    return (
      <aside className="md:sticky md:top-20" aria-live="polite">
        <div className="rounded-2xl border border-orange/25 bg-income-surface p-6 shadow-sm md:p-8">
          <p className="text-sm text-foreground/70">Preparando os detalhes do pacote de novembro...</p>
        </div>
      </aside>
    );
  }

  const offerVariant = `guide-page-cta:${variant.id}`;
  const purchaseVariant = variantId === null ? purchaseOfferVariant : offerVariant;
  const subscriptionVariant = variantId === null ? subscriptionOfferVariant : offerVariant;

  return (
    <aside className="md:sticky md:top-20">
      <DiscountSimulator
        offerVariant={purchaseVariant}
        ctaLabel={variant.ctaLabel}
        title={variant.title}
        summary={variant.summary}
        resumeIntent={resumeIntent}
      />
      <div className="mt-5 rounded-2xl border border-border bg-income-surface p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500 dark:text-orange-400">Alternativa mensal</p>
        <h2 className="mt-2 font-playfair text-2xl font-bold">Guias para Liberdade Financeira</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/70">Receba o pacote atual e novos PDFs e guias a partir de 15 de dezembro, conforme a programação editorial.</p>
        <p className="mt-4 font-playfair text-3xl font-bold text-orange-500">R$ 19/mês</p>
        <div className="mt-4">
          <GuideSubscriptionButton
            offerVariant={subscriptionVariant}
            resumeIntent={resumeIntent}
          />
        </div>
      </div>
      <p className="mt-4 text-center text-xs leading-relaxed text-foreground/55">O pagamento é processado pelo Stripe e o acesso é liberado após a confirmação.</p>
    </aside>
  );
}
