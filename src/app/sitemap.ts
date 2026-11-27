import type { MetadataRoute } from 'next';
import { unstable_cache } from 'next/cache';
import { getPartnerPrograms } from '@/actions/partner-programs';
import { PAID_PRODUCT_SLUGS } from '@/config/products';
import { INCOME_PORTAL_ROUTES } from '@/lib/income-portal';
import { PROGRAM_HUBS } from '@/lib/program-hubs';
import { PROGRAM_COMPARISONS } from '@/lib/seo/program-comparisons';
import { SITE_CONTENT_LAST_MODIFIED } from '@/lib/seo/schema-graph';
import { getAllStringsCatalog } from '@/lib/seo/string-catalog-all';
import { STRING_COMPARISONS } from '@/lib/seo/string-comparisons';
import { absoluteSiteUrl } from '@/lib/site';

export const revalidate = 3600;

const getCachedSitemapPrograms = unstable_cache(
  async () => getPartnerPrograms().catch(() => []),
  ['sitemap-partner-programs'],
  { revalidate: 300 },
);

const getCachedSitemapStrings = unstable_cache(
  async () => getAllStringsCatalog().catch(() => []),
  ['sitemap-strings-catalog'],
  { revalidate: 3600 },
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticLastModified = new Date(SITE_CONTENT_LAST_MODIFIED);
  const [programs, strings] = await Promise.all([
    getCachedSitemapPrograms().catch(() => []),
    getCachedSitemapStrings().catch(() => []),
  ]);

  const entries: MetadataRoute.Sitemap = [
    { url: absoluteSiteUrl('/'), lastModified: staticLastModified, changeFrequency: 'daily', priority: 1.0 },
    { url: absoluteSiteUrl('/instalar'), lastModified: staticLastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteSiteUrl('/metodologia'), lastModified: staticLastModified, changeFrequency: 'monthly', priority: 0.85 },
    ...PAID_PRODUCT_SLUGS.map((slug) => ({
      url: absoluteSiteUrl(`/ofertas/${slug}`),
      lastModified: staticLastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    { url: absoluteSiteUrl('/musica/naipe_cordas'), lastModified: staticLastModified, changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteSiteUrl(INCOME_PORTAL_ROUTES.catalog), lastModified: staticLastModified, changeFrequency: 'daily', priority: 1.0 },
    { url: absoluteSiteUrl('/mural-de-parceiros'), lastModified: staticLastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteSiteUrl(INCOME_PORTAL_ROUTES.beginnerPrograms), lastModified: staticLastModified, changeFrequency: 'weekly', priority: 0.85 },
    { url: absoluteSiteUrl(INCOME_PORTAL_ROUTES.dollarPrograms), lastModified: staticLastModified, changeFrequency: 'weekly', priority: 0.85 },
    ...Object.values(PROGRAM_HUBS).map((hub) => ({
      url: absoluteSiteUrl(`/programas/${hub.slug}`),
      lastModified: staticLastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),
    ...PROGRAM_COMPARISONS.map((item) => ({
      url: absoluteSiteUrl(`/programas/comparar/${item.slug}`),
      lastModified: staticLastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...programs.map((program) => ({
      url: absoluteSiteUrl(`/programas/${program.slug}`),
      lastModified: program.lastVerifiedAt ? new Date(program.lastVerifiedAt) : staticLastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    { url: absoluteSiteUrl(INCOME_PORTAL_ROUTES.guide), lastModified: staticLastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteSiteUrl('/idiomas'), lastModified: staticLastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: absoluteSiteUrl('/sugerir'), lastModified: staticLastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteSiteUrl('/blog/aprender/ingles'), lastModified: staticLastModified, changeFrequency: 'weekly', priority: 0.8 },
    ...['italiano', 'frances', 'alemao', 'espanhol', 'chines'].map((language) => ({
      url: absoluteSiteUrl(`/blog/aprender/${language}`),
      lastModified: staticLastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...['ingles', 'italiano', 'frances', 'alemao', 'espanhol', 'chines'].flatMap((language) => [
      { url: absoluteSiteUrl(`/guias/${language}`), lastModified: staticLastModified, changeFrequency: 'monthly' as const, priority: 0.7 },
      { url: absoluteSiteUrl(`/guias/${language}/ebook`), lastModified: staticLastModified, changeFrequency: 'monthly' as const, priority: 0.6 },
    ]),
    { url: absoluteSiteUrl('/ia'), lastModified: staticLastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteSiteUrl('/ia/oferta'), lastModified: staticLastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: absoluteSiteUrl(INCOME_PORTAL_ROUTES.advertise), lastModified: staticLastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteSiteUrl('/catalogo'), lastModified: staticLastModified, changeFrequency: 'weekly', priority: 0.8 },
    ...strings.map((item) => ({
      url: absoluteSiteUrl(`/catalogo/${item.id}`),
      lastModified: item.updatedAt ? new Date(item.updatedAt) : staticLastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    { url: absoluteSiteUrl('/noticias'), lastModified: staticLastModified, changeFrequency: 'daily', priority: 0.7 },
    { url: absoluteSiteUrl('/comparar'), lastModified: staticLastModified, changeFrequency: 'weekly', priority: 0.7 },
    ...STRING_COMPARISONS.map((item) => ({
      url: absoluteSiteUrl(`/comparar/${item.slug}`),
      lastModified: staticLastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    { url: absoluteSiteUrl('/fisica-do-som'), lastModified: staticLastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: absoluteSiteUrl('/recomendados'), lastModified: staticLastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteSiteUrl('/importacao'), lastModified: staticLastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: absoluteSiteUrl('/luthiers'), lastModified: staticLastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteSiteUrl('/professores'), lastModified: staticLastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteSiteUrl('/lojas'), lastModified: staticLastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteSiteUrl('/contatos'), lastModified: staticLastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteSiteUrl('/privacidade'), lastModified: staticLastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteSiteUrl('/termos'), lastModified: staticLastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteSiteUrl('/reembolso'), lastModified: staticLastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteSiteUrl('/clinica'), lastModified: staticLastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteSiteUrl('/guia-de-cordas'), lastModified: staticLastModified, changeFrequency: 'monthly', priority: 0.5 },
  ];

  const seenUrls = new Set<string>();
  return entries.filter((entry) => {
    if (seenUrls.has(entry.url)) return false;
    seenUrls.add(entry.url);
    return true;
  });
}
