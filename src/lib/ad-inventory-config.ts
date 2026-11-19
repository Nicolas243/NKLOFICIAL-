export const AD_BANNER_SLOT_COUNT = 10;
export const AD_ASSET_MAX_BYTES = 5 * 1024 * 1024;
export const AD_ASSET_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'video/webm',
] as const;

const DEFAULT_AD_PROMOTION_END = '2026-12-01T00:00:00-03:00';
const DEFAULT_AD_PROMOTIONAL_PRICE_CENTS = 1990;
const DEFAULT_AD_STANDARD_PRICE_CENTS = 6990;

export type AdPricing = {
  monthlyPriceCents: number;
  standardPriceCents: number;
  isPromotionActive: boolean;
};

function getConfiguredPrice(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 500 && parsed <= 100000
    ? parsed
    : fallback;
}

export function getAdPricing(
  values: Record<string, string | undefined> = process.env,
  now = new Date(),
): AdPricing {
  const standardPriceCents = getConfiguredPrice(
    values.AD_STANDARD_PRICE_CENTS,
    DEFAULT_AD_STANDARD_PRICE_CENTS,
  );
  const promotionalPriceCents = getConfiguredPrice(
    values.AD_PROMOTIONAL_PRICE_CENTS ?? values.AD_MONTHLY_PRICE_CENTS,
    DEFAULT_AD_PROMOTIONAL_PRICE_CENTS,
  );
  const promotionEnd = new Date(values.AD_PROMOTION_END_DATE ?? DEFAULT_AD_PROMOTION_END);
  const isPromotionActive = !Number.isNaN(promotionEnd.getTime()) && now < promotionEnd;

  return {
    monthlyPriceCents: isPromotionActive ? promotionalPriceCents : standardPriceCents,
    standardPriceCents,
    isPromotionActive,
  };
}

export function getAdMonthlyPriceCents(
  values: Record<string, string | undefined> = process.env,
): number {
  return getAdPricing(values).monthlyPriceCents;
}
