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
