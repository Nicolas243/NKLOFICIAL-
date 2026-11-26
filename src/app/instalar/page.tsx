import type { Metadata } from 'next';
import { PAID_PRODUCTS, getProductBySlug } from '@/config/products';
import { PORTAL_TRACKS, getTrackById } from '@/config/tracks';
import { APP_BRAND_NAME } from '@/config/app-brand';
import { InstallFunnelClient } from '@/components/funnel/install-funnel-client';
import { absoluteSiteUrl } from '@/lib/site';

type InstalarSearchParams = Promise<{
  trilha?: string;
}>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: InstalarSearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const track = getTrackById(params.trilha) ?? PORTAL_TRACKS[0];

  return {
    title: `Instalar ${APP_BRAND_NAME} · ${track.shortLabel}`,
    description: `Instale o app ${APP_BRAND_NAME} e acompanhe sua trilha de ${track.shortLabel} em 3 passos práticos.`,
    alternates: {
      canonical: absoluteSiteUrl('/instalar'),
    },
  };
}

export default async function InstalarPage({
  searchParams,
}: {
  searchParams: InstalarSearchParams;
}) {
  const params = await searchParams;
  const track = getTrackById(params.trilha) ?? PORTAL_TRACKS[0];
  const recommendedProduct =
    getProductBySlug(track.recommendedProductSlug) ?? PAID_PRODUCTS[0];

  return (
    <div data-recommended-offer={recommendedProduct.slug}>
      <InstallFunnelClient
        initialTrack={track}
        allTracks={PORTAL_TRACKS}
        products={PAID_PRODUCTS}
      />
    </div>
  );
}
