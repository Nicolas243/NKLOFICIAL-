export const ONBOARDING_CONTEXTS = ['income', 'music', 'both'] as const;

export type OnboardingContext = (typeof ONBOARDING_CONTEXTS)[number];

export function hasCompletedOnboarding(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  return metadata?.nkl_onboarding_completed === true
    || metadata?.nkl_onboarding_completed === 'true';
}

export function parseOnboardingContext(value: unknown): OnboardingContext | null {
  return typeof value === 'string'
    && ONBOARDING_CONTEXTS.includes(value as OnboardingContext)
    ? value as OnboardingContext
    : null;
}

export function includesMusic(context: OnboardingContext): boolean {
  return context === 'music' || context === 'both';
}
