'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { getStringsCatalog, type CatalogFilters } from '@/actions/strings';

type StringItem = {
  id: string;
  name: string;
  coreMaterial: string | null;
  qualityLevel: string | null;
  realPrice: string | null;
  communityScore: string | null;
  responseSpeed: string | null;
  projection: string | null;
  soundColor: string | null;
};

function parseNumberInput(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const parsed = Number(value.replace(',', '.'));
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function CatalogClient({
  initialData,
  initialPage,
  initialTotalPages,
}: {
  initialData: StringItem[];
  initialPage: number;
  initialTotalPages: number;
}) {
  const [query, setQuery] = useState('');
  const [coreMaterial, setCoreMaterial] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [items, setItems] = useState<StringItem[]>(initialData);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [isPending, startTransition] = useTransition();
  const isFirstRun = useRef(true);

  // Opções do dropdown extraídas do catálogo completo (não encolhem ao filtrar).
  const materialOptions = Array.from(
    new Set(
      initialData
        .map((item) => item.coreMaterial)
        .filter((material): material is string => material !== null && material.trim() !== '')
    )
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  // Busca aplicando filtros + página corrente. Reutilizável por debounce e
  // pelos botões de paginação (evita duplicação de lógica).
  const fetchPage = (page: number) => {
    const filters: CatalogFilters = {
      query: query.trim() !== '' ? query.trim() : undefined,
      coreMaterial: coreMaterial !== '' ? coreMaterial : undefined,
      minPrice: parseNumberInput(minPrice),
      maxPrice: parseNumberInput(maxPrice),
      page,
      limit: 12,
    };

    startTransition(async () => {
      try {
        const result = await getStringsCatalog(filters);
        setItems(result.data);
        setCurrentPage(result.currentPage);
        setTotalPages(result.totalPages);
      } catch {
        // Falha de comunicação: mantém o último resultado válido em tela.
      }
    });
  };

  useEffect(() => {
    // Debounce nativo (setTimeout + cleanup): evita disparar a action a cada tecla.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return; // o primeiro paint já vem do servidor (initialData sem filtros)
    }

    // Mudança de filtro reinicia para a primeira página, exceto se o `startPageRef`
    // indicar navegação de paginação (gera um efeito separado via goToPage).
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      fetchPage(1);
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, coreMaterial, minPrice, maxPrice]);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    fetchPage(page);
  };

  const clearFilters = () => {
    // Reset de filtros dispara o debounce, que refetcha a página 1.
    setQuery('');
    setCoreMaterial('');
    setMinPrice('');
    setMaxPrice('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    query !== '' || coreMaterial !== '' || minPrice !== '' || maxPrice !== '';

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <aside className="w-full md:w-80 flex-shrink-0 p-6 bg-surface border border-border rounded-lg h-fit">
        <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
          <h2 className="font-playfair text-xl">Filtros</h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-bold uppercase tracking-wider text-neon hover:underline"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Buscar modelo..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
          />

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium opacity-80">Material do Núcleo</span>
            <select
              value={coreMaterial}
              onChange={(event) => setCoreMaterial(event.target.value)}
              className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
            >
              <option value="">Todos</option>
              {materialOptions.map((material) => (
                <option key={material} value={material}>
                  {material}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium opacity-80">Preço Mín.</span>
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="0"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium opacity-80">Preço Máx.</span>
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="—"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
              />
            </label>
          </div>

          {isPending && <p className="text-xs text-neon animate-pulse">Buscando...</p>}
        </div>
      </aside>

      <section className="flex-1 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((item) => (
            <article
              key={item.id}
              className="p-6 bg-surface border border-border rounded-lg hover:border-neon transition-colors"
            >
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
          {items.length === 0 && !isPending && (
            <p className="col-span-full text-center opacity-60 py-8 border border-dashed border-border rounded-lg">
              Nenhuma corda encontrada para estes filtros.
            </p>
          )}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1 || isPending}
              className="px-4 py-2 text-sm font-bold border border-border rounded-md transition-all hover:border-neon hover:text-neon disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <span className="text-sm opacity-70">
              Página {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages || isPending}
              className="px-4 py-2 text-sm font-bold border border-border rounded-md transition-all hover:border-neon hover:text-neon disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Próxima →
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}