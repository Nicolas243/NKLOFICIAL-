import { NextResponse } from 'next/server';
import { AREA_SUB_APPS } from '@/config/app-brand';

const IDIOMAS_APP = AREA_SUB_APPS['idiomas-ia'];

export function GET(): NextResponse {
  return new NextResponse(
    JSON.stringify({
      name: IDIOMAS_APP.name,
      short_name: IDIOMAS_APP.shortName,
      description: 'Lições práticas de inglês e trilhas de idiomas com apoio de IA.',
      start_url: IDIOMAS_APP.startUrl,
      scope: IDIOMAS_APP.scope,
      display: 'standalone',
      background_color: '#090b10',
      theme_color: '#065f46',
      lang: 'pt-BR',
      icons: [
        { src: IDIOMAS_APP.icon192, sizes: '192x192', type: 'image/png' },
        { src: IDIOMAS_APP.icon512, sizes: '512x512', type: 'image/png' },
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
