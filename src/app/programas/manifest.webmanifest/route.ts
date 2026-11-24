import { NextResponse } from 'next/server';
import { AREA_SUB_APPS } from '@/config/app-brand';

const RENDA_EXTRA_APP = AREA_SUB_APPS['renda-extra'];

export function GET(): NextResponse {
  return new NextResponse(
    JSON.stringify({
      name: RENDA_EXTRA_APP.name,
      short_name: RENDA_EXTRA_APP.shortName,
      description: 'Oportunidades reais e guias práticos para ganhar renda pela internet.',
      start_url: RENDA_EXTRA_APP.startUrl,
      scope: RENDA_EXTRA_APP.scope,
      display: 'standalone',
      background_color: '#090b10',
      theme_color: '#c2410c',
      lang: 'pt-BR',
      icons: [
        { src: RENDA_EXTRA_APP.icon192, sizes: '192x192', type: 'image/png' },
        { src: RENDA_EXTRA_APP.icon512, sizes: '512x512', type: 'image/png' },
      ],
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/manifest+json; charset=utf-8',
      },
    },
  );
}
