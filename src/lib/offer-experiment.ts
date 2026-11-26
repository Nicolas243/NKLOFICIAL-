export const PROGRAM_SECONDARY_CTA_EXPERIMENT = 'program-secondary-cta';
export const PROGRAM_SECONDARY_CTA_VARIANTS = ['0', '1', '2'] as const;
export const GUIDE_PAGE_CTA_EXPERIMENT = 'guide-page-cta';
export const GUIDE_PAGE_CTA_VARIANTS = ['0', '1', '2', '3', '4'] as const;
export const BUSSOLA_CTA_EXPERIMENT = 'bussola-cta';
export const BUSSOLA_CTA_VARIANTS = ['0', '1', '2'] as const;
export const LANGUAGES_HUB_CTA_EXPERIMENT = 'languages-hub-cta';
export const LANGUAGES_HUB_CTA_VARIANTS = ['0', '1', '2'] as const;
export const IA_OFFER_CTA_EXPERIMENT = 'ia-offer-cta';
export const IA_OFFER_CTA_VARIANTS = ['0', '1', '2'] as const;
const EXIT_POPUP_VARIANTS = ['0', '1', '2', '3', '4'] as const;
const NATIVE_CARD_VARIANTS = ['0', '1', '2', '3', '4', '5'] as const;
const LANGUAGE_EBOOK_OFFER_VARIANTS = [
  'english-ebook-sales-page',
  'italian-ebook-sales-page',
  'french-ebook-sales-page',
  'german-ebook-sales-page',
  'spanish-ebook-sales-page',
  'mandarin-ebook-sales-page',
] as const;

export type OfferExperimentName =
  | 'exit-popup'
  | 'native-card'
  | typeof PROGRAM_SECONDARY_CTA_EXPERIMENT
  | typeof GUIDE_PAGE_CTA_EXPERIMENT
  | typeof BUSSOLA_CTA_EXPERIMENT
  | typeof LANGUAGES_HUB_CTA_EXPERIMENT
  | typeof IA_OFFER_CTA_EXPERIMENT;

export type OfferVariantAttribution = {
  experiment: string;
  variant: string;
};

export function parseProgramSecondaryCtaVariant(value: string | null | undefined): (typeof PROGRAM_SECONDARY_CTA_VARIANTS)[number] | null {
  return PROGRAM_SECONDARY_CTA_VARIANTS.includes(value as (typeof PROGRAM_SECONDARY_CTA_VARIANTS)[number])
    ? value as (typeof PROGRAM_SECONDARY_CTA_VARIANTS)[number]
    : null;
}

export function parseGuidePageCtaVariant(value: string | null | undefined): (typeof GUIDE_PAGE_CTA_VARIANTS)[number] | null {
  return GUIDE_PAGE_CTA_VARIANTS.includes(value as (typeof GUIDE_PAGE_CTA_VARIANTS)[number])
    ? value as (typeof GUIDE_PAGE_CTA_VARIANTS)[number]
    : null;
}

export function getOfferExperimentFromVariant(value: string | null | undefined): OfferVariantAttribution | null {
  if (!value) return null;
  const baseValue = value.replace(/:(essential|vip)$/u, '');
  const [experiment, variant] = baseValue.split(':');
  if (!experiment || !variant) return null;
  return { experiment, variant };
}

export function parseValidatedOfferVariant(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value.trim() === '') return null;
  const trimmed = value.trim();
  const tierMatch = /:(essential|vip)$/u.exec(trimmed);
  const tierSuffix = tierMatch ? `:${tierMatch[1]}` : '';
  const normalized = tierSuffix ? trimmed.slice(0, -tierSuffix.length) : trimmed;

  if (normalized === 'sales-page') return `${normalized}${tierSuffix}`;
  if (normalized === 'sales-page:subscription' && !tierSuffix) return normalized;
  if (LANGUAGE_EBOOK_OFFER_VARIANTS.includes(normalized as (typeof LANGUAGE_EBOOK_OFFER_VARIANTS)[number])) {
    return `${normalized}${tierSuffix}`;
  }

  const attribution = getOfferExperimentFromVariant(normalized);
  if (!attribution) return null;
  if (
    attribution.experiment === PROGRAM_SECONDARY_CTA_EXPERIMENT
    && parseProgramSecondaryCtaVariant(attribution.variant) !== null
  ) {
    return `${PROGRAM_SECONDARY_CTA_EXPERIMENT}:${attribution.variant}${tierSuffix}`;
  }
  if (
    attribution.experiment === GUIDE_PAGE_CTA_EXPERIMENT
    && parseGuidePageCtaVariant(attribution.variant) !== null
  ) {
    return `${GUIDE_PAGE_CTA_EXPERIMENT}:${attribution.variant}${tierSuffix}`;
  }
  if (
    (
      attribution.experiment === BUSSOLA_CTA_EXPERIMENT
      || attribution.experiment === LANGUAGES_HUB_CTA_EXPERIMENT
      || attribution.experiment === IA_OFFER_CTA_EXPERIMENT
    )
    && ['0', '1', '2'].includes(attribution.variant)
  ) {
    return `${attribution.experiment}:${attribution.variant}${tierSuffix}`;
  }
  if (
    attribution.experiment === 'native-card'
    && NATIVE_CARD_VARIANTS.includes(attribution.variant as (typeof NATIVE_CARD_VARIANTS)[number])
  ) {
    return `native-card:${attribution.variant}${tierSuffix}`;
  }
  if (
    attribution.experiment === 'exit-popup'
    && EXIT_POPUP_VARIANTS.includes(attribution.variant as (typeof EXIT_POPUP_VARIANTS)[number])
  ) {
    return `exit-popup:${attribution.variant}${tierSuffix}`;
  }
  return null;
}

export type OfferVariantStats = {
  variant: string;
  impressions: number;
  conversions: number;
};

export function chooseBalancedVariant(
  stats: readonly OfferVariantStats[],
  variants: readonly string[],
  minimumExposures: number,
): string {
  const normalizedStats = variants.map((variant) => stats.find((item) => item.variant === variant) ?? {
    variant,
    impressions: 0,
    conversions: 0,
  });
  const minimumImpressions = Math.min(...normalizedStats.map((item) => item.impressions));

  if (minimumImpressions < minimumExposures) {
    return [...normalizedStats]
      .sort((left, right) => left.impressions - right.impressions || Number(left.variant) - Number(right.variant))
      .at(0)?.variant ?? variants[0] ?? '0';
  }

  return [...normalizedStats]
    .sort((left, right) => {
      const leftRate = left.impressions > 0 ? left.conversions / left.impressions : 0;
      const rightRate = right.impressions > 0 ? right.conversions / right.impressions : 0;
      return rightRate - leftRate
        || Number(left.variant) - Number(right.variant);
    })
    .at(0)?.variant ?? variants[0] ?? '0';
}
