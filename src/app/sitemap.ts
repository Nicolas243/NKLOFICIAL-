import type { MetadataRoute } from 'next';

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://nkl.com.br';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: `${BASE_URL}/`, lastModified, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/programas`, lastModified, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/catalogo`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/luthiers`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/professores`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/lojas`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/contatos`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/clinica`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/guia-de-cordas`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
  ];
}