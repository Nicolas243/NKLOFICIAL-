import type { MetadataRoute } from 'next';
import { getPartnerPrograms } from '@/actions/partner-programs';

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://nkl.com.br';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const programs = await getPartnerPrograms();

  return [
    { url: `${BASE_URL}/`, lastModified, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/programas`, lastModified, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/programas/iniciantes`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/programas/dolar`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    ...programs.map((program) => ({
      url: `${BASE_URL}/programas/${program.slug}`,
      lastModified: program.lastVerifiedAt ? new Date(program.lastVerifiedAt) : lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    { url: `${BASE_URL}/blog/renda-extra`, lastModified, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/catalogo`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/luthiers`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/professores`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/lojas`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/contatos`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/clinica`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/guia-de-cordas`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
  ];
}