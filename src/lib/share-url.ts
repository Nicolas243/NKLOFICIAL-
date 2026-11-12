const SHARE_QUERY_ALLOWLIST = new Set(['page', 'category', 'q', 'sort']);

export function getProgramShareUrl(slug: string, siteOrigin: string, specificUrl?: string): string {
  if (specificUrl) return specificUrl;

  const origin = siteOrigin.replace(/\/+$/u, '');
  return `${origin}/programas/${encodeURIComponent(slug)}`;
}

function sanitizeUrl(value: string, fallback: URL): string {
  let url: URL;
  try {
    url = new URL(value, fallback);
  } catch {
    url = fallback;
  }

  if (url.origin !== fallback.origin) return sanitizeUrl(fallback.href, fallback);

  const search = new URLSearchParams();
  for (const [key, parameterValue] of url.searchParams) {
    if (SHARE_QUERY_ALLOWLIST.has(key)) search.set(key, parameterValue);
  }
  const query = search.toString();
  return `${url.origin}${url.pathname}${query ? `?${query}` : ''}`;
}

export function getCanonicalShareUrl({
  canonicalHref,
  currentHref,
}: {
  canonicalHref?: string | null;
  currentHref: string;
}): string {
  const current = new URL(currentHref);
  if (canonicalHref) return sanitizeUrl(canonicalHref, current);
  return sanitizeUrl(current.href, current);
}
