import { safeNextPath } from '@/lib/auth/oauth';

export type GuideResumeIntent = 'purchase' | 'subscription';

export function parseGuideResumeIntent(value: string | null): GuideResumeIntent | null {
  return value === 'purchase' || value === 'subscription' ? value : null;
}

export function buildLoginPath(nextPath: string, intent: GuideResumeIntent): string {
  const search = new URLSearchParams({
    next: safeNextPath(nextPath),
    resume: intent,
  });
  return `/login?${search.toString()}`;
}

export function buildReturnPath(nextPath: string, intent: GuideResumeIntent | null): string {
  const safePath = safeNextPath(nextPath);
  if (!intent) return safePath;

  const url = new URL(safePath, 'https://portal-nkl.invalid');
  url.searchParams.set('resume', intent);
  return `${url.pathname}${url.search}${url.hash}`;
}
