import { getStringsCatalog } from '@/actions/strings';
import { CatalogClient } from './catalog-client';

export const metadata = {
  title: 'Catálogo de Cordas | Portal NKL',
};

export const dynamic = 'force-dynamic';

export default async function CatalogoPage() {
  // Primeiro paint vem do servidor (sem filtros); o drill-down de filtros
  // e a paginação acontecem no cliente acionando a Server Action.
  const catalog = await getStringsCatalog({ page: 1, limit: 100 });

  return (
    <div className="max-w-7xl mx-auto px-4 pt-8">
      <h1 className="font-playfair text-3xl font-bold mb-6">Catálogo Avançado de Cordas</h1>
      <CatalogClient
        initialData={catalog.data}
        initialPage={catalog.currentPage}
        initialTotalPages={catalog.totalPages}
      />
    </div>
  );
}