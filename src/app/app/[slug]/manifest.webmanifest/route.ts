import { NextResponse } from 'next/server';
import { APP_ICONS } from '@/config/app-brand';
import { getProductBySlug } from '@/config/products';

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { slug } = await context.params;
  const product = getProductBySlug(slug);

  if (!product || !product.hasStandalonePwa) {
    return NextResponse.json(
      { error: 'manifest_not_available' },
      { status: 404 },
    );
  }

  const icon192 = product.pwaIcon192 ?? APP_ICONS.portal[192];
  const icon512 = product.pwaIcon512 ?? APP_ICONS.portal[512];

  const manifestPayload = {
    name: product.pwaBrandName ?? product.title,
    short_name: product.pwaShortName ?? product.shortName,
    description: product.pwaDescription ?? product.aspirationalLead,
    start_url: `/app/${product.slug}`,
    scope: `/app/${product.slug}`,
    display: 'standalone',
    background_color: '#090b10',
    theme_color: product.pwaThemeColor ?? '#0f1a2c',
    lang: 'pt-BR',
    icons: [
      { src: icon192, sizes: '192x192', type: 'image/png' },
      { src: icon512, sizes: '512x512', type: 'image/png' },
    ],
  };

  return new NextResponse(JSON.stringify(manifestPayload), {
    status: 200,
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
    },
  });
}
