'use client';

import { useEffect, useMemo, useState } from 'react';
import { DecoyPricingGrid, type DecoyTierOption } from '@/components/sales/decoy-pricing-grid';
import { DiscountSimulator } from '@/components/sales/discount-simulator';
import { GuideSubscriptionButton } from '@/components/sales/guide-subscription-button';
import { trackOfferFunnelEvent } from '@/lib/analytics';
import {
  GUIDE_PAGE_CTA_VARIANTS,
  GUIDE_TITLE,
  type GuidePageCtaVariant,
  type OfferTier,
} from '@/lib/guide-offer';
import type { GuideResumeIntent } from '@/lib/auth/return-intent';

const INCOME_DECOY_OPTIONS: readonly DecoyTierOption<OfferTier>[] = [
  {
    id: 'essential',
    badge: 'Entrada enxuta',
    name: 'Só o Guia Principal',
    priceLabel: 'R$ 19',
    priceSuffix: 'pagamento único',
    subtitle: 'Apenas a leitura essencial do Guia 2027, sem planilhas ou cadernos complementares.',
    valueBrl: 19,
    ctaLabel: 'Escolher Guia Essencial (R$ 19)',
    features: [
      { label: 'Guia Essencial Renda Extra 2027 (PDF com CPF)', included: true },
      { label: 'O Código de Novembro & Dinheiro Para Ontem', included: false },
      { label: 'Escudo de Black Friday + Planilhas Raio-X (PC e Mobile)', included: false },
      { label: '6 E-books completos de Idiomas NKL', included: false },
    ],
  },
  {
    id: 'complete',
    badge: 'Mais escolhido',
    name: 'Pacote Completo Renda Extra',
    priceLabel: 'R$ 39',
    compareAtLabel: 'R$ 97',
    priceSuffix: 'pagamento único',
    subtitle: 'Todos os 5 entregáveis práticos e planilhas do pacote pelo melhor custo-benefício.',
    recommended: true,
    valueBrl: 39,
    ctaLabel: 'Escolher Pacote Completo (R$ 39)',
    features: [
      { label: 'Guia Essencial Renda Extra 2027 (PDF com CPF)', included: true },
      { label: 'O Código de Novembro & Dinheiro Para Ontem', included: true },
      { label: 'Escudo de Black Friday + Planilhas Raio-X (PC e Mobile)', included: true },
      { label: '6 E-books completos de Idiomas NKL', included: false },
    ],
  },
  {
    id: 'vip',
    badge: 'Acervo completo',
    name: 'Acervo Total NKL (11 Materiais)',
    priceLabel: 'R$ 247',
    compareAtLabel: 'R$ 379',
    priceSuffix: 'pagamento único',
    subtitle: 'Os 5 arquivos de Renda Extra + todos os 6 E-books de idiomas liberados imediatamente.',
    valueBrl: 247,
    ctaLabel: 'Escolher Acervo Total (R$ 247)',
    features: [
      { label: 'Guia Essencial Renda Extra 2027 (PDF com CPF)', included: true },
      { label: 'O Código de Novembro & Dinheiro Para Ontem', included: true },
      { label: 'Escudo de Black Friday + Planilhas Raio-X (PC e Mobile)', included: true },
      { label: '6 E-books completos de Idiomas NKL (Inglês a Mandarim)', included: true },
    ],
  },
];

const STORAGE_KEY = 'nkl_guide_page_cta_variant_v1';
const IMPRESSION_KEY_PREFIX = `${STORAGE_KEY}:impression:`;

type GuidePageOfferProps = {
  id?: string;
  initialVariant: GuidePageCtaVariant | null;
  purchaseOfferVariant?: string;
  subscriptionOfferVariant?: string;
  resumeIntent?: GuideResumeIntent | null;
  forceFallback?: boolean;
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
  id,
  initialVariant,
  purchaseOfferVariant = 'sales-page',
  subscriptionOfferVariant = 'sales-page:subscription',
  resumeIntent = null,
  forceFallback = false,
}: GuidePageOfferProps) {
  const [variantId, setVariantId] = useState<GuidePageCtaVariant | null>(initialVariant);
  const [selectedTier, setSelectedTier] = useState<OfferTier>('complete');
  const variant = useMemo(
    () => GUIDE_PAGE_CTA_VARIANTS.find((item) => item.id === variantId) ?? (
      forceFallback
        ? {
            title: GUIDE_TITLE,
            summary: 'Um pacote organizado para estudar oportunidades de renda extra com mais clareza, sem promessa de resultado.',
            ctaLabel: 'Quero liberar meu acesso',
          }
        : null
    ),
    [forceFallback, variantId],
  );

  useEffect(() => {
    if (initialVariant !== null) {
      persistVariant(initialVariant);
      return;
    }
    if (forceFallback) return;

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
  }, [forceFallback, initialVariant]);

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

  const offerVariant = variantId === null ? purchaseOfferVariant : `guide-page-cta:${variantId}`;
  const purchaseVariant = variantId === null ? purchaseOfferVariant : offerVariant;
  const subscriptionVariant = variantId === null ? subscriptionOfferVariant : offerVariant;
  const activeOption = INCOME_DECOY_OPTIONS.find((option) => option.id === selectedTier) ?? INCOME_DECOY_OPTIONS[1]!;

  return (
    <div id={id} className="scroll-mt-24 space-y-6">
      <DecoyPricingGrid
        funnel="renda-extra-guide"
        heading="Escolha o nível do seu pacote"
        subheading="Compare as 3 opções abaixo. O pacote intermediário reúne os 5 arquivos principais por R$ 39."
        options={INCOME_DECOY_OPTIONS}
        selectedTier={selectedTier}
        onSelectTier={setSelectedTier}
        offerVariant={purchaseVariant}
      />

      <div className="grid gap-6 md:grid-cols-2 md:items-start">
        <DiscountSimulator
          offerVariant={purchaseVariant}
          tier={selectedTier}
          ctaLabel={selectedTier === 'complete' ? variant.ctaLabel : activeOption.ctaLabel}
          title={selectedTier === 'complete' ? variant.title : activeOption.name}
          summary={selectedTier === 'complete' ? variant.summary : activeOption.subtitle}
          resumeIntent={resumeIntent}
        />
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-income-surface p-5 md:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500 dark:text-orange-400">Alternativa mensal</p>
            <h2 className="mt-2 font-playfair text-2xl font-bold">Guias para Liberdade Financeira</h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">Receba o pacote atual e novos PDFs e guias mensais enquanto sua assinatura estiver ativa.</p>
            <p className="mt-4 font-playfair text-3xl font-bold text-orange-500">R$ 19/mês</p>
            <div className="mt-4">
              <GuideSubscriptionButton
                offerVariant={subscriptionVariant}
                resumeIntent={resumeIntent}
              />
            </div>
          </div>
          <p className="text-center text-xs leading-relaxed text-foreground/55">O pagamento é processado pelo Stripe e o acesso é liberado após a confirmação.</p>
        </div>
      </div>
    </div>
  );
}
