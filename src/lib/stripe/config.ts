type StripeEnvironment = {
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
};

export function hasStripeConfiguration(
  values: StripeEnvironment,
): boolean {
  return Boolean(
    values.STRIPE_SECRET_KEY?.trim()
    && values.STRIPE_WEBHOOK_SECRET?.trim(),
  );
}
