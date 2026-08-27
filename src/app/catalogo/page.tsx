import { getStringsCatalog } from '@/actions/strings';
import { CatalogClient } from './catalog-client';

export const metadata = {
  title: 'Catálogo de Cordas | Portal NKL',
};

type Params = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function CatalogoPage(props: { searchParams: Params }) {
  const searchParams = await props.searchParams;
  const query = typeof searchParams.q === 'string' ? searchParams.q : '';
  
  const catalogData = await getStringsCatalog(query);

  return (
    <div className="max-w-7xl mx-auto px-4 pt-8">
      <h1 className="font-playfair text-3xl font-bold mb-6">Catálogo Avançado de Cordas</h1>
      <CatalogClient initialData={catalogData} initialQuery={query} />
    </div>
  );
}