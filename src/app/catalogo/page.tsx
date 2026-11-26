import type { Metadata } from 'next';
import { getStringsCatalog } from '@/actions/strings';
import { CatalogClient } from './catalog-client';
import { AdBanner } from '@/components/ads/ad-banner';
import { absoluteSiteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Catálogo de Cordas',
  description: 'Explore e filtre encordoamentos para violino por núcleo, projeção, brilho, durabilidade e avaliações da comunidade.',
  alternates: { canonical: absoluteSiteUrl('/catalogo') },
};

export const dynamic = 'force-dynamic';

export default async function CatalogoPage() {
  // Primeiro paint vem do servidor (sem filtros); o drill-down de filtros
  // e a paginação acontecem no cliente acionando a Server Action.
  const catalog = await getStringsCatalog({ page: 1, limit: 100 });

  return (
    <div className="max-w-7xl mx-auto px-4 pt-8">
      <h1 className="font-playfair text-3xl font-bold mb-6">Catálogo Avançado de Cordas</h1>
      <div className="mb-8">
        <AdBanner placement="in-feed" />
      </div>
      <CatalogClient
        initialData={catalog.data}
        initialPage={catalog.currentPage}
        initialTotalPages={catalog.totalPages}
      />
    </div>
  );
}