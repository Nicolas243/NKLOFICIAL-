export const AI_PRODUCT_KEY = 'ai-na-pratica' as const;
export const AI_ONE_TIME_PRICE_CENTS = 9900;
export const AI_SUBSCRIPTION_PRICE_CENTS = 3900;
export const AI_ONE_TIME_TITLE = 'IA na Prática NKL — acesso avulso';
export const AI_SUBSCRIPTION_TITLE = 'IA na Prática NKL — assinatura mensal';

export type AiOfferPlan = 'one_time' | 'subscription';

export function isAiOfferPlan(value: string): value is AiOfferPlan {
  return value === 'one_time' || value === 'subscription';
}

export function getAiOfferPriceCents(plan: AiOfferPlan): number {
  return plan === 'one_time' ? AI_ONE_TIME_PRICE_CENTS : AI_SUBSCRIPTION_PRICE_CENTS;
}

export function getAiOfferTitle(plan: AiOfferPlan): string {
  return plan === 'one_time' ? AI_ONE_TIME_TITLE : AI_SUBSCRIPTION_TITLE;
}
