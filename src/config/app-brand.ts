export const APP_BRAND_NAME = 'Portal NKL' as const;

export const APP_BRAND_SHORT_NAME = 'Portal NKL' as const;

export const APP_BRAND_TAGLINE =
  'Renda extra, música, idiomas e IA em um só lugar.' as const;

export const NKL_SELECTED_TRACK_KEY = 'nkl_selected_track_v1' as const;

export type TrackId = 'renda-extra' | 'musica' | 'idiomas-ia' | 'ia-completa';

export type ProductSlug =
  | 'bussola-negocios'
  | 'ferramenta-ia'
  | 'pacote-idiomas-ia'
  | 'pacote-renda-extra'
  | 'ebook-ingles'
  | 'curso-ia-pratica';

export const APP_ICONS = {
  portal: {
    192: '/icons/portal-nkl-192.png',
    512: '/icons/portal-nkl-512.png',
  },
  rendaExtra: {
    192: '/icons/renda-extra-192.png',
    512: '/icons/renda-extra-512.png',
  },
  musica: {
    192: '/icons/musica-192.png',
    512: '/icons/musica-512.png',
  },
  idiomas: {
    192: '/icons/idiomas-192.png',
    512: '/icons/idiomas-512.png',
  },
  iaPratica: {
    192: '/icons/ia-pratica-192.png',
    512: '/icons/ia-pratica-512.png',
  },
  bussola: {
    192: '/icons/bussola-192.png',
    512: '/icons/bussola-512.png',
  },
  ferramentaIa: {
    192: '/icons/ferramenta-ia-192.png',
    512: '/icons/ferramenta-ia-512.png',
  },
} as const;

export type AreaSubAppSpec = {
  trackId: TrackId;
  name: string;
  shortName: string;
  startUrl: string;
  scope: string;
  manifestRoute: string;
  icon192: string;
  icon512: string;
};

export const AREA_SUB_APPS: Record<TrackId, AreaSubAppSpec> = {
  'renda-extra': {
    trackId: 'renda-extra',
    name: 'Renda Extra',
    shortName: 'Renda Extra',
    startUrl: '/programas',
    scope: '/programas',
    manifestRoute: '/programas/manifest.webmanifest',
    icon192: APP_ICONS.rendaExtra[192],
    icon512: APP_ICONS.rendaExtra[512],
  },
  musica: {
    trackId: 'musica',
    name: 'Música',
    shortName: 'Música',
    startUrl: '/musica/naipe_cordas',
    scope: '/musica',
    manifestRoute: '/musica/manifest.webmanifest',
    icon192: APP_ICONS.musica[192],
    icon512: APP_ICONS.musica[512],
  },
  'idiomas-ia': {
    trackId: 'idiomas-ia',
    name: 'Idiomas',
    shortName: 'Idiomas',
    startUrl: '/blog/aprender/ingles',
    scope: '/blog/aprender',
    manifestRoute: '/blog/aprender/manifest.webmanifest',
    icon192: APP_ICONS.idiomas[192],
    icon512: APP_ICONS.idiomas[512],
  },
  'ia-completa': {
    trackId: 'ia-completa',
    name: 'IA na Prática',
    shortName: 'IA na Prática',
    startUrl: '/ia',
    scope: '/ia',
    manifestRoute: '/ia/manifest.webmanifest',
    icon192: APP_ICONS.iaPratica[192],
    icon512: APP_ICONS.iaPratica[512],
  },
} as const;
