export const PROGRAM_SECONDARY_CTA_EXPERIMENT = 'program-secondary-cta';
export const PROGRAM_SECONDARY_CTA_VARIANTS = ['0', '1', '2'] as const;

export type OfferExperimentName = 'exit-popup' | 'native-card' | typeof PROGRAM_SECONDARY_CTA_EXPERIMENT;

export type OfferVariantAttribution = {
  experiment: string;
  variant: string;
};

export function parseProgramSecondaryCtaVariant(value: string | null | undefined): (typeof PROGRAM_SECONDARY_CTA_VARIANTS)[number] | null {
  return PROGRAM_SECONDARY_CTA_VARIANTS.includes(value as (typeof PROGRAM_SECONDARY_CTA_VARIANTS)[number])
    ? value as (typeof PROGRAM_SECONDARY_CTA_VARIANTS)[number]
    : null;
}

export function getOfferExperimentFromVariant(value: string | null | undefined): OfferVariantAttribution | null {
  if (!value) return null;
  const [experiment, variant] = value.split(':');
  if (!experiment || !variant) return null;
  return { experiment, variant };
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
