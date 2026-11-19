'use client';

import Link from 'next/link';
import { ExternalLink, Filter, Search, Share2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  describeMicro1Opportunity,
  formatMicro1Pay,
  getMicro1FilterLabel,
  getMicro1FilterOptions,
  MICRO1_EDITORIAL_USD_BRL_RATE,
  MICRO1_REFERRAL_URL,
  matchesMicro1Filter,
  translateMicro1Title,
  type Micro1Opportunity,
} from '@/lib/micro1-opportunities';

type Props = {
  opportunities: Micro1Opportunity[];
  error?: string | null;
  variant?: 'card' | 'full';
};

function opportunitySearchText(opportunity: Micro1Opportunity): string {
  return [
    opportunity.jobName,
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
  const isCompact = variant === 'card';
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

  const selectedFilterLabel = getMicro1FilterLabel(opportunities, selectedFilter);
  const hasSelection = selectedFilter !== null || query.trim().length > 0;
  const featuredOpportunity = opportunities[0] ?? null;

  async function shareOpportunity(opportunity: Micro1Opportunity): Promise<void> {
    const title = translateMicro1Title(opportunity.jobName);
    const shareData = {
      title: `${title} · Micro1`,
      text: `Encontrei este projeto da Micro1: ${title}.`,
      url: opportunity.applyUrl,
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

  if (error) {
    return (
      <div className={isCompact ? 'rounded-lg border border-amber-300/30 bg-amber-200/5 p-3 text-xs leading-relaxed' : 'rounded-xl border border-amber-300/40 bg-amber-200/10 p-4 text-sm leading-relaxed'}>
        <p className="font-bold">As vagas da Micro1 estão temporariamente indisponíveis.</p>
        <p className="mt-1 opacity-75">Abra o projeto oficial para consultar a lista atualizada.</p>
        <a href={MICRO1_REFERRAL_URL} target="_blank" rel="noopener noreferrer sponsored" className="mt-2 inline-flex font-bold text-neon underline underline-offset-2">
          Abrir Micro1
        </a>
      </div>
    );
  }

  if (!featuredOpportunity) {
    return (
      <div className={isCompact ? 'rounded-lg border border-border bg-background/40 p-3 text-xs opacity-70' : 'rounded-xl border border-border bg-background/40 p-4 text-sm opacity-70'}>
        Nenhuma vaga da Micro1 foi encontrada agora.
      </div>
    );
  }

  const featuredPay = formatMicro1Pay(featuredOpportunity);

  return (
    <div
      className={isCompact ? 'rounded-lg border border-neon/25 bg-background/35 p-3' : 'rounded-2xl border border-border bg-income-surface/80 p-5 md:p-6'}
      data-testid={isCompact ? 'micro1-card-opportunities' : 'micro1-full-opportunities'}
      onClick={(event) => {
        if (isCompact) event.stopPropagation();
      }}
    >
      {shareMessage && <p className="mb-3 text-xs font-bold text-neon" role="status">{shareMessage}</p>}
      {!isCompact && (
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Vagas atuais</p>
          <h2 className="mt-1 font-playfair text-2xl font-bold">Escolha um projeto da Micro1</h2>
          <p className="mt-2 text-sm leading-relaxed opacity-70">A lista é atualizada a partir da fonte pública. Título, pagamento, disponibilidade e aprovação podem mudar.</p>
        </div>
      )}

      <article className={isCompact ? '' : 'rounded-xl border border-border bg-income-card/70 p-4'}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neon">Projeto em destaque</p>
            <h3 className={`mt-1 break-words font-bold ${isCompact ? 'text-base' : 'text-xl'}`}>
              {translateMicro1Title(featuredOpportunity.jobName)}
            </h3>
          </div>
          {featuredOpportunity.highDemand && <span className="shrink-0 rounded-full bg-neon/15 px-2 py-1 text-[10px] font-bold text-neon">Alta demanda</span>}
        </div>
        <p className={`mt-2 leading-relaxed opacity-75 ${isCompact ? 'line-clamp-2 text-xs' : 'text-sm'}`}>
          {describeMicro1Opportunity(featuredOpportunity)}
        </p>
        <p className={`mt-2 font-bold text-neon ${isCompact ? 'text-xs' : 'text-sm'}`}>
          {featuredPay.estimatedBrl ?? featuredPay.original}
          <span className="ml-1 font-normal text-foreground/60">· {featuredOpportunity.jobType ?? 'Projeto remoto'}</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={featuredOpportunity.applyUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-neon px-3 py-2 text-xs font-bold text-black hover:opacity-90"
          >
            Ver projeto
            <ExternalLink size={14} aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={() => void shareOpportunity(featuredOpportunity)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-bold text-neon hover:border-neon"
          >
            <Share2 size={14} aria-hidden="true" />
            Compartilhar
          </button>
        </div>
      </article>

      <div className={`mt-4 grid gap-2 ${isCompact ? 'grid-cols-[1fr_auto]' : 'md:grid-cols-[1fr_auto]'}`}>
        <label className="text-xs">
          <span className="sr-only">Pesquisar vagas da Micro1</span>
          <span className="relative block">
            <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pesquisar vaga..."
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
          {isCompact ? 'Tipos' : `Tipo: ${selectedFilterLabel}`}
        </button>
      </div>
      <p className="mt-2 text-[11px] opacity-55">
        {hasSelection ? `${filteredOpportunities.length} resultado(s)` : `${opportunities.length} vagas atuais · filtro por tipo`}
      </p>

      {isCompact && hasSelection && (
        <div className="mt-3 space-y-2" data-testid="micro1-card-filtered-results">
          {filteredOpportunities.slice(0, 5).map((opportunity) => {
            const pay = formatMicro1Pay(opportunity);
            return (
              <div
                key={opportunity.jobId}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-background/60 p-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold">{translateMicro1Title(opportunity.jobName)}</p>
                  <p className="mt-0.5 text-[11px] font-bold text-neon">{pay.estimatedBrl ?? pay.original}</p>
                </div>
                <a
                  href={opportunity.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded border border-neon px-2.5 py-1 text-[11px] font-bold text-neon hover:bg-neon hover:text-black"
                >
                  Ver
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
              </div>
            );
          })}
          {filteredOpportunities.length === 0 && (
            <p className="py-2 text-xs opacity-65">Nenhuma vaga encontrada com esse filtro.</p>
          )}
          <div className="pt-1">
            <Link
              href="/programas/micro1"
              className="inline-flex text-xs font-bold text-neon underline underline-offset-2 hover:opacity-90"
            >
              {filteredOpportunities.length > 5
                ? `Ver todos os ${filteredOpportunities.length} resultados da Micro1`
                : 'Abrir lista completa da Micro1'}
            </Link>
          </div>
        </div>
      )}

      {!isCompact && hasSelection && (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {filteredOpportunities.map((opportunity) => {
            const pay = formatMicro1Pay(opportunity);
            return (
              <article key={opportunity.jobId} className="rounded-xl border border-border bg-income-card/90 p-4">
                <h3 className="font-bold">{translateMicro1Title(opportunity.jobName)}</h3>
                <p className="mt-2 text-sm leading-relaxed opacity-75">{describeMicro1Opportunity(opportunity)}</p>
                <p className="mt-2 text-sm font-bold text-neon">{pay.estimatedBrl ?? pay.original}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={opportunity.applyUrl} target="_blank" rel="noopener noreferrer sponsored" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-neon px-3 py-2 text-xs font-bold text-black hover:opacity-90">
                    Ver projeto <ExternalLink size={14} aria-hidden="true" />
                  </a>
                  <button type="button" onClick={() => void shareOpportunity(opportunity)} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-bold text-neon hover:border-neon">
                    <Share2 size={14} aria-hidden="true" /> Compartilhar
                  </button>
                </div>
              </article>
            );
          })}
          {filteredOpportunities.length === 0 && <p className="py-6 text-center text-sm opacity-65 lg:col-span-2">Nenhuma vaga encontrada com esse filtro.</p>}
        </div>
      )}

      <p className="mt-4 text-[11px] leading-relaxed opacity-50">
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
                <h2 id="micro1-filter-title" className="mt-1 font-playfair text-2xl font-bold">Filtrar vagas</h2>
                <p className="mt-2 text-sm opacity-70">Escolha uma categoria ou pesquise pelo nome do projeto.</p>
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
                    placeholder="Ex.: software, áudio, médico..."
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
              <div className="mt-5 space-y-2">
                {filteredOpportunities.slice(0, 12).map((opportunity) => (
                  <a key={opportunity.jobId} href={opportunity.applyUrl} target="_blank" rel="noopener noreferrer sponsored" className="block rounded-lg border border-border p-3 hover:border-neon">
                    <span className="block text-sm font-bold">{translateMicro1Title(opportunity.jobName)}</span>
                    <span className="mt-1 block text-xs text-neon">{formatMicro1Pay(opportunity).estimatedBrl ?? formatMicro1Pay(opportunity).original}</span>
                  </a>
                ))}
                {filteredOpportunities.length > 12 && <p className="pt-2 text-center text-xs opacity-60">Mostrando 12 resultados. Refine a pesquisa para encontrar outro projeto.</p>}
                {filteredOpportunities.length === 0 && <p className="py-6 text-center text-sm opacity-65">Nenhuma vaga encontrada.</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
