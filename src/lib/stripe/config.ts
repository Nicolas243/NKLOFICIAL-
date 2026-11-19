type StripeEnvironment = {
  STRIPE_API_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
};

export function getStripeApiKey(values: StripeEnvironment): string | undefined {
  return values.STRIPE_API_KEY?.trim() || values.STRIPE_SECRET_KEY?.trim();
}

export function hasStripeConfiguration(
  values: StripeEnvironment,
): boolean {
  return Boolean(
    getStripeApiKey(values)
    && values.STRIPE_WEBHOOK_SECRET?.trim(),
  );
}
