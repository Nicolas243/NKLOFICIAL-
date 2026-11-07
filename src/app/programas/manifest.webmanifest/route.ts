import { NextResponse } from 'next/server';
import { INCOME_PORTAL_ROUTES } from '@/lib/income-portal';

export function GET(): NextResponse {
  return NextResponse.json({
    name: 'Portal NKL · Renda Extra',
    short_name: 'NKL Renda Extra',
    description: 'O catálogo editorial de oportunidades de renda extra do Portal NKL.',
    start_url: INCOME_PORTAL_ROUTES.catalog,
    scope: INCOME_PORTAL_ROUTES.catalog,
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
