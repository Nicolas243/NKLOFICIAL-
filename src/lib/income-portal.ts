export const INCOME_PORTAL_ROUTES = {
  catalog: '/programas',
  legacyCatalog: '/blog/renda-extra',
  guide: '/guias/renda-extra',
  beginnerPrograms: '/programas/iniciantes',
  dollarPrograms: '/programas/dolar',
} as const;

function isRouteOrChild(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function isIncomePortalPath(pathname: string): boolean {
  return [
    INCOME_PORTAL_ROUTES.catalog,
    INCOME_PORTAL_ROUTES.legacyCatalog,
    INCOME_PORTAL_ROUTES.guide,
  ].some((route) => isRouteOrChild(pathname, route));
}

export function isIncomeCatalogPath(pathname: string): boolean {
  return isRouteOrChild(pathname, INCOME_PORTAL_ROUTES.catalog)
    || isRouteOrChild(pathname, INCOME_PORTAL_ROUTES.legacyCatalog);
}
