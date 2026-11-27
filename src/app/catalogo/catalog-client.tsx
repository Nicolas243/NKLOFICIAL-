'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import {
  getStringsCatalog,
  type CatalogFilters,
  type CatalogSort,
  type CatalogSortDirection,
} from '@/actions/strings';
import { AffiliateLinks } from '@/components/affiliate-links';

type StringItem = {
  id: string;
  name: string;
  coreMaterial: string | null;
  qualityLevel: string | null;
  priceMin: string | null;
  priceMax: string | null;
  realPrice: string | null;
  communityScore: string | null;
  responseSpeed: string | null;
  projection: string | null;
  soundColor: string | null;
  affiliateLinks: Record<string, string> | null;
};

function formatAveragePrice(item: Pick<StringItem, 'realPrice' | 'priceMin' | 'priceMax'>): string {
  if (item.realPrice) return `R$ ${item.realPrice}`;

  const minimum = item.priceMin ? Number(item.priceMin) : null;
  const maximum = item.priceMax ? Number(item.priceMax) : null;
  if (minimum !== null && maximum !== null && Number.isFinite(minimum) && Number.isFinite(maximum)) {
    return `R$ ${((minimum + maximum) / 2).toFixed(2)}`;
  }
  if (minimum !== null && Number.isFinite(minimum)) return `R$ ${minimum.toFixed(2)}`;
  if (maximum !== null && Number.isFinite(maximum)) return `R$ ${maximum.toFixed(2)}`;
  return 'Consulte as ofertas';
}

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
  const [qualityLevel, setQualityLevel] = useState('');
  const [sort, setSort] = useState<CatalogSort>('name');
  const [direction, setDirection] = useState<CatalogSortDirection>('asc');
  const [perPage, setPerPage] = useState(12);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [items, setItems] = useState<StringItem[]>(initialData);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isFirstRun = useRef(true);
  const router = useRouter();

  useEffect(() => {
    if (!filtersOpen) return;

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') setFiltersOpen(false);
    }
    function handleCloseOverlays(): void {
      setFiltersOpen(false);
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('nkl:close-overlays', handleCloseOverlays);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('nkl:close-overlays', handleCloseOverlays);
      document.body.style.overflow = previousOverflow;
    };
  }, [filtersOpen]);

  // Opções do dropdown extraídas do catálogo completo (não encolhem ao filtrar).
  const materialOptions = Array.from(
    new Set(
      initialData
        .map((item) => item.coreMaterial)
        .filter((material): material is string => material !== null && material.trim() !== '')
    )
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const qualityOptions = Array.from(
    new Set(
      initialData
        .map((item) => item.qualityLevel)
        .filter((level): level is string => level !== null && level.trim() !== '')
    )
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  // Busca aplicando filtros + página corrente. Reutilizável por debounce e
  // pelos botões de paginação (evita duplicação de lógica).
  const fetchPage = (page: number) => {
    const filters: CatalogFilters = {
      query: query.trim() !== '' ? query.trim() : undefined,
      coreMaterial: coreMaterial !== '' ? coreMaterial : undefined,
      qualityLevel: qualityLevel !== '' ? qualityLevel : undefined,
      sort,
      direction,
      minPrice: parseNumberInput(minPrice),
      maxPrice: parseNumberInput(maxPrice),
      page,
      limit: perPage,
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
  }, [query, coreMaterial, qualityLevel, sort, direction, perPage, minPrice, maxPrice]);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    fetchPage(page);
  };

  const clearFilters = () => {
    // Reset de filtros dispara o debounce, que refetcha a página 1.
    setQuery('');
    setCoreMaterial('');
    setQualityLevel('');
    setMinPrice('');
    setMaxPrice('');
    setSort('name');
    setDirection('asc');
    setPerPage(12);
    setCurrentPage(1);
  };

  const activeFilterCount =
    (coreMaterial !== '' ? 1 : 0) +
    (qualityLevel !== '' ? 1 : 0) +
    (minPrice !== '' ? 1 : 0) +
    (maxPrice !== '' ? 1 : 0) +
    (sort !== 'name' ? 1 : 0) +
    (direction !== 'asc' ? 1 : 0) +
    (perPage !== 12 ? 1 : 0);

  const hasActiveFilters = query !== '' || activeFilterCount > 0;

  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      <div className="w-full min-w-0 rounded-2xl border border-border bg-surface p-2.5 md:p-4">
        <div className="flex w-full min-w-0 items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-55" aria-hidden="true" />
            <input
              type="text"
              aria-label="Buscar modelo de corda"
              placeholder="Buscar modelo..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-border bg-background pl-10 pr-9 py-2.5 text-sm outline-none transition-colors focus:border-neon"
            />
            {query.trim() !== '' && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full opacity-70 transition hover:bg-surface hover:opacity-100"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={filtersOpen}
            aria-label="Filtros e ordenação"
            className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors sm:px-4 ${activeFilterCount > 0
              ? 'border-neon bg-neon/15 text-neon hover:bg-neon hover:text-black'
              : 'border-border bg-background hover:border-neon hover:text-neon'
              }`}
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Filtros e ordenação</span>
            <span className="sm:hidden">Filtros</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-neon px-1.5 text-xs font-extrabold text-black">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {(hasActiveFilters || isPending) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {coreMaterial !== '' && (
              <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold">
                Núcleo: {coreMaterial}
              </span>
            )}
            {qualityLevel !== '' && (
              <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold">
                Nível: {qualityLevel}
              </span>
            )}
            {(minPrice !== '' || maxPrice !== '') && (
              <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold">
                Preço: {minPrice || '0'} – {maxPrice || 'máx'}
              </span>
            )}
            {(sort !== 'name' || direction !== 'asc') && (
              <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold">
                Ordem: {sort} ({direction === 'asc' ? 'crescente' : 'decrescente'})
              </span>
            )}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full border border-border px-3 py-1 text-xs font-bold text-neon hover:border-neon hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
          {isPending && <p className="text-xs text-neon animate-pulse">Buscando...</p>}
        </div>
      )}

      {filtersOpen && (
        <div
          className="fixed inset-0 z-[310] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setFiltersOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filtros e ordenação de cordas"
            className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon">Catálogo de Cordas</p>
                <h2 className="mt-1 font-playfair text-2xl font-bold">Filtros e ordenação</h2>
              </div>
              <button
                type="button"
                aria-label="Fechar filtros e ordenação"
                onClick={() => setFiltersOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border opacity-75 transition hover:border-neon hover:opacity-100"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wide opacity-65">Material do Núcleo</span>
                <select
                  value={coreMaterial}
                  onChange={(event) => setCoreMaterial(event.target.value)}
                  className="min-h-11 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-neon"
                >
                  <option value="">Todos</option>
                  {materialOptions.map((material) => (
                    <option key={material} value={material}>
                      {material}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wide opacity-65">Nível</span>
                <select
                  value={qualityLevel}
                  onChange={(event) => setQualityLevel(event.target.value)}
                  className="min-h-11 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-neon"
                >
                  <option value="">Todos</option>
                  {qualityOptions.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wide opacity-65">Ordenar por</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as CatalogSort)}
                  className="min-h-11 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-neon"
                >
                  <option value="name">Nome (A–Z)</option>
                  <option value="score">Melhor nota</option>
                  <option value="price">Preço</option>
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wide opacity-65">Ordem</span>
                <select
                  value={direction}
                  onChange={(event) => setDirection(event.target.value as CatalogSortDirection)}
                  className="min-h-11 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-neon"
                >
                  <option value="asc">Crescente (A–Z / menor)</option>
                  <option value="desc">Decrescente (Z–A / maior)</option>
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wide opacity-65">Preço Mín.</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0"
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                  className="min-h-11 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-neon"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wide opacity-65">Preço Máx.</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="—"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  className="min-h-11 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-neon"
                />
              </label>

              <label className="flex items-center justify-between gap-2 border-t border-border pt-4 text-sm opacity-85 sm:col-span-2">
                <span>Itens por página</span>
                <select
                  value={perPage}
                  onChange={(event) => setPerPage(Number(event.target.value))}
                  className="rounded-xl border border-border bg-background p-2 outline-none focus:border-neon"
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <button
                type="button"
                onClick={clearFilters}
                className="min-h-11 rounded-xl border border-border px-4 py-2 text-sm font-semibold transition hover:border-neon hover:text-neon"
              >
                Limpar filtros
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="min-h-11 rounded-xl bg-neon px-5 py-2 text-sm font-bold text-black transition hover:opacity-90"
              >
                Ver resultados
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="flex-1 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((item) => (
            <article
              key={item.id}
              role="link"
              tabIndex={0}
              onClick={(event) => {
                if ((event.target as HTMLElement).closest('a, button')) return;
                router.push(`/catalogo/${item.id}`);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  router.push(`/catalogo/${item.id}`);
                }
              }}
              className="p-6 bg-surface border border-border rounded-lg hover:border-neon transition-colors flex flex-col gap-4 cursor-pointer"
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
              <div className="flex items-center justify-between mt-auto gap-3">
                <div className="text-neon font-bold">
                  {formatAveragePrice(item)}
                </div>
                <AffiliateLinks links={item.affiliateLinks} productName={item.name} variant="compact" />
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