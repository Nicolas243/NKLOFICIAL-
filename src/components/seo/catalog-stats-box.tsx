import Link from 'next/link';
import type { PartnerProgramCard } from '@/actions/partner-programs';
import { SITE_CONTENT_LAST_MODIFIED } from '@/lib/seo/schema-graph';

export type ProgramCatalogStats = {
  total: number;
  zeroInvestmentCount: number;
  zeroInvestmentPct: number;
  usdCount: number;
  usdPct: number;
  portugueseCount: number;
  portuguesePct: number;
  mobileCount: number;
  mobilePct: number;
  averageRating: number;
  categoryCount: number;
  lastVerifiedIso: string;
};

const USD_PATTERN = /(?:\bUSD\b|US\$|\bd[oó]lar(?:es)?\b)/iu;
const PORTUGUESE_PATTERN = /(?:portugu[eê]s|pt-br|\bpt\b|brasil)/iu;
const MOBILE_PATTERN = /\b(?:celular|mobile|app|android|ios)\b/iu;

function toPercent(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

export function computeProgramCatalogStats(
  programs: PartnerProgramCard[],
): ProgramCatalogStats {
  const total = programs.length;
  let zeroInvestmentCount = 0;
  let usdCount = 0;
  let portugueseCount = 0;
  let mobileCount = 0;
  let ratingSum = 0;
  let maxVerifiedMs = 0;
  const categories = new Set<string>();

  for (const program of programs) {
    if (program.zeroInvestmentRequired) {
      zeroInvestmentCount += 1;
    }

    const payoutText = [
      program.averageEarning,
      program.earningPotential ?? '',
      ...program.paymentMethods,
    ].join(' ');
    if (USD_PATTERN.test(payoutText)) {
      usdCount += 1;
    }

    const hasPortuguese =
      program.languages.some((lang) => PORTUGUESE_PATTERN.test(lang)) ||
      program.tags.some((tag) => PORTUGUESE_PATTERN.test(tag));
    if (hasPortuguese) {
      portugueseCount += 1;
    }

    const mobileText = [
      ...program.tags,
      ...program.requirements,
      program.shortDescription,
    ].join(' ');
    if (MOBILE_PATTERN.test(mobileText)) {
      mobileCount += 1;
    }

    ratingSum += Number.isFinite(program.finalRating) ? program.finalRating : 0;
    if (program.category.trim() !== '') {
      categories.add(program.category.trim());
    }

    if (program.lastVerifiedAt) {
      const parsedMs = Date.parse(program.lastVerifiedAt);
      if (Number.isFinite(parsedMs) && parsedMs > maxVerifiedMs) {
        maxVerifiedMs = parsedMs;
      }
    }
  }

  return {
    total,
    zeroInvestmentCount,
    zeroInvestmentPct: toPercent(zeroInvestmentCount, total),
    usdCount,
    usdPct: toPercent(usdCount, total),
    portugueseCount,
    portuguesePct: toPercent(portugueseCount, total),
    mobileCount,
    mobilePct: toPercent(mobileCount, total),
    averageRating: total === 0 ? 0 : Number((ratingSum / total).toFixed(1)),
    categoryCount: categories.size,
    lastVerifiedIso:
      maxVerifiedMs > 0
        ? new Date(maxVerifiedMs).toISOString()
        : SITE_CONTENT_LAST_MODIFIED,
  };
}

function formatIsoDatePtBr(isoString: string): string {
  const parsed = Date.parse(isoString);
  if (!Number.isFinite(parsed)) return '27/11/2026';
  return new Date(parsed).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function CatalogStatsBox({
  programs,
  title = 'Dados do Levantamento NKL',
  compact = false,
}: {
  programs: PartnerProgramCard[];
  title?: string;
  compact?: boolean;
}) {
  const stats = computeProgramCatalogStats(programs);
  const formattedDate = formatIsoDatePtBr(stats.lastVerifiedIso);

  const metrics = [
    {
      label: 'Sem investimento inicial',
      value: `${stats.zeroInvestmentPct}%`,
      detail: `${stats.zeroInvestmentCount} de ${stats.total} plataformas`,
    },
    {
      label: 'Pagam em dólar (USD)',
      value: `${stats.usdPct}%`,
      detail: `${stats.usdCount} opções com saque internacional`,
    },
    {
      label: 'Acessíveis em português',
      value: `${stats.portuguesePct}%`,
      detail: `${stats.portugueseCount} com fluxo ou suporte PT-BR`,
    },
    {
      label: 'Compatíveis com celular',
      value: `${stats.mobilePct}%`,
      detail: `${stats.mobileCount} utilizáveis via app ou mobile`,
    },
  ];

  return (
    <section
      aria-label={title}
      className={`rounded-2xl border border-border bg-income-surface/85 ${
        compact ? 'p-4 md:p-5' : 'p-5 md:p-6'
      }`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">
            Resumo verificável
          </p>
          <h2 className="mt-1 font-playfair text-xl font-bold text-foreground md:text-2xl">
            {title}
          </h2>
        </div>
        <Link
          href="/metodologia"
          className="inline-flex w-fit items-center rounded-full border border-border px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:border-neon hover:text-neon"
        >
          Ver critérios e metodologia
        </Link>
      </div>

      <p className="mt-3 text-sm leading-relaxed opacity-85">
        No levantamento atualizado em {formattedDate}, o Portal NKL monitora{' '}
        <strong>{stats.total}</strong> oportunidades reais distribuídas em{' '}
        <strong>{stats.categoryCount}</strong> categorias, com nota média de{' '}
        <strong>{stats.averageRating.toFixed(1)}/10</strong>:{' '}
        <strong>{stats.zeroInvestmentPct}%</strong> não exigem capital inicial,{' '}
        <strong>{stats.usdPct}%</strong> remuneram em dólar,{' '}
        <strong>{stats.portuguesePct}%</strong> operam em português e{' '}
        <strong>{stats.mobilePct}%</strong> podem ser executadas pelo celular.
      </p>

      <div
        className={`mt-4 grid gap-3 ${
          compact ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 md:grid-cols-4'
        }`}
      >
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-border bg-income-card/80 p-3.5"
          >
            <p className="text-2xl font-bold text-neon">{metric.value}</p>
            <p className="mt-1 text-xs font-bold text-foreground">
              {metric.label}
            </p>
            {!compact && (
              <p className="mt-0.5 text-xs opacity-65">{metric.detail}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
