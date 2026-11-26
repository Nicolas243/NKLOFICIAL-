'use client';

import { Check, X } from 'lucide-react';
import { trackPricingTierSelected } from '@/lib/analytics';

export type DecoyTierOption<TId extends string = string> = {
  id: TId;
  badge: string;
  name: string;
  priceLabel: string;
  priceSuffix?: string;
  compareAtLabel?: string;
  subtitle: string;
  recommended?: boolean;
  valueBrl: number;
  ctaLabel: string;
  features: ReadonlyArray<{ label: string; included: boolean }>;
};

type DecoyPricingGridProps<TId extends string> = {
  funnel: string;
  eyebrow?: string;
  heading: string;
  subheading: string;
  options: readonly DecoyTierOption<TId>[];
  selectedTier: TId;
  onSelectTier: (tierId: TId) => void;
  offerVariant?: string;
  accent?: 'orange' | 'neon';
};

export function DecoyPricingGrid<TId extends string>({
  funnel,
  eyebrow = 'Compare os 3 formatos de acesso',
  heading,
  subheading,
  options,
  selectedTier,
  onSelectTier,
  offerVariant,
  accent = 'orange',
}: DecoyPricingGridProps<TId>) {
  function handlePick(option: DecoyTierOption<TId>) {
    onSelectTier(option.id);
    trackPricingTierSelected({
      funnel,
      tier: option.id,
      valueBrl: option.valueBrl,
      offerVariant,
    });
  }

  const activeBorder =
    accent === 'neon'
      ? 'border-neon bg-neon/5 shadow-[0_0_32px_rgba(190,255,0,0.08)]'
      : 'border-orange bg-orange/5 shadow-[var(--card-shadow)]';
  const badgeBg = accent === 'neon' ? 'bg-neon text-black' : 'bg-orange text-white';

  return (
    <section className="rounded-3xl border border-border bg-income-surface/75 p-5 md:p-8" aria-label={heading}>
      <div className="max-w-3xl">
        <p className={`text-xs font-bold uppercase tracking-[0.2em] ${accent === 'neon' ? 'text-neon' : 'text-orange'}`}>
          {eyebrow}
        </p>
        <h2 className="mt-2 font-playfair text-3xl font-bold md:text-4xl">{heading}</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/75">{subheading}</p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3 lg:items-stretch">
        {options.map((option) => {
          const isSelected = selectedTier === option.id;
          return (
            <article
              key={option.id}
              className={`relative flex flex-col justify-between rounded-2xl border p-5 transition ${
                isSelected
                  ? `border-2 ${activeBorder}`
                  : option.recommended
                    ? 'border-orange/45 bg-background/70'
                    : 'border-border bg-background/60 hover:border-foreground/30'
              }`}
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                      option.recommended
                        ? badgeBg
                        : 'border border-border bg-surface text-foreground/75'
                    }`}
                  >
                    {option.badge}
                  </span>
                  {isSelected && (
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      Selecionado
                    </span>
                  )}
                </div>

                <h3 className="mt-4 font-playfair text-2xl font-bold">{option.name}</h3>
                <div className="mt-3 flex flex-wrap items-baseline gap-2">
                  {option.compareAtLabel && (
                    <span className="text-sm text-foreground/45 line-through">{option.compareAtLabel}</span>
                  )}
                  <span className={`font-playfair text-4xl font-bold ${option.recommended ? (accent === 'neon' ? 'text-neon' : 'text-orange') : ''}`}>
                    {option.priceLabel}
                  </span>
                  {option.priceSuffix && (
                    <span className="text-xs font-semibold text-foreground/60">{option.priceSuffix}</span>
                  )}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-foreground/70">{option.subtitle}</p>

                <ul className="mt-5 space-y-2.5 border-t border-border pt-4 text-xs leading-relaxed">
                  {option.features.map((feat) => (
                    <li
                      key={feat.label}
                      className={`flex items-start gap-2 ${feat.included ? 'text-foreground/90' : 'text-foreground/45 line-through'}`}
                    >
                      {feat.included ? (
                        <Check size={15} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                      ) : (
                        <X size={15} className="mt-0.5 shrink-0 text-foreground/35" aria-hidden="true" />
                      )}
                      <span>{feat.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handlePick(option)}
                className={`mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  isSelected
                    ? option.recommended
                      ? badgeBg
                      : 'bg-foreground text-background'
                    : option.recommended
                      ? `border ${accent === 'neon' ? 'border-neon text-neon hover:bg-neon hover:text-black' : 'border-orange text-orange hover:bg-orange hover:text-white'}`
                      : 'border border-border hover:border-foreground/50'
                }`}
              >
                {isSelected ? 'Opção selecionada abaixo' : option.ctaLabel}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
