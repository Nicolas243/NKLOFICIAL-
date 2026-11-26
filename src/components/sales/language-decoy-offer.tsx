'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DecoyPricingGrid, type DecoyTierOption } from '@/components/sales/decoy-pricing-grid';
import { GuideCheckoutButton } from '@/components/sales/guide-checkout-button';
import { withOfferTier, type OfferTier } from '@/lib/guide-offer';

type LanguageDecoyOfferProps = {
  language: string;
  slug: string;
  offerVariant: string;
  previewHref: string;
  previewLabel: string;
};

export function LanguageDecoyOffer({
  language,
  slug,
  offerVariant,
  previewHref,
  previewLabel,
}: LanguageDecoyOfferProps) {
  const [selectedTier, setSelectedTier] = useState<OfferTier>('complete');

  const options = useMemo<readonly DecoyTierOption<OfferTier>[]>(
    () => [
      {
        id: 'essential',
        badge: 'Entrada enxuta',
        name: `Só o E-book de ${language}`,
        priceLabel: 'R$ 27',
        priceSuffix: 'pagamento único',
        subtitle: 'Apenas o PDF digital de 100 lições para ler no celular, sem trilha de IA ou combos extras.',
        valueBrl: 27,
        ctaLabel: 'Escolher Só o E-book (R$ 27)',
        features: [
          { label: `E-book ${language} (100 lições e 500 exemplos coloridos)`, included: true },
          { label: 'Guia de IA por 4 faixas etárias + Planner de 90 dias', included: false },
          { label: 'Desconto progressivo automático (30% 2º / 50% 3º+ idioma)', included: false },
          { label: 'Todos os 6 E-books de idiomas + Guia Renda Extra 2027', included: false },
        ],
      },
      {
        id: 'complete',
        badge: 'Mais escolhido',
        name: `Pacote ${language} + IA & Planner`,
        priceLabel: 'R$ 47',
        compareAtLabel: 'R$ 87',
        priceSuffix: 'pagamento único',
        subtitle: 'A experiência completa deste idioma com método de IA por idade, planner e bônus fidelidade.',
        recommended: true,
        valueBrl: 47,
        ctaLabel: `Escolher Pacote ${language} Completo (R$ 47)`,
        features: [
          { label: `E-book ${language} (100 lições e 500 exemplos coloridos)`, included: true },
          { label: 'Guia de IA por 4 faixas etárias + Planner de 90 dias', included: true },
          { label: 'Desconto progressivo automático (30% 2º / 50% 3º+ idioma)', included: true },
          { label: 'Todos os 6 E-books de idiomas + Guia Renda Extra 2027', included: false },
        ],
      },
      {
        id: 'vip',
        badge: 'Passaporte poliglota',
        name: 'Coleção 6 Idiomas + Guia Renda Extra',
        priceLabel: 'R$ 297',
        compareAtLabel: 'R$ 321',
        priceSuffix: 'pagamento único',
        subtitle: 'Desbloqueie agora os 6 E-books de idiomas + o Guia Essencial Renda Extra 2027 em uma única compra.',
        valueBrl: 297,
        ctaLabel: 'Escolher Passaporte 6 Idiomas (R$ 297)',
        features: [
          { label: `E-book ${language} (100 lições e 500 exemplos coloridos)`, included: true },
          { label: 'Guia de IA por 4 faixas etárias + Planner de 90 dias', included: true },
          { label: 'Todos os 6 E-books (Inglês, Italiano, Francês, Alemão, Espanhol, Mandarim)', included: true },
          { label: 'Guia Essencial Renda Extra 2027 liberado junto', included: true },
        ],
      },
    ],
    [language],
  );

  const activeOption = options.find((option) => option.id === selectedTier) ?? options[1]!;

  return (
    <div id="checkout" className="mt-10 space-y-6">
      <DecoyPricingGrid
        funnel={`language-${slug}`}
        heading={`Escolha seu formato para aprender ${language}`}
        subheading="Compare as 3 opções abaixo. O pacote intermediário é o mais equilibrado para praticar todo dia e ainda libera descontos progressivos de 30% e 50% nos próximos idiomas."
        options={options}
        selectedTier={selectedTier}
        onSelectTier={setSelectedTier}
        offerVariant={offerVariant}
      />

      <aside className="rounded-2xl border border-orange/30 bg-income-surface p-6 shadow-[var(--card-shadow)] md:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange">{activeOption.badge}</p>
            <h3 className="mt-1 font-playfair text-3xl font-bold">{activeOption.name}</h3>
            <p className="mt-1 text-sm text-foreground/70">{activeOption.subtitle}</p>
          </div>
          <div className="text-right">
            <p className="font-playfair text-4xl font-bold text-orange">{activeOption.priceLabel}</p>
            <p className="text-xs font-semibold text-foreground/60">Pagamento único no Stripe</p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-[1.2fr_0.8fr] md:items-start">
          <GuideCheckoutButton
            label={activeOption.ctaLabel}
            offerVariant={withOfferTier(offerVariant, selectedTier)}
            tier={selectedTier}
            priceBrl={activeOption.valueBrl}
            funnelName={`language-${slug}`}
          />
          <div className="space-y-3 rounded-xl border border-border bg-background/60 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground/60">Antes de decidir</p>
            <Link
              href={previewHref}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border px-4 py-2.5 text-center text-sm font-bold hover:border-orange hover:text-orange"
            >
              {previewLabel}
            </Link>
            <p className="text-xs leading-relaxed text-foreground/60">
              Entrega digital imediata após confirmação do Stripe com PDF personalizado por CPF.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
