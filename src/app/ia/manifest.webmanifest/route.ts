import { NextResponse } from 'next/server';
import { AREA_SUB_APPS } from '@/config/app-brand';

const IA_APP = AREA_SUB_APPS['ia-completa'];

export function GET(): NextResponse {
  return new NextResponse(
    JSON.stringify({
      name: IA_APP.name,
      short_name: IA_APP.shortName,
      description: 'Aprenda a usar inteligência artificial no trabalho e nos estudos.',
      start_url: IA_APP.startUrl,
      scope: IA_APP.scope,
      display: 'standalone',
      background_color: '#090b10',
      theme_color: '#4338ca',
      lang: 'pt-BR',
      icons: [
        { src: IA_APP.icon192, sizes: '192x192', type: 'image/png' },
        { src: IA_APP.icon512, sizes: '512x512', type: 'image/png' },
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
