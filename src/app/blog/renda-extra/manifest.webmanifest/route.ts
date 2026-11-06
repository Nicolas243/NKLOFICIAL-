import { NextResponse } from 'next/server';

export function GET(): NextResponse {
  return NextResponse.json({
    name: 'Portal NKL · Renda Extra',
    short_name: 'NKL Renda Extra',
    description: 'O catálogo editorial de oportunidades de renda extra do Portal NKL.',
    start_url: '/blog/renda-extra',
    scope: '/blog/renda-extra',
    display: 'standalone',
    background_color: '#f7f8fa',
    theme_color: '#f97316',
    lang: 'pt-BR',
    icons: [
      { src: '/nkl.png', sizes: '192x192', type: 'image/png' },
      { src: '/nkl.png', sizes: '512x512', type: 'image/png' },
    ],
  });
}
