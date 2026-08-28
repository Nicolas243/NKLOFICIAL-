'use client';

import { useEffect, useState } from 'react';
import { getStringsCatalog } from '@/actions/strings';

type StringItem = {
  id: string;
  name: string;
  qualityLevel: string | null;
  realPrice: string | null;
  communityScore: string | null;
  responseSpeed: string | null;
  projection: string | null;
};

const CRITERIA: { field: keyof StringItem; label: string }[] = [
  { field: 'qualityLevel', label: 'Nível de Qualidade' },
  { field: 'realPrice', label: 'Preço Real (R$)' },
  { field: 'communityScore', label: 'Nota da Comunidade' },
  { field: 'responseSpeed', label: 'Velocidade de Resposta' },
  { field: 'projection', label: 'Projeção' },
];

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

  useEffect(() => {
    let cancelled = false;

    getStringsCatalog({ page: 1, limit: 100 })
      .then((result) => {
        if (cancelled) return;
        const mapped: StringItem[] = result.data.map((row) => ({
          id: row.id,
          name: row.name,
          qualityLevel: row.qualityLevel,
          realPrice: row.realPrice,
          communityScore: row.communityScore,
          responseSpeed: row.responseSpeed,
          projection: row.projection,
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

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pt-8">
      <h1 className="font-playfair text-3xl font-bold mb-2">Comparar Cordas</h1>
      <p className="text-sm opacity-70 mb-8">
        Selecione duas cordas diferentes para conferir a comparação lado a lado.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
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
      </div>

      {loading && <p className="text-center opacity-60">Carregando catálogo...</p>}
      {error && <p className="text-center text-red-400">{error}</p>}

      {!loading && !error && stringA && stringB && (
        <section className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="px-4 py-3 font-medium opacity-70">Critério</th>
                <th className="px-4 py-3 font-playfair font-bold text-neon">{stringA.name}</th>
                <th className="px-4 py-3 font-playfair font-bold text-neon">{stringB.name}</th>
              </tr>
            </thead>
            <tbody>
              {CRITERIA.map(({ field, label }) => (
                <tr key={field} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{label}</td>
                  <td className="px-4 py-3">{formatValue(stringA, field)}</td>
                  <td className="px-4 py-3">{formatValue(stringB, field)}</td>
                </tr>
              ))}
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