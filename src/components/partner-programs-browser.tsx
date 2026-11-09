'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { Fragment, useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { BellPlus, CalendarPlus, Share2 } from 'lucide-react';
import type { PartnerProgramCard } from '@/actions/partner-programs';
import { submitPartnerReview, submitPartnerSuggestion } from '@/actions/partner-programs';
import { ClipboardCopy } from '@/components/ui/clipboard-copy';
import { Pagination } from '@/components/ui/pagination';
import { OutboundLink } from '@/components/ui/outbound-link';
import { PartnerReferralLeadModal } from '@/components/partner-referral-lead-modal';
import { NativeAdCard } from '@/components/income/native-ad-card';
import { ProgramFirstWithdrawal } from '@/components/income/program-first-withdrawal';
import { ProgramSecondaryOffer } from '@/components/income/program-secondary-offer';
import { ProgramStrategies } from '@/components/income/program-strategies';
import { SmartTagList } from '@/components/income/smart-tag-list';
import { SocialEmbed } from '@/components/video/social-embed';
import { comparePartnerProgramRelevance } from '@/lib/partner-program-sorting';

type Props = {
  programs: PartnerProgramCard[];
  initialObjective?: string;
  initialCurrency?: string;
  initialEnglish?: string;
};

const REVIEW_TAG_GROUPS = [
  {
    label: 'Características gerais',
    tags: ['fácil', 'médio', 'difícil', 'exige experiência'],
  },
  {
    label: 'Pontos positivos',
    tags: ['boa remuneração', 'flexível', 'pagamento pontual', 'suporte eficiente', 'cadastro simples', 'tarefas interessantes', 'boa oferta de tarefas'],
  },
  {
    label: 'Pontos negativos',
    tags: ['baixa remuneração', 'poucas tarefas disponíveis', 'pagamento atrasado', 'suporte ruim', 'cadastro demorado', 'requisitos confusos', 'tarefas repetitivas'],
  },
];
const PROGRAMS_PER_PAGE = 9;
const DISCOVERY_TAGS = [
  { label: 'Gravar vídeos em casa', slugs: ['apphub', 'billo', 'joinbrands', 'hub', 'flambra', 'amazon-influencer', 'sideshift'] },
  { label: 'Ganhar sem fazer nada', slugs: ['honeygain'] },
  { label: 'Ganhar com pesquisas', slugs: ['prolific', 'dataannotation', 'crowdato'] },
  { label: 'Testar apps e sites', slugs: ['aligner', 'utest', 'testlio'] },
  { label: 'Vender serviços', slugs: ['fiverr', 'upwork'] },
  { label: 'Ganhar indicando', slugs: ['mercado-pago', 'marketplaces-afiliados', 'hotmart', 'sideshift', 'quintoandar-indica-ai'] },
  { label: 'Renda extra pelo celular', slugs: ['mercado-pago', 'honeygain', 'clickworker', 'oneforma', 'sideshift'] },
  { label: 'Renda extra sem investimento', slugs: ['prolific', 'honeygain', 'apphub', 'clickworker', 'oneforma', 'dataannotation', 'crowdato', 'outlier-ai', 'utest', 'testlio', 'claru-ia', 'quintoandar-indica-ai'] },
];

type FormState = {
  error: string | null;
  success: boolean;
};

const INITIAL_FORM_STATE: FormState = { error: null, success: false };

function actionErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.includes('Muitas tentativas')) {
    return 'Muitas tentativas. Tente novamente em 1 minuto.';
  }
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação. Tente novamente.';
}

async function submitSuggestionAction(_state: FormState, formData: FormData): Promise<FormState> {
  try {
    await submitPartnerSuggestion(formData);
    return { error: null, success: true };
  } catch (error) {
    return { error: actionErrorMessage(error), success: false };
  }
}

async function submitReviewAction(_state: FormState, formData: FormData): Promise<FormState> {
  try {
    await submitPartnerReview(formData);
    return { error: null, success: true };
  } catch (error) {
    return { error: actionErrorMessage(error), success: false };
  }
}

