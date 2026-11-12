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
} as const;

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
  ].some((route) => isRouteOrChild(pathname, route));
}

export function isIncomeCatalogPath(pathname: string): boolean {
  return isIncomePortalPath(pathname);
}
