import { isIncomePortalPath } from '@/lib/income-portal';

export type TutorialArea = 'income' | 'music';
export type TutorialRoute = {
  key: string;
  area: TutorialArea;
};

export const HOME_TUTORIAL_SEEN_KEY = 'nkl_tutorial_seen';

const MUSIC_ROUTES = [
  '/',
  '/catalogo',
  '/comparar',
  '/clinica',
  '/fisica-do-som',
  '/noticias',
  '/professores',
  '/lojas',
  '/luthiers',
  '/contatos',
  '/meu-setup',
] as const;

function isRouteOrChild(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function normalizePathname(pathname: string): string {
  const withoutQuery = pathname.split(/[?#]/u, 1)[0] ?? '/';
  if (withoutQuery === '/') return '/';
  return withoutQuery.replace(/\/+$/u, '');
}

export function getTutorialArea(pathname: string): TutorialArea | null {
  if (isIncomePortalPath(pathname)) return 'income';
  if (MUSIC_ROUTES.some((route) => isRouteOrChild(pathname, route))) return 'music';
  return null;
}

export function getTutorialRoute(pathname: string): TutorialRoute | null {
  const normalizedPathname = normalizePathname(pathname);
  const area = getTutorialArea(normalizedPathname);
  if (!area) return null;

  if (area === 'income') {
    if (normalizedPathname.startsWith('/programas/')) {
      return { key: `income:${normalizedPathname}`, area };
    }
    return { key: `income:${normalizedPathname}`, area };
  }

  if (normalizedPathname.startsWith('/noticias/')) {
    return { key: 'music:/noticias/:slug', area };
  }

  return { key: `music:${normalizedPathname}`, area };
}

export function getTutorialSuggestionKey(routeKey: string): string {
  return routeKey.includes('/')
    ? `nkl_route_tutorial_suggestion_seen:${routeKey}`
    : `nkl_area_tutorial_suggestion_seen:${routeKey}`;
}
