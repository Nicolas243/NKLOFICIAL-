const DEFAULT_SITE_URL = 'https://nkloficial.com.br';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL).replace(/\/+$/, '');

export function absoluteSiteUrl(pathname: string): string {
  if (/^https?:\/\//u.test(pathname)) return pathname;
  return `${SITE_URL}/${pathname.replace(/^\/+/u, '')}`;
}
