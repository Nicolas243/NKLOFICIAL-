import type { MetadataRoute } from 'next';
import { absoluteSiteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/programas/admin', '/perfil', '/dashboard', '/api/'],
    },
    sitemap: absoluteSiteUrl('/sitemap.xml'),
  };
}
