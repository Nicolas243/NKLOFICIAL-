'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTransition, useState, useEffect } from 'react';

type StringItem = {
  id: string;
  name: string;
  qualityLevel: string | null;
  realPrice: string | null;
  communityScore: string | null;
  responseSpeed: string | null;
  projection: string | null;
  soundColor: string | null;
};

export function CatalogClient({ initialData, initialQuery }: { initialData: StringItem[], initialQuery: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(initialQuery);

  useEffect(() => {
    const debounce = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchTerm) {
        params.set('q', searchTerm);
      } else {
        params.delete('q');
      }
      
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchTerm, pathname, router, searchParams]);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <aside className="w-full md:w-80 flex-shrink-0 p-6 bg-surface border border-border rounded-lg h-fit">
        <h2 className="font-playfair text-xl mb-4 border-b border-border pb-2">Filtros</h2>
        <input
          type="text"
          placeholder="Buscar modelo..."
          className="w-full p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {isPending && <p className="text-xs text-neon mt-2 animate-pulse">Buscando...</p>}
      </aside>

      <section className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {initialData.map((item) => (
          <article key={item.id} className="p-6 bg-surface border border-border rounded-lg hover:border-neon transition-colors">
            <h3 className="font-playfair font-bold text-lg mb-2">
              <Link href={`/catalogo/${item.id}`} className="hover:text-neon transition-colors">
                {item.name}
              </Link>
            </h3>
            <div className="flex justify-between text-sm opacity-80 mb-4">
              <span>Nível: {item.qualityLevel || 'N/A'}</span>
              <span>Nota: {item.communityScore || 'N/A'}</span>
            </div>
            <div className="text-neon font-bold">
              {item.realPrice ? `R$ ${item.realPrice}` : 'Preço Indisponível'}
            </div>
          </article>
        ))}
        {initialData.length === 0 && (
          <p className="col-span-full text-center opacity-60 py-8">Nenhuma corda encontrada no banco de dados.</p>
        )}
      </section>
    </div>
  );
}