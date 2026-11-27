import type { MetadataRoute } from 'next';
import { absoluteSiteUrl } from '@/lib/site';

const PRIVATE_DISALLOW = [
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
];

const ALLOWED_CRAWLERS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'Claude-SearchBot',
  'ClaudeBot',
  'Applebot',
  'Google-Extended',
  '*',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: ALLOWED_CRAWLERS.map((userAgent) => ({
      userAgent,
      allow: '/',
      disallow: PRIVATE_DISALLOW,
    })),
    sitemap: absoluteSiteUrl('/sitemap.xml'),
  };
}
