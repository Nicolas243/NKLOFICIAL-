'use client';

import { useRouter } from 'next/navigation';

const CATEGORIES = [
  { key: 'todos', label: 'Todos' },
  { key: 'violino', label: '🎻 Violino' },
  { key: 'viola', label: '🎵 Viola' },
  { key: 'cello', label: '🎼 Cello' },
] as const;

export function RecommendedClient({ categoria }: { categoria: string }) {
  const router = useRouter();

  const handleFilter = (c: string): void => {
    const qs = c === 'todos' ? '' : `?categoria=${c}`;
    router.push(`/recomendados${qs}`);
  };

  return (
    <div className="flex gap-2 justify-center flex-wrap">
      {CATEGORIES.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => handleFilter(key)}
          className={`px-5 py-2 text-sm font-bold rounded-md border transition-all ${
            categoria === key
              ? 'bg-neon text-black border-neon'
              : 'border-border hover:border-neon hover:text-neon'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}