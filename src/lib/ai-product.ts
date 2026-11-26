export const AI_PRODUCT_KEY = 'ai-na-pratica' as const;
export const AI_ONE_TIME_PRICE_CENTS = 9900;
export const AI_SUBSCRIPTION_PRICE_CENTS = 3900;
export const AI_VIP_PRICE_CENTS = 39700;
export const AI_ONE_TIME_TITLE = 'IA na Prática NKL — acesso avulso';
export const AI_SUBSCRIPTION_TITLE = 'IA na Prática NKL — assinatura mensal';
export const AI_VIP_TITLE = 'IA na Prática NKL — Passe Total Portal NKL';

export type AiOfferPlan = 'one_time' | 'subscription' | 'vip';

export type AiStripePriceEnv = {
  AI_ONE_TIME_STRIPE_PRICE_ID?: string;
  AI_SUBSCRIPTION_STRIPE_PRICE_ID?: string;
  AI_VIP_STRIPE_PRICE_ID?: string;
  [key: string]: string | undefined;
};

export function isAiOfferPlan(value: string): value is AiOfferPlan {
  return value === 'one_time' || value === 'subscription' || value === 'vip';
}

export function getAiOfferPriceCents(plan: AiOfferPlan): number {
  if (plan === 'vip') return AI_VIP_PRICE_CENTS;
  return plan === 'one_time' ? AI_ONE_TIME_PRICE_CENTS : AI_SUBSCRIPTION_PRICE_CENTS;
}

export function getAiOfferTitle(plan: AiOfferPlan): string {
  if (plan === 'vip') return AI_VIP_TITLE;
  return plan === 'one_time' ? AI_ONE_TIME_TITLE : AI_SUBSCRIPTION_TITLE;
}

export function getAiOfferCheckoutMode(plan: AiOfferPlan): 'payment' | 'subscription' {
  return plan === 'subscription' ? 'subscription' : 'payment';
}

export function getAiOfferClientReferenceId(plan: AiOfferPlan, userId: string): string {
  const prefix = plan === 'subscription' ? 'ai_subscription' : 'ai_one_time';
  return `${prefix}:${userId.trim()}`;
}

export function getAiOfferStripePriceId(
  plan: AiOfferPlan,
  envVars: AiStripePriceEnv = process.env,
): string | null {
  const raw = plan === 'vip'
    ? envVars.AI_VIP_STRIPE_PRICE_ID
    : plan === 'one_time'
      ? envVars.AI_ONE_TIME_STRIPE_PRICE_ID
      : envVars.AI_SUBSCRIPTION_STRIPE_PRICE_ID;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : null;
}
