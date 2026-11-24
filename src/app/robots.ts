import type { MetadataRoute } from 'next';
import { absoluteSiteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/programas/admin',
        '/perfil',
        '/minha-conta',
        '/app',
        '/dashboard',
        '/api/',
        '/ia/curso',
        '/ia/prompts',
        '/ia/ferramentas',
        '/ia/progresso',
        '/ia/resultado',
        '/resultado',
      ],
    },
    sitemap: absoluteSiteUrl('/sitemap.xml'),
  };
}
