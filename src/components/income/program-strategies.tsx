'use client';

import { getProgramStrategies, type PartnerStrategy } from '@/lib/partner-strategies';

type Props = {
  slug: string;
  category: string;
  tags: string[];
  compact?: boolean;
  defaultOpen?: boolean;
};

function StrategyList({ strategies, compact }: { strategies: PartnerStrategy[]; compact: boolean }) {
  return (
    <div className={compact ? 'mt-3 space-y-2' : 'mt-4 grid gap-3 md:grid-cols-3'}>
      {strategies.map((strategy) => (
        <details key={strategy.title} className="rounded-lg border border-border bg-background/45 px-3 py-2">
          <summary className="cursor-pointer text-sm font-bold leading-relaxed">{strategy.title}</summary>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed opacity-80">
            {strategy.steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </details>
      ))}
    </div>
  );
}

export function ProgramStrategies({ slug, category, tags, compact = false, defaultOpen = false }: Props) {
  const strategies = getProgramStrategies({ slug, category, tags });
  if (!strategies) return null;

  return (
    <div
      className={compact
        ? 'rounded-lg border border-neon/25 bg-neon/5 p-3'
        : 'rounded-xl border border-neon/25 bg-neon/5 p-5'}
      onClick={(event) => {
        if (compact) event.stopPropagation();
      }}
      onKeyDown={(event) => {
        if (compact) event.stopPropagation();
      }}
    >
      <details open={defaultOpen}>
        <summary className="cursor-pointer list-none text-sm font-bold text-neon">
          <span className="mr-2 inline-block rounded-full border border-neon/40 px-2 py-0.5 text-[0.68rem] uppercase tracking-[0.14em]">{strategies.length} estratégias</span>
          Formas de operar este modelo
        </summary>
        <StrategyList strategies={strategies} compact={compact} />
      </details>
    </div>
  );
}
