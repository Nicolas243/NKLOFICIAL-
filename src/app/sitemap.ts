import type { MetadataRoute } from 'next';
import { db } from '@/db';
import { stringsCatalog, userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Base canônica do site. Use NEXT_PUBLIC_SITE_URL em produção; senão, um
// fallback razoável para a geração do sitemap.
const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://nkl.com.br';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Consultas leves: apenas os campos necessários (id e updatedAt).
  const [strings, luthiers] = await Promise.all([
    db
      .select({ id: stringsCatalog.id, updatedAt: stringsCatalog.updatedAt })
      .from(stringsCatalog),
    db
      .select({ id: userProfiles.id, updatedAt: userProfiles.createdAt })
      .from(userProfiles)
      .where(eq(userProfiles.role, 'luthier')),
  ]);

  const staticRoutes = ['', '/catalogo', '/luthiers', '/noticias', '/comparar'];

  const entries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: path === '' ? `${BASE_URL}/` : `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: path === '' ? 1 : 0.8,
  }));

  const stringEntries: MetadataRoute.Sitemap = strings.map((item) => ({
    url: `${BASE_URL}/catalogo/${item.id}`,
    lastModified: item.updatedAt ?? new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const luthierEntries: MetadataRoute.Sitemap = luthiers.map((item) => ({
    url: `${BASE_URL}/luthiers/${item.id}`,
    lastModified: item.updatedAt ?? new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...entries, ...stringEntries, ...luthierEntries];
}