function SubmitButton({ idleLabel, pendingLabel }: { idleLabel: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className="rounded-md bg-neon px-5 py-3 font-bold text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-50">
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

function extractReferralCode(description: string): string | null {
  const match = description.match(/(?:código|codigo)\s+(?:de\s+indicação|de\s+indicacao)?\s*[:\-]?\s*[`'"]?([A-Z0-9]{6,})/iu);
  return match?.[1] ?? null;
}

function earningValue(value: string): number {
  const match = value.match(/\d+(?:[.,]\d+)?/u);
  return match ? Number(match[0].replace(',', '.')) : 0;
}

function ProgramLogo({ program }: { program: PartnerProgramCard }) {
  const [failed, setFailed] = useState(false);
  const needsWhiteBackground = ['claru-ia', 'crowdato', 'oneforma', 'joinbrands'].includes(program.slug);

  return program.logoUrl && !failed ? (
    <img
      src={program.logoUrl}
      alt={`Logo ${program.name}`}
      className={`h-full w-full rounded-md object-contain ${needsWhiteBackground ? 'bg-white' : ''}`}
      onError={() => setFailed(true)}
    />
  ) : (
    <span className="text-sm font-bold">{program.name.slice(0, 2).toUpperCase()}</span>
  );
}

const MARKETPLACE_AFFILIATE_LINKS = [
  { name: 'Mercado Livre', href: 'https://www.mercadolivre.com.br/l/afiliados-home' },
  { name: 'Shopee', href: 'https://affiliate.shopee.com.br/' },
  { name: 'Amazon Associados', href: 'https://associados.amazon.com.br/' },
  { name: 'Influenciador Magalu', href: 'https://www.magazinevoce.com.br/' },
  { name: 'AliExpress Portals', href: 'https://portals.aliexpress.com/' },
  { name: 'Shein', href: 'https://affiliate.shein.com/' },
  { name: 'eBay Partner Network', href: 'https://partnernetwork.ebay.com/' },
  { name: 'Temu', href: 'https://www.temu.com/affiliate_recruit.html' },
  { name: 'Etsy Affiliates', href: 'https://www.etsy.com/affiliates' },
  { name: 'Walmart Affiliates', href: 'https://affiliates.walmart.com/' },
];

const CLARU_PARTNER_URL = 'https://app.claru.ai/signup?ref=yzv3jv9q&mode=partner';
const ALIGNERR_PROJECTS = [
  {
    title: 'Senior Software Engineer',
    href: 'https://app.alignerr.com/signin?referral-code=5b904321-66d0-4369-bf89-5b230408747a&program=b7f918c0-4ef7-11f1-9dec-3d76718b1a77&referralJobId=f1cb2304-8108-48bc-8ae7-f6143ef59ffe',
  },
  {
    title: 'Senior Software Engineer — AI Evaluation & Benchmarks',
    href: 'https://app.alignerr.com/signin?referral-code=5b904321-66d0-4369-bf89-5b230408747a&program=b7f918c0-4ef7-11f1-9dec-3d76718b1a77&referralJobId=952ca34f-ddf2-4cbf-8ac2-bdc3750f628c',
  },
  {
    title: 'Senior Software Engineer — Agentic Coding',
    href: 'https://app.alignerr.com/signin?referral-code=5b904321-66d0-4369-bf89-5b230408747a&program=b7f918c0-4ef7-11f1-9dec-3d76718b1a77&referralJobId=f4b9a0e2-e6c2-4388-b01d-b7655b313d9b',
  },
];
export function PartnerProgramsBrowser({ programs, initialObjective, initialCurrency, initialEnglish }: Props) {
  const [suggestionState, suggestionAction] = useActionState(submitSuggestionAction, INITIAL_FORM_STATE);
  const [reviewState, reviewAction] = useActionState(submitReviewAction, INITIAL_FORM_STATE);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('todas');
  const [difficulty, setDifficulty] = useState('todas');
  const [sort, setSort] = useState('relevancia');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedProgram, setSelectedProgram] = useState<PartnerProgramCard | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDiscoveryTag, setSelectedDiscoveryTag] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [expandedDescriptionSlugs, setExpandedDescriptionSlugs] = useState<string[]>([]);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [reminderProgram, setReminderProgram] = useState<PartnerProgramCard | null>(null);
  const [reminderFrequency, setReminderFrequency] = useState<'daily' | 'weekdays' | 'weekly'>('daily');
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeDialog = selectedProgram ?? reminderProgram;
    if (!activeDialog) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'));
    focusable()[0]?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setSelectedProgram(null);
        setReminderProgram(null);
        return;
      }

      if (event.key !== 'Tab') return;
      const elements = focusable();
      if (elements.length === 0) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [selectedProgram, reminderProgram]);

  const categories = useMemo(
    () => Array.from(new Set(programs.map((program) => program.category))).sort(),
    [programs]
  );

  const filteredPrograms = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    const selectedSlugs = DISCOVERY_TAGS.find((tag) => tag.label === selectedDiscoveryTag)?.slugs;
    const filtered = programs.filter((program) => {
      const searchable = [
        program.name,
        program.category,
        program.shortDescription,
        ...program.tags,
        ...program.communityTags,
      ].join(' ').toLocaleLowerCase('pt-BR');

      const objectiveMatches = initialObjective !== 'celular'
        || DISCOVERY_TAGS.find((tag) => tag.label === 'Renda extra pelo celular')?.slugs.includes(program.slug);
      const currencyMatches = initialCurrency !== 'usd' || program.averageEarning.startsWith('US$');
      const englishMatches = initialEnglish !== 'nao' || program.languages.includes('Português');

      return objectiveMatches
        && currencyMatches
        && englishMatches
        && (!selectedSlugs || selectedSlugs.includes(program.slug))
        && (!normalizedQuery || searchable.includes(normalizedQuery))
        && (category === 'todas' || program.category === category)
        && (difficulty === 'todas' || program.difficulty === difficulty);
    });

    return [...filtered].sort((left, right) => {
      if (sort === 'relevancia') return comparePartnerProgramRelevance(left, right);

      const comparison = sort === 'nome'
        ? left.name.localeCompare(right.name, 'pt-BR')
        : sort === 'ganhos'
          ? earningValue(left.averageEarning) - earningValue(right.averageEarning)
          : left.finalRating - right.finalRating;

      return sortDirection === 'asc' ? comparison : comparison * -1;
    });
  }, [category, difficulty, initialCurrency, initialEnglish, initialObjective, programs, query, selectedDiscoveryTag, sort, sortDirection]);

  const totalPages = Math.ceil(filteredPrograms.length / PROGRAMS_PER_PAGE);
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1));
  const visiblePrograms = filteredPrograms.slice(
    (safeCurrentPage - 1) * PROGRAMS_PER_PAGE,
    safeCurrentPage * PROGRAMS_PER_PAGE,
  );

  function updatePage(page: number): void {
    setCurrentPage(Math.min(Math.max(page, 1), Math.max(totalPages, 1)));
  }

  function openProgram(program: PartnerProgramCard): void {
    setSelectedProgram(program);
    setShowReviewForm(false);
    setShowReferralModal(false);
  }

  function toggleDescription(slug: string): void {
    setExpandedDescriptionSlugs((current) => current.includes(slug)
      ? current.filter((item) => item !== slug)
      : [...current, slug]);
  }

  async function shareProgram(program: PartnerProgramCard, sharedUrl?: string, sharedTitle?: string): Promise<void> {
    const url = sharedUrl ?? program.affiliateUrl ?? program.websiteUrl;
    const shareData = {
      title: `${sharedTitle ?? program.name} · Portal NKL`,
      text: `Oi! Encontrei esta oportunidade de renda extra e lembrei de você: ${sharedTitle ?? program.name}.`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(`${shareData.text}\n${url}`);
      setShareMessage('Mensagem e link copiados para compartilhar.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setShareMessage('Não foi possível compartilhar agora.');
    }

    window.setTimeout(() => setShareMessage(null), 2600);
  }

  function calendarDate(date: Date): string {
    return date.toISOString().replaceAll('-', '').replaceAll(':', '').replace(/\.\d{3}Z$/u, 'Z');
  }

  function reminderRecurrence(): string {
    if (reminderFrequency === 'weekdays') return 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR';
    if (reminderFrequency === 'weekly') return 'RRULE:FREQ=WEEKLY';
    return 'RRULE:FREQ=DAILY';
  }

  function reminderDetails(program: PartnerProgramCard): { start: Date; end: Date; title: string; details: string } {
    const start = new Date(Date.now() + 60 * 60 * 1000);
    start.setMinutes(0, 0, 0);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    return {
      start,
      end,
      title: `Renda extra: avançar em ${program.name}`,
      details: `Reserve 30 minutos para avançar em ${program.name}. Acesse: ${program.affiliateUrl ?? program.websiteUrl}`,
    };
  }

  function addCalendarReminder(program: PartnerProgramCard, format: 'google' | 'ics'): void {
    const { start, end, title, details } = reminderDetails(program);
    if (format === 'google') {
      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        dates: `${calendarDate(start)}/${calendarDate(end)}`,
        details: `${details}\n\nFrequência: ${reminderFrequency === 'daily' ? 'diária' : reminderFrequency === 'weekdays' ? 'dias úteis' : 'semanal'}.`,
        recur: reminderRecurrence(),
      });
      window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank', 'noopener,noreferrer');
      setReminderProgram(null);
      return;
    }

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Portal NKL//Renda Extra//PT-BR',
      'BEGIN:VEVENT',
      `UID:${program.slug}-${Date.now()}@nkloficial.com.br`,
      `DTSTAMP:${calendarDate(new Date())}`,
      `DTSTART:${calendarDate(start)}`,
      `DTEND:${calendarDate(end)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${details.replaceAll('\n', '\\n')}`,
      reminderRecurrence(),
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lembrete-renda-extra-${program.slug}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    setReminderProgram(null);
  }

  return (
    <div className="space-y-5 md:space-y-8">
      {shareMessage && (
        <div role="status" className="fixed bottom-5 left-1/2 z-[250] -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm font-bold text-background shadow-xl">
          {shareMessage}
        </div>
      )}
      <section id="filtros" className="rounded-2xl border border-border bg-income-surface/90 p-4 md:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Encontre seu próximo caminho</p>
            <h2 className="mt-1 font-playfair text-2xl font-bold">Filtre por objetivo, não por hype.</h2>
          </div>
          <p className="max-w-xs text-right text-xs leading-relaxed opacity-55">Pesquise por uma ideia como “gravar vídeos em casa” ou “ganhar indicando”.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.6fr_1fr_1fr_1fr_0.8fr]">
        <label className="text-sm">
          <span className="block text-xs font-bold uppercase tracking-wide opacity-60 mb-2">Pesquisar</span>
          <input
            id="search-input"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedDiscoveryTag(null);
              setCurrentPage(1);
            }}
            placeholder="Nome, categoria ou tag"
            className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-neon"
          />
        </label>
        <label className="text-sm">
          <span className="block text-xs font-bold uppercase tracking-wide opacity-60 mb-2">Categoria</span>
          <select id="category-filters" value={category} onChange={(event) => {
            setCategory(event.target.value);
            setCurrentPage(1);
          }} className="w-full rounded-md border border-border bg-background px-3 py-2">
            <option value="todas">Todas</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-xs font-bold uppercase tracking-wide opacity-60 mb-2">Dificuldade</span>
          <select value={difficulty} onChange={(event) => {
            setDifficulty(event.target.value);
            setCurrentPage(1);
          }} className="w-full rounded-md border border-border bg-background px-3 py-2">
            <option value="todas">Todas</option>
            <option value="fácil">Fácil</option>
            <option value="médio">Médio</option>
            <option value="difícil">Difícil</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-xs font-bold uppercase tracking-wide opacity-60 mb-2">Ordenar</span>
          <select value={sort} onChange={(event) => {
            setSort(event.target.value);
            setCurrentPage(1);
          }} className="w-full rounded-md border border-border bg-background px-3 py-2">
            <option value="relevancia">Relevância</option>
            <option value="nota">Nota</option>
            <option value="ganhos">Ganhos</option>
            <option value="nome">Nome</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-xs font-bold uppercase tracking-wide opacity-60 mb-2">Direção</span>
          <select value={sortDirection} onChange={(event) => {
            setSortDirection(event.target.value as 'asc' | 'desc');
            setCurrentPage(1);
          }} className="w-full rounded-md border border-border bg-background px-3 py-2">
            <option value="desc">Decrescente</option>
            <option value="asc">Crescente</option>
          </select>
        </label>
        </div>
      </section>

      <section aria-labelledby="discovery-tags-title" className="rounded-2xl border border-border bg-income-surface/65 p-4">
        <h2 id="discovery-tags-title" className="mb-3 text-xs font-bold uppercase tracking-wide opacity-60">Explore por objetivo</h2>
        <div className="flex flex-wrap gap-3">
          {DISCOVERY_TAGS.map((tag) => (
            <button
              key={tag.label}
              type="button"
              onClick={() => {
                const isSelected = selectedDiscoveryTag === tag.label;
                setSelectedDiscoveryTag(isSelected ? null : tag.label);
                setQuery('');
                setCurrentPage(1);
              }}
              className={`inline-flex min-h-9 items-center rounded-full border px-3 py-1.5 text-xs transition-colors ${
                selectedDiscoveryTag === tag.label
                  ? 'border-neon bg-neon text-black'
                  : 'border-border opacity-75 hover:border-neon hover:opacity-100'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </section>

      <p className="text-sm opacity-60">{filteredPrograms.length} oportunidades encontradas</p>

      <section id="programs-grid" className="programs-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {visiblePrograms.map((program, index) => {
          const rating = program.finalRating;
          const ratingLabel = program.communityRating === null ? 'nota editorial' : `${program.communityReviewCount} avaliações`;
          const visibleTags = program.communityTags.length >= 1 ? program.communityTags : program.tags;
          const isDescriptionExpanded = expandedDescriptionSlugs.includes(program.slug);
          const adIndex = 3 + (safeCurrentPage % 3);

          return (
            <Fragment key={program.id}>
            {index === adIndex && <NativeAdCard currentPage={safeCurrentPage} />}
            <article
              onClick={() => openProgram(program)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openProgram(program);
                }
              }}
              role="button"
              tabIndex={0}
              data-tutorial={index === 0 ? 'program-card-0' : undefined}
              className="group relative flex cursor-pointer flex-col gap-4 rounded-xl border border-border bg-income-card/95 p-4 [container-type:inline-size] transition-colors hover:border-neon/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon md:gap-5 md:p-6"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-neon font-bold">{program.category}</p>
                  <h2 className="mt-1 break-words font-playfair text-2xl font-bold">{program.name}</h2>
                </div>
                <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
                  <span className="inline-flex max-w-full items-center rounded-full border border-neon/40 bg-neon/10 px-2.5 py-1 text-xs font-bold text-neon">
                    {program.averageEarning}
                  </span>
                  <button id={index === 0 ? 'nota-comunidade' : undefined} data-tutorial={index === 0 ? 'program-rating' : undefined} type="button" onClick={(event) => { event.stopPropagation(); openProgram(program); }} className="community-rating min-h-11 shrink-0 rounded-full border border-neon px-3 py-2 text-sm font-bold transition-colors hover:bg-neon hover:text-black" aria-label={`Avaliar ${program.name}`}>
                    {rating.toFixed(1)}/10
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {program.languages.map((language) => (
                  <span key={language} className="rounded-full border border-border px-2.5 py-1 text-xs font-medium">
                    {language}
                  </span>
                ))}
              </div>
              <p className={`text-sm leading-relaxed opacity-75 ${isDescriptionExpanded ? '' : 'line-clamp-2'}`}>{program.shortDescription}</p>
              {program.shortDescription.length > 150 && (
                <button type="button" onClick={(event) => { event.stopPropagation(); toggleDescription(program.slug); }} className="self-start text-xs font-bold text-neon underline decoration-neon/40 underline-offset-2 hover:text-neon-dark">
                  {isDescriptionExpanded ? 'Recolher descrição' : 'Ler descrição completa'}
                </button>
              )}
              <div className="mt-auto flex min-w-0 flex-col gap-2">
                <div className="flex min-h-16 items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap content-start items-start gap-1.5">
                      <span className="whitespace-nowrap rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-neon">{program.difficulty}</span>
                      {visibleTags.includes('dólar') && <span className="whitespace-nowrap rounded-full border border-neon/60 px-2.5 py-1 text-xs font-bold text-neon">Pode pagar em dólar</span>}
                      <SmartTagList tags={visibleTags} />
                    </div>
                    <p className="mt-1 text-xs opacity-50">{ratingLabel} · Clique na nota para avaliar</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {program.slug === 'quintoandar-indica-ai' ? (
                    <button
                      type="button"
                      onClick={(event) => { event.stopPropagation(); setSelectedProgram(program); setShowReferralModal(true); }}
                      className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-border bg-background p-1.5 shadow-sm transition-transform hover:scale-105 hover:border-neon"
                      aria-label={`Indicar imóveis pelo ${program.name}`}
                      title={`Indicar imóveis pelo ${program.name}`}
                    >
                      <ProgramLogo program={program} />
                    </button>
                  ) : (
                    <OutboundLink
                      href={program.affiliateUrl ?? program.websiteUrl}
                      trackingId={program.slug}
                      sponsored={Boolean(program.affiliateUrl)}
                      onClick={(event) => event.stopPropagation()}
                      className={`inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-border p-1.5 shadow-sm transition-transform hover:scale-105 hover:border-neon ${['claru-ia', 'crowdato', 'oneforma', 'joinbrands'].includes(program.slug) ? 'bg-white' : 'bg-background'}`}
                      aria-label={`Acessar plataforma ${program.name}`}
                      title={`Acessar plataforma ${program.name}`}
                    >
                      <ProgramLogo program={program} />
                    </OutboundLink>
                  )}
                  </div>
                </div>
                <div className="flex min-w-0 w-full items-center gap-1.5 overflow-hidden">
                  <button type="button" onClick={(event) => { event.stopPropagation(); openProgram(program); }} className="inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-border px-3 text-sm font-bold leading-none hover:border-neon">Ler mais</button>
                  {program.slug === 'quintoandar-indica-ai' ? (
                    <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedProgram(program); setShowReferralModal(true); }} className="inline-flex h-11 min-w-0 flex-1 items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap rounded-md bg-neon px-2 text-sm font-bold leading-none text-black hover:opacity-90">
                      Quero começar
                    </button>
                  ) : (
                    <OutboundLink href={program.affiliateUrl ?? program.websiteUrl} trackingId={program.slug} sponsored={Boolean(program.affiliateUrl)} onClick={(event) => event.stopPropagation()} className="inline-flex h-11 min-w-0 flex-1 items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap rounded-md bg-neon px-2 text-sm font-bold leading-none text-black hover:opacity-90">
                      Acessar plataforma
                    </OutboundLink>
                  )}
                  <button
                    type="button"
                    onClick={(event) => { event.stopPropagation(); void shareProgram(program); }}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border text-neon transition-colors hover:border-neon hover:bg-neon/10"
                    aria-label={`Compartilhar ${program.name}`}
                    title="Compartilhar oportunidade"
                  >
                    <Share2 size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => { event.stopPropagation(); setReminderProgram(program); }}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border text-neon transition-colors hover:border-neon hover:bg-neon/10"
                    aria-label={`Criar lembrete para ${program.name}`}
                    title="Criar lembrete"
                  >
                    <BellPlus size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
            </Fragment>
          );
        })}
      </section>

      <Pagination currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={updatePage} />

      {filteredPrograms.length === 0 && <p className="rounded-xl border border-border bg-income-surface p-8 text-center opacity-70">Nenhum programa corresponde aos filtros.</p>}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        <form id="news-suggest" action={suggestionAction} className="space-y-4 rounded-xl border border-border bg-income-surface/90 p-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-neon font-bold">Ajude a ampliar o catálogo</p>
            <h2 className="font-playfair text-2xl font-bold mt-1">Sugira uma oportunidade</h2>
          </div>
          <input name="name" required placeholder="Nome do site ou serviço" className="w-full rounded-md border border-border bg-background px-3 py-2" />
          <input name="websiteUrl" type="url" placeholder="Link do site (opcional)" className="w-full rounded-md border border-border bg-background px-3 py-2" />
          <textarea name="reason" required minLength={40} rows={4} placeholder="Por que esta oportunidade deveria entrar? (mínimo de 10 palavras)" className="w-full rounded-md border border-border bg-background px-3 py-2" />
          {suggestionState.error && <p role="alert" className="text-sm text-red-400">{suggestionState.error}</p>}
          {suggestionState.success && <p role="status" className="text-sm text-neon">Sugestão enviada para análise.</p>}
          <SubmitButton idleLabel="Enviar sugestão" pendingLabel="Enviando..." />
        </form>
        <div className="rounded-xl border border-border bg-income-surface/90 p-6">
          <p className="text-xs uppercase tracking-wide text-neon font-bold">Como funciona</p>
          <h2 className="font-playfair text-2xl font-bold mt-1">Notas transparentes</h2>
          <p className="mt-3 text-sm opacity-70 leading-relaxed">A nota editorial é uma referência inicial. Depois de cinco avaliações da comunidade, as tags exibidas passam a refletir exclusivamente a experiência de quem usou o serviço.</p>
          <p className="mt-3 text-sm opacity-70 leading-relaxed">As avaliações são anônimas para o público. Para reduzir duplicidade, o sistema usa um identificador técnico protegido em cookie.</p>
        </div>
      </section>

      {reminderProgram && (
        <div ref={dialogRef} className="fixed inset-0 z-[230] flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-label={`Criar lembrete para ${reminderProgram.name}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setReminderProgram(null); }}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-income-surface p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Não deixe para depois</p>
                <h2 className="mt-1 font-playfair text-2xl font-bold">Lembrar de avançar</h2>
              </div>
              <button type="button" onClick={() => setReminderProgram(null)} className="text-2xl opacity-60 hover:opacity-100" aria-label="Fechar">×</button>
            </div>
            <p className="mt-4 text-sm leading-relaxed opacity-75">Escolha uma frequência. O Portal NKL não salva seus dados: o lembrete é criado diretamente no seu calendário.</p>
            <label className="mt-5 block text-sm font-bold">
              Frequência
              <select value={reminderFrequency} onChange={(event) => setReminderFrequency(event.target.value as 'daily' | 'weekdays' | 'weekly')} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 font-normal">
                <option value="daily">Todos os dias</option>
                <option value="weekdays">Dias úteis</option>
                <option value="weekly">Uma vez por semana</option>
              </select>
            </label>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => addCalendarReminder(reminderProgram, 'google')} className="inline-flex items-center justify-center gap-2 rounded-md bg-neon px-4 py-2.5 text-sm font-bold text-black hover:opacity-90">
                <CalendarPlus size={16} aria-hidden="true" /> Google Calendar
              </button>
              <button type="button" onClick={() => addCalendarReminder(reminderProgram, 'ics')} className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-bold hover:border-neon">
                <BellPlus size={16} aria-hidden="true" /> Baixar arquivo .ics
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedProgram && (
        <div ref={dialogRef} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label={`Detalhes de ${selectedProgram.name}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedProgram(null); }}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-income-surface p-6" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-neon font-bold">{selectedProgram.category}</p>
                <h2 className="font-playfair text-3xl font-bold">{selectedProgram.name}</h2>
              </div>
              <button type="button" onClick={() => setSelectedProgram(null)} className="text-2xl opacity-60 hover:opacity-100" aria-label="Fechar">×</button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-orange-500 dark:text-orange-400">Nota editorial</p>
                <p className="mt-1 text-2xl font-bold">{selectedProgram.editorialRating.toFixed(1)}/10</p>
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs font-bold uppercase tracking-wide opacity-60">Potencial de ganho</p>
                <p className="mt-1 text-lg font-bold">{selectedProgram.earningPotential ?? selectedProgram.averageEarning}</p>
              </div>
            </div>
            <ProgramSecondaryOffer programSlug={selectedProgram.slug} currentPage={safeCurrentPage} />
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/programas/${selectedProgram.slug}`} onClick={() => setSelectedProgram(null)} className="inline-flex min-h-11 items-center rounded-md border border-orange-500/60 px-4 py-2 text-sm font-bold text-orange-500 hover:bg-orange-500/10 dark:text-orange-400">
                Abrir página completa
              </Link>
              <button type="button" onClick={() => setShowReviewForm((visible) => !visible)} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 py-2 text-sm font-bold hover:border-orange-500">
                {showReviewForm ? 'Ocultar avaliação' : 'Avaliar oportunidade'}
              </button>
              <SocialEmbed
                youtubeId={selectedProgram.youtubeVideoId}
                tiktokId={selectedProgram.tiktokVideoId}
                programName={selectedProgram.name}
                triggerLabel="Ver vídeo"
              />
            </div>
            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed opacity-80">{selectedProgram.longDescription}</p>
            {selectedProgram.slug === 'claru-ia' && (
              <section className="mt-5 rounded-lg border border-neon/25 bg-neon/5 p-4">
                <p className="text-sm font-bold">Você tem uma empresa e quer divulgá-la?</p>
                <p className="mt-1 text-sm leading-relaxed opacity-75">A Claru também permite que empresas criem oportunidades e encontrem pessoas para campanhas de conteúdo e tarefas digitais.</p>
                <OutboundLink href={CLARU_PARTNER_URL} trackingId="claru-ia-partner" sponsored className="mt-3 inline-flex rounded-md bg-neon px-4 py-2 text-sm font-bold text-black hover:opacity-90">
                  Divulgar minha empresa na Claru
                </OutboundLink>
              </section>
            )}
            {selectedProgram.slug === 'aligner' && (
              <section className="mt-5 rounded-lg border border-border bg-background p-4">
                <h3 className="font-bold">Exemplos de projetos disponíveis</h3>
                <p className="mt-1 text-sm leading-relaxed opacity-75">As oportunidades podem mudar rapidamente. Estes exemplos mostram vagas para engenharia e avaliação de IA; também podem surgir projetos para pessoas que falam português em transcrição, localização, linguística e finanças.</p>
                <div className="mt-3 space-y-2">
                  {ALIGNERR_PROJECTS.map((project) => (
                    <div key={project.href} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                      <span className="text-sm font-medium">{project.title}</span>
                      <div className="flex shrink-0 gap-2">
                        <OutboundLink href={project.href} trackingId={`aligner-${project.title}`} sponsored className="rounded-md bg-neon px-3 py-2 text-xs font-bold text-black hover:opacity-90">
                          Ver projeto
                        </OutboundLink>
                        <button type="button" onClick={() => void shareProgram(selectedProgram, project.href, project.title)} className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border text-neon hover:border-neon" aria-label={`Compartilhar ${project.title}`}>
                          <Share2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            <div className="mt-5 flex items-center justify-between gap-3 rounded-lg border border-neon/25 bg-neon/5 p-3">
              <p className="text-sm leading-relaxed">
                Lembrou de alguém que combina com esta oportunidade? Compartilhe com essa pessoa.
              </p>
              <button
                type="button"
                onClick={() => void shareProgram(selectedProgram)}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-neon px-3 text-sm font-bold text-neon transition-colors hover:bg-neon hover:text-black"
              >
                <Share2 size={16} aria-hidden="true" />
                <span className="hidden sm:inline">Compartilhar</span>
              </button>
            </div>
            {selectedProgram.slug === 'marketplaces-afiliados' && (
              <section className="mt-6 rounded-lg border border-border bg-background p-4">
                <h3 className="font-bold">Onde se cadastrar como afiliado</h3>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {MARKETPLACE_AFFILIATE_LINKS.map((marketplace) => (
                    <li key={marketplace.name}>
                      <OutboundLink
                        href={marketplace.href}
                        trackingId={`marketplace-${marketplace.name.toLowerCase().replaceAll(' ', '-')}`}
                        sponsored
                        className="flex min-h-11 items-center rounded-md border border-border px-3 py-2 text-sm font-medium text-neon transition-colors hover:border-neon hover:bg-neon/5 hover:no-underline"
                      >
                        {marketplace.name}
                      </OutboundLink>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <ProgramFirstWithdrawal slug={selectedProgram.slug} programName={selectedProgram.name} />
            <ProgramStrategies slug={selectedProgram.slug} category={selectedProgram.category} tags={selectedProgram.tags} />
            {extractReferralCode(selectedProgram.longDescription) && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide opacity-60">Código de indicação</p>
                  <code className="text-base font-bold tracking-wider">{extractReferralCode(selectedProgram.longDescription)}</code>
                </div>
                <ClipboardCopy textToCopy={extractReferralCode(selectedProgram.longDescription) ?? ''} />
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedProgram.languages.map((language) => <span key={`language-${language}`} className="rounded-full border border-neon/50 px-2.5 py-1 text-xs font-medium text-neon">{language}</span>)}
              {(selectedProgram.communityTags.length >= 1 ? selectedProgram.communityTags : selectedProgram.tags).map((tag) => <span key={tag} className="rounded-full border border-border px-2.5 py-1 text-xs">{tag}</span>)}
            </div>
            <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-6">
              {selectedProgram.slug === 'quintoandar-indica-ai' ? (
                <button type="button" onClick={() => setShowReferralModal(true)} className="rounded-md bg-neon px-4 py-2 text-sm font-bold text-black hover:opacity-90">Quero começar</button>
              ) : (
                <OutboundLink href={selectedProgram.affiliateUrl ?? selectedProgram.websiteUrl} trackingId={selectedProgram.slug} sponsored={Boolean(selectedProgram.affiliateUrl)} className="rounded-md bg-neon px-4 py-2 text-sm font-bold text-black hover:opacity-90">Acessar plataforma</OutboundLink>
              )}
            </div>
            {showReviewForm && <form action={reviewAction} className="mt-8 space-y-4 border-t border-border pt-6">
              <input type="hidden" name="programId" value={selectedProgram.id} />
              <h3 className="font-playfair text-xl font-bold">Avalie esta oportunidade</h3>
              <label className="block text-sm font-bold">Nota de 0 a 10
                <input name="rating" type="number" min="0" max="10" step="1" required className="mt-2 block w-28 rounded-md border border-border bg-background px-3 py-2" />
              </label>
              <fieldset className="rounded-lg border border-border p-3">
                <legend className="px-1 text-sm font-bold">Quanto você recebeu ou espera receber?</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                  <input name="payAmount" type="number" min="0.01" step="0.01" placeholder="Valor médio (opcional)" className="rounded-md border border-border bg-background px-3 py-2 font-normal" />
                  <select name="payCurrency" defaultValue="BRL" className="rounded-md border border-border bg-background px-3 py-2 font-normal">
                    <option value="BRL">R$ BRL</option>
                    <option value="USD">US$ USD</option>
                    <option value="EUR">€ EUR</option>
                  </select>
                  <select name="payPeriod" defaultValue="trabalho" className="rounded-md border border-border bg-background px-3 py-2 font-normal">
                    <option value="hora">por hora</option>
                    <option value="dia">por dia</option>
                    <option value="semana">por semana</option>
                    <option value="trabalho">por trabalho</option>
                  </select>
                </div>
                <p className="mt-2 text-xs font-normal opacity-60">Informe apenas se você tiver uma referência real.</p>
              </fieldset>
              <label className="block text-sm font-bold">Tags da sua experiência
                <select name="tags" multiple className="mt-2 min-h-32 w-full rounded-md border border-border bg-background px-3 py-2 font-normal" aria-describedby="review-tags-help">
                  {REVIEW_TAG_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
                    </optgroup>
                  ))}
                </select>
                <span id="review-tags-help" className="mt-1 block text-xs font-normal opacity-60">Você pode selecionar quantas tags quiser, incluindo pontos positivos e negativos.</span>
              </label>
              <label className="block text-sm font-bold">Por que você deu esta nota?
                <textarea name="reason" required minLength={100} rows={6} placeholder="Escreva pelo menos 20 palavras sobre sua experiência." className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 font-normal" />
              </label>
              <p className="text-xs opacity-60">Sua avaliação será anônima. O texto precisa ter pelo menos 20 palavras.</p>
              {reviewState.error && <p role="alert" className="text-sm text-red-400">{reviewState.error}</p>}
              {reviewState.success && <p role="status" className="text-sm text-neon">Avaliação publicada com sucesso.</p>}
              <SubmitButton idleLabel="Publicar avaliação" pendingLabel="Processando..." />
            </form>}
          </div>
        </div>
      )}
      {selectedProgram && showReferralModal && (
        <PartnerReferralLeadModal
          programId={selectedProgram.id}
          programName={selectedProgram.name}
          onClose={() => setShowReferralModal(false)}
        />
      )}
    </div>
  );
}
