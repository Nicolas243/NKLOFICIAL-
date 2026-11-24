import type { MetadataRoute } from 'next';
import {
  APP_BRAND_NAME,
  APP_BRAND_SHORT_NAME,
  APP_BRAND_TAGLINE,
  APP_ICONS,
} from '@/config/app-brand';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_BRAND_NAME,
    short_name: APP_BRAND_SHORT_NAME,
    description: APP_BRAND_TAGLINE,
    start_url: '/',
    display: 'standalone',
    background_color: '#090b10',
    theme_color: '#0f1a2c',
    lang: 'pt-BR',
    icons: [
      { src: APP_ICONS.portal[192], sizes: '192x192', type: 'image/png' },
      { src: APP_ICONS.portal[512], sizes: '512x512', type: 'image/png' },
    ],
  };
}
