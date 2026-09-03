'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getStringsCatalog } from '@/actions/strings';
import { AffiliateLinks } from '@/components/affiliate-links';

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
  durability: string | null;
  environment: string | null;
  climateSensitivity: string | null;
  coating: string | null;
  fixation: string | null;
  arcTolerance: string | null;
  affiliateLinks: Record<string, string> | null;
};

/**
 * Tarefa 7 — todos os quesitos de comparação do comparador.html legado,
 * restaurados a partir das colunas do `strings_catalog` (via ETL).
 */
const CRITERIA: { field: keyof StringItem; label: string }[] = [
  { field: 'qualityLevel', label: 'Nível de Qualidade' },
  { field: 'realPrice', label: 'Preço Real (R$)' },
  { field: 'communityScore', label: 'Nota da Comunidade' },
  { field: 'coreMaterial', label: 'Material do Núcleo' },
  { field: 'soundColor', label: 'Cor do Som' },
  { field: 'responseSpeed', label: 'Velocidade de Resposta' },
  { field: 'projection', label: 'Projeção' },
  { field: 'durability', label: 'Durabilidade' },
  { field: 'environment', label: 'Ambiente' },
  { field: 'climateSensitivity', label: 'Sensibilidade Climática' },
  { field: 'coating', label: 'Revestimento' },
  { field: 'fixation', label: 'Fixação' },
  { field: 'arcTolerance', label: 'Tolerância de Arco' },
];

const STORAGE_KEY = 'nkl-comparar-criterios-ocultos';

