export const INCOME_PORTAL_ROUTES = {
  catalog: '/programas',
  legacyCatalog: '/blog/renda-extra',
  guide: '/guias/renda-extra',
  beginnerPrograms: '/programas/iniciantes',
  dollarPrograms: '/programas/dolar',
  mobilePrograms: '/programas/celular',
  noInvestmentPrograms: '/programas/sem-investimento',
  remoteWorkPrograms: '/programas/trabalho-remoto',
  paidResearchPrograms: '/programas/pesquisas-remuneradas',
  advertise: '/programas/anuncie',
  legacyAdvertise: '/anuncie',
} as const;

export const INCOME_SUGGESTION_FORM_URL = 'https://forms.gle/2nREXEVdB6JyjtbC8';

export type PortalSuggestionArea = 'idiomas' | 'ia' | 'renda-extra' | 'musica' | 'geral';

export function getSuggestionAreaFromPath(pathname: string): PortalSuggestionArea {
  if (
    isRouteOrChild(pathname, '/blog/aprender')
    || ['/guias/ingles', '/guias/italiano', '/guias/frances', '/guias/alemao', '/guias/espanhol', '/guias/chines']
      .some((route) => isRouteOrChild(pathname, route))
  ) {
    return 'idiomas';
  }
  if (isRouteOrChild(pathname, '/ia')) return 'ia';
  if (isIncomePortalPath(pathname)) return 'renda-extra';
  if (isMusicPortalPath(pathname)) return 'musica';
  return 'geral';
}

export function getSuggestionHref(pathname: string): string {
  const area = getSuggestionAreaFromPath(pathname);
  const safeOrigin = pathname.startsWith('/') ? pathname : '/';
  const params = new URLSearchParams({ area, origem: safeOrigin });
  return `/sugerir?${params.toString()}`;
}

function isRouteOrChild(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function isIncomePortalPath(pathname: string): boolean {
  return [
    INCOME_PORTAL_ROUTES.catalog,
    INCOME_PORTAL_ROUTES.legacyCatalog,
    INCOME_PORTAL_ROUTES.guide,
    INCOME_PORTAL_ROUTES.beginnerPrograms,
    INCOME_PORTAL_ROUTES.dollarPrograms,
    INCOME_PORTAL_ROUTES.mobilePrograms,
    INCOME_PORTAL_ROUTES.noInvestmentPrograms,
    INCOME_PORTAL_ROUTES.remoteWorkPrograms,
    INCOME_PORTAL_ROUTES.paidResearchPrograms,
    INCOME_PORTAL_ROUTES.advertise,
    INCOME_PORTAL_ROUTES.legacyAdvertise,
  ].some((route) => isRouteOrChild(pathname, route));
}

export function isIncomeCatalogPath(pathname: string): boolean {
  return isIncomePortalPath(pathname);
}

export type PortalSurface = 'home' | 'music' | 'ecosystem';

export const MUSIC_PORTAL_HOME = '/musica/naipe_cordas';

/** Rotas que pertencem ao universo musical (cabecalho, parallax e rodape de cordas). */
const MUSIC_PORTAL_ROUTES = [
  '/musica',
  '/catalogo',
  '/luthiers',
  '/professores',
  '/comparar',
  '/guia-de-cordas',
  '/clinica',
  '/fisica-do-som',
  '/recomendados',
  '/lojas',
  '/noticias',
  '/meu-setup',
  '/contatos',
  '/dashboard/luthier',
  '/dashboard/professor',
] as const;

export function isMusicPortalPath(pathname: string): boolean {
  return MUSIC_PORTAL_ROUTES.some((route) => isRouteOrChild(pathname, route));
}

/**
 * Superficie visual de uma rota:
 * - `home`: Portal Base (`/`), sem cabecalho tradicional;
 * - `music`: cordas e luthieria (cabecalho, parallax e rodape musicais);
 * - `ecosystem`: todo o resto (IA, idiomas, quiz, guias, renda extra, institucional).
 */
export function getPortalSurface(pathname: string): PortalSurface {
  if (pathname === '/' || pathname === '') return 'home';
  if (isMusicPortalPath(pathname)) return 'music';
  return 'ecosystem';
}
