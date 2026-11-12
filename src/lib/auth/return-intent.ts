export type GuideResumeIntent = 'purchase' | 'subscription';
export type LoginArea = 'music' | 'income';

export function safeNextPath(value: string | null): string {
  return value
    && value.startsWith('/')
    && !value.startsWith('//')
    && !value.includes('\\')
    ? value
    : '/';
}

export function parseGuideResumeIntent(value: string | null): GuideResumeIntent | null {
  return value === 'purchase' || value === 'subscription' ? value : null;
}

export function parseLoginArea(value: string | null): LoginArea {
  return value === 'income' ? 'income' : 'music';
}

export function buildLoginPath(
  nextPath: string,
  intent: GuideResumeIntent | null,
  area: LoginArea = 'music',
): string {
  const search = new URLSearchParams({
    next: safeNextPath(nextPath),
  });
  if (intent) search.set('resume', intent);
  if (area === 'income') search.set('area', area);
  return `/login?${search.toString()}`;
}

export function buildReturnPath(nextPath: string, intent: GuideResumeIntent | null): string {
  const safePath = safeNextPath(nextPath);
  if (!intent) return safePath;

  const url = new URL(safePath, 'https://portal-nkl.invalid');
  url.searchParams.set('resume', intent);
  return `${url.pathname}${url.search}${url.hash}`;
}