function loadHiddenCriteria(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function formatValue(item: StringItem | undefined, field: keyof StringItem): string {
  if (!item) return '—';
  const value = item[field];
  if (value === null || value === undefined || value === '') return '—';
  if (field === 'realPrice') return `R$ ${value}`;
  return String(value);
}

export default function CompararPage() {
  const [items, setItems] = useState<StringItem[]>([]);
  const [stringAId, setStringAId] = useState('');
  const [stringBId, setStringBId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Tarefa 7 — preferência de critérios ocultos persistida em localStorage.
  // Lazy initializer (e não setState em effect): a tabela só renderiza no
  // cliente, depois do fetch, então não há divergência de hidratação.
  const [hiddenCriteria, setHiddenCriteria] = useState<string[]>(loadHiddenCriteria);
  const [filterOpen, setFilterOpen] = useState(false);

  const toggleCriterion = (field: string) => {
    setHiddenCriteria((prev) => {
      const next = prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field];
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage indisponível: a preferência vive só na sessão.
      }
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;

    getStringsCatalog({ page: 1, limit: 100 })
      .then((result) => {
        if (cancelled) return;
        const mapped: StringItem[] = result.data.map((row) => ({
          id: row.id,
          name: row.name,
          coreMaterial: row.coreMaterial,
          qualityLevel: row.qualityLevel,
          realPrice: row.realPrice,
          communityScore: row.communityScore,
          responseSpeed: row.responseSpeed,
          projection: row.projection,
          soundColor: row.soundColor,
          durability: row.durability,
          environment: row.environment,
          climateSensitivity: row.climateSensitivity,
          coating: row.coating,
          fixation: row.fixation,
          arcTolerance: row.arcTolerance,
          affiliateLinks: row.affiliateLinks,
        }));
        setItems(mapped);
        setStringAId(mapped[0]?.id ?? '');
        setStringBId(mapped[1]?.id ?? '');
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar o catálogo de cordas.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const stringA = items.find((item) => item.id === stringAId);
  const stringB = items.find((item) => item.id === stringBId);
  const visibleCriteria = CRITERIA.filter(({ field }) => !hiddenCriteria.includes(field));

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pt-8">
      <h1 className="font-playfair text-3xl font-bold mb-2">Comparar Cordas</h1>
      <p className="text-sm opacity-70 mb-8">
        Selecione duas cordas diferentes para conferir a comparação lado a lado.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        {/* Corda A — com ações (Tarefa 7) */}
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium opacity-80">Corda A</span>
            <select
              value={stringAId}
              onChange={(event) => setStringAId(event.target.value)}
              className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
            >
              {items
                .filter((item) => item.id !== stringBId)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </label>
          <div className="flex items-center gap-3">
            <Link
              href={`/catalogo/${stringAId}`}
              className="inline-flex items-center px-4 py-2 border border-neon text-neon rounded-md font-bold text-sm transition-all hover:bg-neon hover:text-black"
            >
              Avaliar corda
            </Link>
            <AffiliateLinks links={stringA?.affiliateLinks ?? null} variant="compact" />
          </div>
        </div>

        {/* Corda B — com ações (Tarefa 7) */}
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium opacity-80">Corda B</span>
            <select
              value={stringBId}
              onChange={(event) => setStringBId(event.target.value)}
              className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
            >
              {items
                .filter((item) => item.id !== stringAId)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </label>
          <div className="flex items-center gap-3">
            <Link
              href={`/catalogo/${stringBId}`}
              className="inline-flex items-center px-4 py-2 border border-neon text-neon rounded-md font-bold text-sm transition-all hover:bg-neon hover:text-black"
            >
              Avaliar corda
            </Link>
            <AffiliateLinks links={stringB?.affiliateLinks ?? null} variant="compact" />
          </div>
        </div>
      </div>

      {loading && <p className="text-center opacity-60">Carregando catálogo...</p>}
      {error && <p className="text-center text-red-400">{error}</p>}

      {!loading && !error && stringA && stringB && (
        <section className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="px-4 py-3 font-medium opacity-70">
                  <div className="relative inline-flex items-center gap-2">
                    <span>Critério</span>
                    {/* Tarefa 7 — botão Filtrar para ocultar/exibir critérios */}
                    <button
                      type="button"
                      onClick={() => setFilterOpen((v) => !v)}
                      className={`px-2 py-1 text-xs font-bold uppercase tracking-wider rounded-md border transition-all ${
                        filterOpen || hiddenCriteria.length > 0
                          ? 'border-neon text-neon'
                          : 'border-border opacity-70 hover:border-neon hover:text-neon'
                      }`}
                    >
                      Filtrar{hiddenCriteria.length > 0 && ` (${CRITERIA.length - hiddenCriteria.length}/${CRITERIA.length})`}
                    </button>
                    {filterOpen && (
                      <div className="absolute left-0 top-full mt-2 z-20 min-w-[220px] max-h-[320px] overflow-y-auto bg-surface border border-border rounded-lg shadow-xl p-3 flex flex-col gap-2">
                        {CRITERIA.map(({ field, label }) => (
                          <label
                            key={field}
                            className="flex items-center gap-2 text-xs cursor-pointer whitespace-nowrap"
                          >
                            <input
                              type="checkbox"
                              checked={!hiddenCriteria.includes(field)}
                              onChange={() => toggleCriterion(field)}
                              className="accent-[var(--neon)]"
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 font-playfair font-bold text-neon">{stringA.name}</th>
                <th className="px-4 py-3 font-playfair font-bold text-neon">{stringB.name}</th>
              </tr>
            </thead>
            <tbody>
              {visibleCriteria.map(({ field, label }) => (
                <tr key={field} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{label}</td>
                  <td className="px-4 py-3">{formatValue(stringA, field)}</td>
                  <td className="px-4 py-3">{formatValue(stringB, field)}</td>
                </tr>
              ))}
              {visibleCriteria.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center opacity-60">
                    Todos os critérios estão ocultos. Use o botão Filtrar para exibi-los.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      {!loading && !error && (!stringA || !stringB) && items.length >= 2 && (
        <p className="text-center opacity-60 py-8 border border-dashed border-border rounded-lg">
          Selecione duas cordas diferentes para exibir a comparação.
        </p>
      )}

      {!loading && !error && items.length < 2 && (
        <p className="text-center opacity-60 py-8 border border-dashed border-border rounded-lg">
          Não há cordas suficientes no catálogo para comparação.
        </p>
      )}
    </div>
  );
}
