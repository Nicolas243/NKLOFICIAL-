import { NextResponse } from 'next/server';
import { AREA_SUB_APPS } from '@/config/app-brand';

const MUSICA_APP = AREA_SUB_APPS.musica;

export function GET(): NextResponse {
  return new NextResponse(
    JSON.stringify({
      name: MUSICA_APP.name,
      short_name: MUSICA_APP.shortName,
      description: 'Cordas, luthiers, professores e guias práticos para músicos.',
      start_url: MUSICA_APP.startUrl,
      scope: MUSICA_APP.scope,
      display: 'standalone',
      background_color: '#090b10',
      theme_color: '#1d4ed8',
      lang: 'pt-BR',
      icons: [
        { src: MUSICA_APP.icon192, sizes: '192x192', type: 'image/png' },
        { src: MUSICA_APP.icon512, sizes: '512x512', type: 'image/png' },
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
