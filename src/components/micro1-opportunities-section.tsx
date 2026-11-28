'use client';

import { Filter, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DraggableProjectList } from '@/components/income/draggable-project-list';
import {
  formatMicro1CompactSummary,
  formatMicro1Pay,
  getMicro1FilterLabel,
  getMicro1FilterOptions,
  MICRO1_EDITORIAL_USD_BRL_RATE,
  MICRO1_REFERRAL_URL,
  matchesMicro1Filter,
  translateMicro1Title,
  type Micro1Opportunity,
} from '@/lib/micro1-opportunities';
import type { CompactProjectItem } from '@/lib/multi-project-programs';

type Props = {
  opportunities: Micro1Opportunity[];
  error?: string | null;
  variant?: 'card' | 'full';
};

function opportunitySearchText(opportunity: Micro1Opportunity): string {
  return [
    opportunity.jobName,
    translateMicro1Title(opportunity.jobName),
    formatMicro1CompactSummary(opportunity),
    opportunity.domainSlug,
    opportunity.roleType ?? '',
    opportunity.jobType ?? '',
    ...opportunity.skills,
  ].join(' ').toLocaleLowerCase('pt-BR');
}

export function Micro1OpportunitiesSection({
  opportunities,
  error = null,
  variant = 'full',
}: Props) {
  const filterOptions = useMemo(() => getMicro1FilterOptions(opportunities), [opportunities]);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isFilterOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFilterOpen(false);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFilterOpen]);

  const filteredOpportunities = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    return opportunities.filter((opportunity) => {
      const searchText = opportunitySearchText(opportunity);
      return (!selectedFilter || matchesMicro1Filter(opportunity, selectedFilter))
        && (!normalizedQuery || searchText.includes(normalizedQuery));
    });
  }, [opportunities, query, selectedFilter]);

  const compactItems: CompactProjectItem[] = useMemo(
    () =>
      filteredOpportunities.map((opportunity) => {
        const pay = formatMicro1Pay(opportunity);
        return {
          id: opportunity.jobId,
          summaryPtBr: formatMicro1CompactSummary(opportunity),
          payLabel: pay.estimatedBrl ?? pay.original,
          href: opportunity.applyUrl,
          trackingId: `micro1-${opportunity.jobId}`,
          shareUrl: opportunity.applyUrl,
        };
      }),
    [filteredOpportunities],
  );

  const selectedFilterLabel = getMicro1FilterLabel(opportunities, selectedFilter);

  async function shareProjectItem(item: CompactProjectItem): Promise<void> {
    const shareData = {
      title: `${item.summaryPtBr} · Micro1`,
      text: `Encontrei este projeto na Micro1 (${item.payLabel}): ${item.summaryPtBr}.`,
      url: item.shareUrl ?? item.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        setShareMessage('Projeto e link copiados.');
      }
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === 'AbortError') return;
      setShareMessage('Não foi possível compartilhar agora.');
    }

    window.setTimeout(() => setShareMessage(null), 2600);
  }

  function chooseFilter(filterSlug: string | null): void {
    setSelectedFilter(filterSlug);
    setIsFilterOpen(false);
  }

  if (variant === 'card') {
    return (
      <p
        className="rounded-lg border border-neon/25 bg-neon/5 px-3 py-2 text-xs font-semibold text-neon"
        data-testid="micro1-card-hint"
      >
        {opportunities.length > 0
          ? `${opportunities.length} serviços e projetos disponíveis em várias áreas`
          : 'Vários serviços e projetos disponíveis na plataforma'}
      </p>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-300/40 bg-amber-200/10 p-4 text-sm leading-relaxed">
        <p className="font-bold">Os projetos da Micro1 estão temporariamente indisponíveis.</p>
        <p className="mt-1 opacity-75">Abra o portal oficial para consultar a lista atualizada.</p>
        <a
          href={MICRO1_REFERRAL_URL}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="mt-2 inline-flex font-bold text-neon underline underline-offset-2"
        >
          Abrir Micro1
        </a>
      </div>
    );
  }

  if (opportunities.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-background/40 p-4 text-sm opacity-70">
        Nenhum projeto da Micro1 foi encontrado agora.
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border border-border bg-income-surface/80 p-4 md:p-6"
      data-testid="micro1-full-opportunities"
    >
      {shareMessage && <p className="mb-3 text-xs font-bold text-neon" role="status">{shareMessage}</p>}

      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Projetos em português</p>
        <h2 className="mt-1 font-playfair text-2xl font-bold">Escolha um projeto da Micro1</h2>
        <p className="mt-1.5 text-sm leading-relaxed opacity-70">
          Lista traduzida para português com vagas atualizadas da fonte pública. Arraste ou role para explorar todas as frentes.
        </p>
      </div>

      <div className="mb-3 grid gap-2 md:grid-cols-[1fr_auto]">
        <label className="text-xs">
          <span className="sr-only">Pesquisar projetos da Micro1</span>
          <span className="relative block">
            <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pesquisar projeto ou área..."
              className="min-h-10 w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 outline-none focus:border-neon"
            />
          </span>
        </label>
        <button
          type="button"
          onClick={() => setIsFilterOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isFilterOpen}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-neon px-3 py-2 text-xs font-bold text-neon hover:bg-neon hover:text-black"
        >
          <Filter size={15} aria-hidden="true" />
          <span>{`Tipo: ${selectedFilterLabel}`}</span>
        </button>
      </div>

      <DraggableProjectList
        items={compactItems}
        onShareItem={shareProjectItem}
        emptyMessage="Nenhum projeto encontrado com esse filtro."
        testId="micro1-draggable-list"
      />

      <p className="mt-3 text-[11px] leading-relaxed opacity-55">
        Conversão ilustrativa: US$ 1 = R$ {MICRO1_EDITORIAL_USD_BRL_RATE.toFixed(2).replace('.', ',')}. O valor real depende das regras da Micro1 e da aprovação no projeto.
      </p>

      {isFilterOpen && (
        <div
          className="fixed inset-0 z-[270] flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="micro1-filter-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsFilterOpen(false);
          }}
        >
          <div className="flex max-h-[min(84vh,44rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-neon/40 bg-income-surface shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon">Micro1</p>
                <h2 id="micro1-filter-title" className="mt-1 font-playfair text-2xl font-bold">Filtrar projetos</h2>
                <p className="mt-2 text-sm opacity-70">Escolha uma especialidade ou pesquise pelo tipo de trabalho.</p>
              </div>
              <button type="button" onClick={() => setIsFilterOpen(false)} className="rounded-md p-2 opacity-70 hover:bg-background hover:opacity-100" aria-label="Fechar filtro de oportunidades">
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto p-4">
              <label className="text-sm">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide opacity-60">Pesquisar</span>
                <span className="relative block">
                  <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Ex.: direito, áudio, médico, código..."
                    className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 outline-none focus:border-neon"
                  />
                </span>
              </label>
              <div className="mt-4 grid gap-2">
                <button type="button" onClick={() => chooseFilter(null)} className={`flex min-h-11 items-center justify-between rounded-lg border px-4 py-2 text-left text-sm font-bold ${selectedFilter === null ? 'border-neon bg-neon text-black' : 'border-border hover:border-neon'}`}>
                  <span>Todas</span>
                  <span>{opportunities.length}</span>
                </button>
                {filterOptions.map((option) => (
                  <button key={option.slug} type="button" onClick={() => chooseFilter(option.slug)} className={`flex min-h-11 items-center justify-between rounded-lg border px-4 py-2 text-left text-sm font-bold ${selectedFilter === option.slug ? 'border-neon bg-neon text-black' : 'border-border hover:border-neon'}`}>
                    <span>{option.label}</span>
                    <span>{option.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
