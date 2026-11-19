import type { MetadataRoute } from 'next';
import { getPartnerPrograms } from '@/actions/partner-programs';
import { INCOME_PORTAL_ROUTES } from '@/lib/income-portal';
import { absoluteSiteUrl } from '@/lib/site';
import { PROGRAM_HUBS } from '@/lib/program-hubs';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const programs = await getPartnerPrograms();

  return [
    { url: absoluteSiteUrl('/'), lastModified, changeFrequency: 'daily', priority: 1.0 },
    { url: absoluteSiteUrl(INCOME_PORTAL_ROUTES.catalog), lastModified, changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteSiteUrl(INCOME_PORTAL_ROUTES.beginnerPrograms), lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteSiteUrl(INCOME_PORTAL_ROUTES.dollarPrograms), lastModified, changeFrequency: 'weekly', priority: 0.8 },
    ...Object.values(PROGRAM_HUBS).map((hub) => ({
      url: absoluteSiteUrl(`/programas/${hub.slug}`),
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...programs.map((program) => ({
      url: absoluteSiteUrl(`/programas/${program.slug}`),
      lastModified: program.lastVerifiedAt ? new Date(program.lastVerifiedAt) : lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    { url: absoluteSiteUrl(INCOME_PORTAL_ROUTES.guide), lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteSiteUrl('/blog/aprender/ingles'), lastModified, changeFrequency: 'weekly', priority: 0.8 },
    ...['italiano', 'frances', 'alemao', 'espanhol', 'chines'].map((language) => ({
      url: absoluteSiteUrl(`/blog/aprender/${language}`),
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    { url: absoluteSiteUrl('/guias/ingles'), lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteSiteUrl('/guias/ingles/ebook'), lastModified, changeFrequency: 'monthly', priority: 0.6 },
    ...['italiano', 'frances', 'alemao', 'espanhol', 'chines'].flatMap((language) => [
      { url: absoluteSiteUrl(`/guias/${language}`), lastModified, changeFrequency: 'monthly' as const, priority: 0.7 },
      { url: absoluteSiteUrl(`/guias/${language}/ebook`), lastModified, changeFrequency: 'monthly' as const, priority: 0.6 },
    ]),
    { url: absoluteSiteUrl('/ia'), lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteSiteUrl('/ia/oferta'), lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: absoluteSiteUrl(INCOME_PORTAL_ROUTES.advertise), lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteSiteUrl('/catalogo'), lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteSiteUrl('/luthiers'), lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteSiteUrl('/professores'), lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteSiteUrl('/lojas'), lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteSiteUrl('/contatos'), lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteSiteUrl('/privacidade'), lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteSiteUrl('/termos'), lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteSiteUrl('/reembolso'), lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteSiteUrl('/clinica'), lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteSiteUrl('/guia-de-cordas'), lastModified, changeFrequency: 'monthly', priority: 0.5 },
  ];
}