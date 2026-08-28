import { getStringsCatalog } from '@/actions/strings';
import { CatalogClient } from './catalog-client';

export const metadata = {
  title: 'Catálogo de Cordas | Portal NKL',
};

export default async function CatalogoPage() {
  // Primeiro paint vem do servidor (sem filtros); o drill-down de filtros
  // acontece no cliente acionando a Server Action de forma assíncrona.
  const catalogData = await getStringsCatalog();

  return (
    <div className="max-w-7xl mx-auto px-4 pt-8">
      <h1 className="font-playfair text-3xl font-bold mb-6">Catálogo Avançado de Cordas</h1>
      <CatalogClient initialData={catalogData} />
    </div>
  );
}