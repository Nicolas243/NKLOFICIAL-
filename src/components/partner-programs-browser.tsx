'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useActionState, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { BellPlus, Bookmark, CalendarPlus, ChevronDown, Search, Share2, SlidersHorizontal, X } from 'lucide-react';
import type { PartnerProgramCard } from '@/actions/partner-programs';
import { submitPartnerReview } from '@/actions/partner-programs';
import { Pagination } from '@/components/ui/pagination';
import { OutboundLink } from '@/components/ui/outbound-link';
import { PartnerReferralLeadModal } from '@/components/partner-referral-lead-modal';
import { ProgramFirstWithdrawal } from '@/components/income/program-first-withdrawal';
import { ProgramSecondaryOffer } from '@/components/income/program-secondary-offer';
import { ProgramStrategies } from '@/components/income/program-strategies';
import { SaveProgramButton, useSavedProgramSlugs } from '@/components/income/save-program-button';
import { SmartTagList } from '@/components/income/smart-tag-list';
import { SocialEmbed } from '@/components/video/social-embed';
import { Micro1OpportunitiesSection } from '@/components/micro1-opportunities-section';
import { comparePartnerProgramRelevance } from '@/lib/partner-program-sorting';
import { getProgramShareUrl } from '@/lib/share-url';
import { SITE_URL } from '@/lib/site';
import { PORTAL_AREA_CARDS } from '@/lib/portal-areas';
import { EDITORIAL_CARDS, EditorialCardView } from '@/components/global-editorial-cards';
import { AdBannerContent } from '@/components/ads/ad-banner-content';
import { PAID_PRODUCTS } from '@/config/products';
import type { ActiveAdSlot } from '@/lib/ad-inventory';
import type { Micro1Opportunity } from '@/lib/micro1-opportunities';

type QuickPanelId = 'stats' | 'guide' | 'compass' | 'how-to-choose' | 'hubs' | 'objectives';

type Props = {
  programs: PartnerProgramCard[];
  micro1Opportunities: Micro1Opportunity[];
  micro1Error: string | null;
  adSlots: ActiveAdSlot[];
  adPriceCents: number;
  adPromotionActive: boolean;
  quickPanels?: {
    stats: ReactNode;
    guide: ReactNode;
    compass: ReactNode;
    howToChoose: ReactNode;
    hubs: ReactNode;
  };
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
const PROGRAMS_PER_PAGE = 12;
const EMBEDDED_PORTAL_RESOURCE_SLUGS = [
  'bussola-negocios',
  'ferramenta-ia',
  'pacote-renda-extra',
  'pacote-idiomas-ia',
] as const;

const EMBEDDED_RESOURCE_MEDIA: Record<
  string,
  { areaId: string; priceTag: string; incomePotential: string; eyebrow: string }
> = {
  'bussola-negocios': {
    areaId: 'quiz-negocios',
    priceTag: 'R$ 39 único',
    incomePotential: 'R$ 500 a R$ 4.000/mês',
    eyebrow: 'Ferramenta NKL',
  },
  'ferramenta-ia': {
    areaId: 'ferramenta-ia',
    priceTag: 'R$ 39/mês',
    incomePotential: 'R$ 600 a R$ 3.500/mês',
    eyebrow: 'Estúdio IA NKL',
  },
  'pacote-renda-extra': {
    areaId: 'guia-renda-extra',
    priceTag: 'R$ 19 – R$ 247',
    incomePotential: 'R$ 400 a R$ 3.000/mês',
    eyebrow: 'Guias NKL',
  },
  'pacote-idiomas-ia': {
    areaId: 'idiomas',
    priceTag: 'R$ 27 – R$ 297',
    incomePotential: 'R$ 500 a R$ 3.500/mês',
    eyebrow: 'Idiomas NKL',
  },
};
const DISCOVERY_TAGS = [
  { label: 'Gravar vídeos em casa', slugs: ['apphub', 'billo', 'joinbrands', 'hub', 'flambra', 'amazon-influencer', 'sideshift', 'producao-videos-ia', 'edicao-cortes-virais-ia'] },
  { label: 'Ganhar sem fazer nada', slugs: ['honeygain', 'repocket', 'ia-remunerada-curadoria-dados'] },
  { label: 'Ganhar com pesquisas', slugs: ['prolific', 'dscout', 'dataannotation', 'crowdato', 'attapoll'] },
  { label: 'Testar apps e sites', slugs: ['aligner', 'utest', 'testlio', 'testes-ux-narrados'] },
  { label: 'Vender serviços', slugs: ['fiverr', 'upwork', 'automacao-ia-negocios-locais', 'trafego-pago-negocios-locais', 'edicao-cortes-virais-ia'] },
  { label: 'Ganhar indicando', slugs: ['mercado-pago', 'marketplaces-afiliados', 'hotmart', 'sideshift', 'quintoandar-indica-ai', 'afiliados-b2b-tubebuddy-make'] },
  { label: 'Renda extra pelo celular', slugs: ['mercado-pago', 'honeygain', 'clickworker', 'oneforma', 'sideshift', 'attapoll', 'edicao-cortes-virais-ia'] },
  { label: 'Renda extra sem investimento', slugs: ['prolific', 'dscout', 'honeygain', 'apphub', 'clickworker', 'oneforma', 'dataannotation', 'crowdato', 'outlier-ai', 'utest', 'testlio', 'claru-ia', 'quintoandar-indica-ai', 'amazon-kdp-ebooks', 'learn-to-earn-bolsas-digitais', 'ia-remunerada-curadoria-dados'] },
  { label: 'Com investimento inicial', slugs: ['comunidades-pagas-skool-systeme', 'montink-embaixador', 'walmart-marketplace-revenda', 'producao-videos-ia', 'printful-print-on-demand', 'loja-templates-etsy-gumroad', 'automacao-ia-negocios-locais', 'trafego-pago-negocios-locais', 'edicao-cortes-virais-ia'] },
  { label: 'Estudar e ganhar / IA', slugs: ['learn-to-earn-bolsas-digitais', 'ia-remunerada-curadoria-dados', 'outlier-ai', 'micro1', 'dataannotation', 'mindrift', 'claru-ia'] },
  { label: 'E-books e produtos digitais', slugs: ['amazon-kdp-ebooks', 'loja-templates-etsy-gumroad', 'hotmart', 'comunidades-pagas-skool-systeme'] },
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
const BUY_ME_A_COFFEE_SLUG = 'monetizacao-atencao-web';
const BUY_ME_A_COFFEE_INVITE_URL = 'https://www.buymeacoffee.com/invite/ni2co3san9c';
const ALIGNERR_PROJECTS = [
  {
    title: 'Senior Software Engineer — Agentic Coding',
    href: 'https://app.alignerr.com/signin?referral-code=5b904321-66d0-4369-bf89-5b230408747a&program=b7f918c0-4ef7-11f1-9dec-3d76718b1a77&referralJobId=f4b9a0e2-e6c2-4388-b01d-b7655b313d9b',
  },
];
export function PartnerProgramsBrowser({
  programs,
  micro1Opportunities,
  micro1Error,
  adSlots,
  adPriceCents,
  adPromotionActive,
  quickPanels,
  initialObjective,
  initialCurrency,
  initialEnglish,
}: Props) {
  const router = useRouter();
  const [reviewState, reviewAction] = useActionState(submitReviewAction, INITIAL_FORM_STATE);
  const { savedSlugs } = useSavedProgramSlugs();
  const savedSlugSet = useMemo(() => new Set(savedSlugs), [savedSlugs]);
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeQuickPanel, setActiveQuickPanel] = useState<QuickPanelId | null>(null);
  const [urlObjective, setUrlObjective] = useState<string | undefined>(initialObjective);
  const [urlCurrency, setUrlCurrency] = useState<string | undefined>(initialCurrency);
  const [urlEnglish, setUrlEnglish] = useState<string | undefined>(initialEnglish);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cardsResultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const qParam = search.get('q')?.trim();
    const objParam = search.get('objetivo')?.trim() ?? undefined;
    const curParam = search.get('moeda')?.trim() ?? undefined;
    const engParam = search.get('ingles')?.trim() ?? undefined;
    if (!qParam && !objParam && !curParam && !engParam) return;

    const frame = window.requestAnimationFrame(() => {
      if (qParam) setQuery(qParam);
      if (objParam) setUrlObjective(objParam);
      if (curParam) setUrlCurrency(curParam);
      if (engParam) setUrlEnglish(engParam);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function scrollToCards(): void {
    window.requestAnimationFrame(() => {
      cardsResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

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

  useEffect(() => {
    if (!filtersOpen) return;

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') setFiltersOpen(false);
    }
    function onCloseOverlays(): void {
      setFiltersOpen(false);
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('nkl:close-overlays', onCloseOverlays);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('nkl:close-overlays', onCloseOverlays);
      document.body.style.overflow = previousOverflow;
    };
  }, [filtersOpen]);

  const activeFilterCount =
    (category !== 'todas' ? 1 : 0)
    + (difficulty !== 'todas' ? 1 : 0)
    + (sort !== 'relevancia' ? 1 : 0)
    + (sortDirection !== 'desc' ? 1 : 0);

  const hasAnyActiveFilter =
    Boolean(selectedDiscoveryTag)
    || Boolean(query.trim())
    || activeFilterCount > 0;

  function resetAllFilters(): void {
    setSelectedDiscoveryTag(null);
    setCategory('todas');
    setDifficulty('todas');
    setSort('relevancia');
    setSortDirection('desc');
    setQuery('');
    setCurrentPage(1);
  }

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

      const objectiveMatches = urlObjective !== 'celular'
        || DISCOVERY_TAGS.find((tag) => tag.label === 'Renda extra pelo celular')?.slugs.includes(program.slug);
      const currencyMatches = urlCurrency !== 'usd' || program.averageEarning.startsWith('US$');
      const englishMatches = urlEnglish !== 'nao' || program.languages.includes('Português');

      const matchesSelectedTag = !selectedSlugs
        || selectedSlugs.includes(program.slug)
        || (selectedDiscoveryTag === 'Com investimento inicial' && !program.zeroInvestmentRequired);

      return objectiveMatches
        && currencyMatches
        && englishMatches
        && matchesSelectedTag
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
  }, [category, difficulty, programs, query, selectedDiscoveryTag, sort, sortDirection, urlCurrency, urlEnglish, urlObjective]);

  const embeddedResources = useMemo(
    () => PAID_PRODUCTS.filter((product) => EMBEDDED_PORTAL_RESOURCE_SLUGS.includes(product.slug as (typeof EMBEDDED_PORTAL_RESOURCE_SLUGS)[number])),
    [],
  );

  const totalPages = Math.ceil(filteredPrograms.length / PROGRAMS_PER_PAGE);
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1));
  const visiblePrograms = filteredPrograms.slice(
    (safeCurrentPage - 1) * PROGRAMS_PER_PAGE,
    safeCurrentPage * PROGRAMS_PER_PAGE,
  );

  type GridEntry =
    | { kind: 'program'; key: string; program: PartnerProgramCard; isFirst: boolean }
    | { kind: 'resource'; key: string; resource: (typeof embeddedResources)[number] }
    | { kind: 'editorial'; key: string; card: (typeof EDITORIAL_CARDS)[number] };

  const gridEntries: GridEntry[] = useMemo(() => {
    const salesDeck: Array<
      | { kind: 'resource'; resource: (typeof embeddedResources)[number] }
      | { kind: 'editorial'; card: (typeof EDITORIAL_CARDS)[number] }
    > = [
      ...(embeddedResources[0] ? [{ kind: 'resource' as const, resource: embeddedResources[0] }] : []),
      { kind: 'editorial' as const, card: EDITORIAL_CARDS[0] },
      ...(embeddedResources[1] ? [{ kind: 'resource' as const, resource: embeddedResources[1] }] : []),
      ...(embeddedResources[2] ? [{ kind: 'resource' as const, resource: embeddedResources[2] }] : []),
      { kind: 'editorial' as const, card: EDITORIAL_CARDS[1] },
      ...(embeddedResources[3] ? [{ kind: 'resource' as const, resource: embeddedResources[3] }] : []),
    ];

    const entries: GridEntry[] = [];
    visiblePrograms.forEach((program, index) => {
      entries.push({
        kind: 'program',
        key: program.id,
        program,
        isFirst: index === 0,
      });

      if ((index + 1) % 4 === 0 && salesDeck.length > 0) {
        const slotIndex = Math.floor(index / 4);
        const salesIndex = ((safeCurrentPage - 1) * 3 + slotIndex) % salesDeck.length;
        const selectedOffer = salesDeck[salesIndex];
        if (selectedOffer.kind === 'editorial') {
          entries.push({
            kind: 'editorial',
            key: `editorial-p${safeCurrentPage}-${slotIndex}`,
            card: selectedOffer.card,
          });
        } else {
          entries.push({
            kind: 'resource',
            key: `resource-${selectedOffer.resource.slug}-p${safeCurrentPage}-${slotIndex}`,
            resource: selectedOffer.resource,
          });
        }
      }
    });
    return entries;
  }, [embeddedResources, safeCurrentPage, visiblePrograms]);

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

  async function shareProgram(program: PartnerProgramCard, specificUrl?: string): Promise<void> {
    const url = getProgramShareUrl(program.slug, SITE_URL, specificUrl);
    const shareData = {
      title: `${program.name} · Portal NKL`,
      text: `Oi! Encontrei esta oportunidade de renda extra e lembrei de você: ${program.name}.`,
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

  async function shareResourceOffer(resource: (typeof embeddedResources)[number]): Promise<void> {
    const url = new URL(resource.offerRoute, window.location.origin).toString();
    const shareData = {
      title: `${resource.title} · Portal NKL`,
      text: `Conheça ${resource.title} no Portal NKL.`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(`${shareData.text}\n${url}`);
      setShareMessage('Link copiado para compartilhar.');
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
      <section id="como-funciona" aria-label="Atalhos e guias rápidos" className="rounded-2xl border border-border bg-income-surface/75 p-2.5 md:p-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {[
            ...(quickPanels
              ? [
                { id: 'stats' as const, label: 'Dados do levantamento' },
                { id: 'guide' as const, label: 'Mapa prático' },
                { id: 'compass' as const, label: 'Bússola de Negócios' },
                { id: 'how-to-choose' as const, label: 'Como escolher' },
                { id: 'hubs' as const, label: 'Guias de escolha' },
              ]
              : []),
            {
              id: 'objectives' as const,
              label: selectedDiscoveryTag ? `Objetivo: ${selectedDiscoveryTag}` : 'Explore por objetivo',
            },
          ].map((item) => {
            const isOpen = activeQuickPanel === item.id;
            const isObjectiveActive = item.id === 'objectives' && Boolean(selectedDiscoveryTag);
            return (
              <button
                key={item.id}
                type="button"
                aria-expanded={isOpen}
                onClick={() => setActiveQuickPanel(isOpen ? null : item.id)}
                className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${isOpen || isObjectiveActive
                  ? 'border-neon bg-neon text-black'
                  : 'border-border bg-background/80 opacity-85 hover:border-neon hover:text-neon hover:opacity-100'
                  }`}
              >
                <span>{item.label}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
            );
          })}
          {activeQuickPanel !== null && (
            <button
              type="button"
              aria-label="Fechar painel aberto"
              onClick={() => setActiveQuickPanel(null)}
              className="ml-auto inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-background/70 opacity-75 transition hover:border-neon hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {quickPanels && (
          <>
            <div className={activeQuickPanel === 'stats' ? 'mt-3' : 'hidden'}>
              {quickPanels.stats}
            </div>
            <div className={activeQuickPanel === 'guide' ? 'mt-3' : 'hidden'}>
              {quickPanels.guide}
            </div>
            <div className={activeQuickPanel === 'compass' ? 'mt-3' : 'hidden'}>
              {quickPanels.compass}
            </div>
            <div className={activeQuickPanel === 'how-to-choose' ? 'mt-3' : 'hidden'}>
              {quickPanels.howToChoose}
            </div>
            <div className={activeQuickPanel === 'hubs' ? 'mt-3' : 'hidden'}>
              {quickPanels.hubs}
            </div>
          </>
        )}

        <div className={activeQuickPanel === 'objectives' ? 'mt-3 border-t border-border pt-3' : 'hidden'}>
          <div className="flex flex-wrap gap-2.5">
            {DISCOVERY_TAGS.map((tag) => (
              <button
                key={tag.label}
                type="button"
                onClick={() => {
                  const isSelected = selectedDiscoveryTag === tag.label;
                  setSelectedDiscoveryTag(isSelected ? null : tag.label);
                  setQuery('');
                  setCurrentPage(1);
                  if (!isSelected) scrollToCards();
                }}
                className={`inline-flex min-h-9 cursor-pointer items-center rounded-full border px-3 py-1.5 text-xs transition-colors ${selectedDiscoveryTag === tag.label
                  ? 'border-neon bg-neon text-black font-bold'
                  : 'border-border opacity-75 hover:border-neon hover:opacity-100'
                  }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="filtros" aria-label="Pesquisa e filtros" className="rounded-2xl border border-border bg-income-surface/90 p-3 md:p-4">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-55" aria-hidden="true" />
            <label htmlFor="search-input" className="sr-only">Pesquisar oportunidades</label>
            <input
              id="search-input"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelectedDiscoveryTag(null);
                setCurrentPage(1);
              }}
              placeholder="Pesquisar por nome, categoria ou tag..."
              className="min-h-11 w-full rounded-xl border border-border bg-background pl-10 pr-10 py-2.5 text-sm outline-none transition-colors focus:border-neon"
            />
            {query.trim().length > 0 && (
              <button
                type="button"
                aria-label="Limpar pesquisa"
                onClick={() => {
                  setQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full opacity-70 transition hover:bg-surface hover:opacity-100"
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
            className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors ${activeFilterCount > 0
              ? 'border-neon bg-neon/15 text-neon hover:bg-neon hover:text-black'
              : 'border-border bg-background hover:border-neon hover:text-neon'
              }`}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <span>Filtros e ordenação</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-neon px-1.5 text-xs font-extrabold text-black">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </section>

      <div ref={cardsResultsRef} className="scroll-mt-24 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm opacity-75">{filteredPrograms.length} oportunidades encontradas</p>
        {hasAnyActiveFilter && (
          <div className="flex flex-wrap items-center gap-2">
            {selectedDiscoveryTag && (
              <span className="rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-xs font-bold text-neon">
                Objetivo: {selectedDiscoveryTag}
              </span>
            )}
            {category !== 'todas' && (
              <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold">
                Categoria: {category}
              </span>
            )}
            {difficulty !== 'todas' && (
              <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold">
                Dificuldade: {difficulty}
              </span>
            )}
            {(sort !== 'relevancia' || sortDirection !== 'desc') && (
              <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold">
                Ordem: {sort} ({sortDirection === 'asc' ? 'crescente' : 'decrescente'})
              </span>
            )}
            <button
              type="button"
              onClick={resetAllFilters}
              className="rounded-full border border-border px-3 py-1 text-xs font-semibold hover:border-neon hover:text-neon"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      <section id="programs-grid" className="programs-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {gridEntries.map((entry, gridIndex) => {
          const adBannerAfterSix = gridIndex === 6 ? (
            <div key="in-feed-ad-banner" className="col-span-full">
              <AdBannerContent
                placement="in-feed"
                slots={adSlots}
                monthlyPriceCents={adPriceCents}
                isPromotionActive={adPromotionActive}
              />
            </div>
          ) : null;

          if (entry.kind === 'editorial') {
            return (
              <Fragment key={entry.key}>
                {adBannerAfterSix}
                <EditorialCardView card={entry.card} />
              </Fragment>
            );
          }

          if (entry.kind === 'resource') {
            const embeddedResource = entry.resource;
            const meta = EMBEDDED_RESOURCE_MEDIA[embeddedResource.slug] ?? {
              areaId: 'renda-extra',
              priceTag: embeddedResource.badgeLabel,
              incomePotential: 'R$ 500 a R$ 3.000/mês',
              eyebrow: 'Ferramenta NKL',
            };
            const thumbSrc =
              PORTAL_AREA_CARDS.find((card) => card.id === meta.areaId)?.media?.src ??
              '/images/areas/renda-extra.jpg';

            return (
              <Fragment key={entry.key}>
                {adBannerAfterSix}
                <article
                  onClick={() => router.push(embeddedResource.offerRoute)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      router.push(embeddedResource.offerRoute);
                    }
                  }}
                  role="link"
                  tabIndex={0}
                  aria-label={`Abrir ${embeddedResource.title}`}
                  className="group relative flex min-h-full cursor-pointer flex-col gap-3 rounded-xl border border-border bg-income-card/95 p-4 [container-type:inline-size] transition-colors hover:border-neon/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon md:gap-4 md:p-6"
                >
                  <div className="absolute right-3 top-3 z-20 md:right-4 md:top-4" onClick={(event) => event.stopPropagation()}>
                    <Link
                      href={embeddedResource.offerRoute}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border bg-income-card/90 font-bold shadow-sm backdrop-blur-sm transition-colors hover:border-neon hover:text-neon"
                      aria-label={`Abrir ${embeddedResource.title}`}
                      title={`Abrir ${embeddedResource.title}`}
                    >
                      <Bookmark size={16} aria-hidden="true" />
                    </Link>
                  </div>
                  <div className="min-w-0 pr-14">
                    <p className="text-xs font-bold uppercase tracking-wide text-neon">{meta.eyebrow}</p>
                    <h2 className="mt-1 line-clamp-2 break-words font-playfair text-xl font-bold leading-snug sm:text-2xl">{embeddedResource.title}</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex min-h-8 shrink-0 items-center rounded-full border border-neon px-2.5 py-1 text-xs font-bold">
                      10.0/10
                    </span>
                    <span className="inline-flex max-w-full items-center rounded-full border border-neon/40 bg-neon/10 px-2.5 py-1 text-xs font-bold leading-tight text-neon">
                      {meta.incomePotential}
                    </span>
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium">Português</span>
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium">
                      {embeddedResource.hasStandalonePwa ? 'App Instalável' : 'Acesso Digital'}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm leading-relaxed opacity-75">{embeddedResource.aspirationalLead}</p>
                  <div className="mt-auto flex min-w-0 flex-col gap-2">
                    <div className="flex min-h-16 items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap content-start items-start gap-1.5">
                          <span className="whitespace-nowrap rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-neon">Começar imediato</span>
                          {embeddedResource.bonuses.slice(0, 2).map((bonus) => (
                            <span key={bonus} className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-border px-2.5 py-1 text-xs opacity-75">
                              {bonus}
                            </span>
                          ))}
                        </div>
                        <p className="mt-1 text-xs opacity-50">Nota máxima NKL · {meta.priceTag}</p>
                      </div>
                      <Link
                        href={embeddedResource.offerRoute}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background p-1 shadow-sm transition-transform hover:scale-105 hover:border-neon"
                        aria-label={`Ver ${embeddedResource.title}`}
                      >
                        <img
                          src={thumbSrc}
                          alt={`Capa ${embeddedResource.title}`}
                          className="h-full w-full rounded-md object-cover"
                        />
                      </Link>
                    </div>
                    <div className="flex min-w-0 w-full items-center gap-1.5">
                      <Link
                        href={embeddedResource.offerRoute}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-border px-3 text-xs font-bold leading-none hover:border-neon sm:text-sm"
                      >
                        Ler mais
                      </Link>
                      <Link
                        href={embeddedResource.offerRoute}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex h-11 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-md bg-neon px-3 text-xs font-bold leading-none text-black hover:opacity-90 sm:text-sm"
                      >
                        Conhecer oferta
                      </Link>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void shareResourceOffer(embeddedResource);
                        }}
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border text-neon transition-colors hover:border-neon hover:bg-neon/10"
                        aria-label={`Compartilhar ${embeddedResource.title}`}
                        title="Compartilhar"
                      >
                        <Share2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              </Fragment>
            );
          }

          const program = entry.program;
          const index = entry.isFirst ? 0 : 1;
          const rating = program.finalRating;
          const ratingLabel = program.communityRating === null ? 'nota editorial' : `${program.communityReviewCount} avaliações`;
          const visibleTags = program.communityTags.length >= 1 ? program.communityTags : program.tags;
          const isDescriptionExpanded = expandedDescriptionSlugs.includes(program.slug);

          return (
            <Fragment key={entry.key}>
              {adBannerAfterSix}
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
                className="group relative flex min-h-full cursor-pointer flex-col gap-3 rounded-xl border border-border bg-income-card/95 p-4 [container-type:inline-size] transition-colors hover:border-neon/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon md:gap-4 md:p-6"
              >
                <div className="absolute right-3 top-3 z-20 md:right-4 md:top-4" onClick={(event) => event.stopPropagation()}>
                  <SaveProgramButton
                    slug={program.slug}
                    name={program.name}
                    compact
                    overlay
                    nextPath={`/programas/${program.slug}`}
                    isSaved={savedSlugSet.has(program.slug)}
                  />
                </div>
                <div className="min-w-0 pr-14">
                  <p className="text-xs font-bold uppercase tracking-wide text-neon">{program.category}</p>
                  <h2 className="mt-1 line-clamp-2 break-words font-playfair text-xl font-bold leading-snug sm:text-2xl">{program.name}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button id={index === 0 ? 'nota-comunidade' : undefined} data-tutorial={index === 0 ? 'program-rating' : undefined} type="button" onClick={(event) => { event.stopPropagation(); openProgram(program); }} className="community-rating min-h-8 shrink-0 rounded-full border border-neon px-2.5 py-1 text-xs font-bold transition-colors hover:bg-neon hover:text-black" aria-label={`Avaliar ${program.name}`}>
                    {rating.toFixed(1)}/10
                  </button>
                  <span className="pointer-events-none select-none inline-flex max-w-full items-center rounded-full border border-neon/40 bg-neon/10 px-2.5 py-1 text-xs font-bold leading-tight text-neon">
                    {program.averageEarning}
                  </span>
                  {program.languages.map((language) => (
                    <span key={language} className="pointer-events-none select-none rounded-full border border-border px-2.5 py-1 text-xs font-medium">
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
                {program.slug === 'micro1' && (
                  <Micro1OpportunitiesSection
                    opportunities={micro1Opportunities}
                    error={micro1Error}
                    variant="card"
                  />
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
                  <div className="flex min-w-0 w-full items-center gap-1.5">
                    <button type="button" onClick={(event) => { event.stopPropagation(); openProgram(program); }} className="inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-border px-3 text-xs font-bold leading-none hover:border-neon sm:text-sm">Ler mais</button>
                    {program.slug === 'quintoandar-indica-ai' ? (
                      <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedProgram(program); setShowReferralModal(true); }} className="inline-flex h-11 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-md bg-neon px-3 text-xs font-bold leading-none text-black hover:opacity-90 sm:text-sm">
                        Quero começar
                      </button>
                    ) : (
                      <OutboundLink href={program.affiliateUrl ?? program.websiteUrl} trackingId={program.slug} sponsored={Boolean(program.affiliateUrl)} onClick={(event) => event.stopPropagation()} className="inline-flex h-11 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-md bg-neon px-3 text-xs font-bold leading-none text-black hover:opacity-90 sm:text-sm">
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
        <section id="sugestao" className="scroll-mt-24 space-y-4 rounded-xl border border-border bg-income-surface/90 p-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-neon font-bold">Ajude a ampliar o catálogo</p>
            <h2 className="font-playfair text-2xl font-bold mt-1">Sugira uma oportunidade</h2>
            <p className="mt-3 text-sm leading-relaxed opacity-70">Envie o site ou serviço pelo formulário oficial. A equipe analisa cada indicação antes de incluí-la no catálogo.</p>
          </div>
          <Link href="/sugerir?area=renda-extra&origem=%2Fprogramas" className="inline-flex min-h-11 items-center justify-center rounded-md bg-neon px-5 py-3 text-sm font-bold text-black hover:opacity-90">
            Abrir formulário de sugestão
          </Link>
        </section>
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
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1 font-bold text-orange-500 dark:text-orange-400">
                Nota {selectedProgram.editorialRating.toFixed(1)}/10
              </span>
              <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 font-bold">
                Potencial: {selectedProgram.earningPotential ?? selectedProgram.averageEarning}
              </span>
              <span className="inline-flex items-center rounded-full border border-neon/40 px-3 py-1 font-medium capitalize text-neon">
                {selectedProgram.difficulty}
              </span>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed opacity-85">
              {selectedProgram.longDescription || selectedProgram.shortDescription}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {selectedProgram.slug === 'quintoandar-indica-ai' ? (
                <button type="button" onClick={() => setShowReferralModal(true)} className="inline-flex min-h-11 items-center rounded-md bg-neon px-4 py-2 text-sm font-bold text-black hover:opacity-90">Quero começar</button>
              ) : (
                <OutboundLink href={selectedProgram.affiliateUrl ?? selectedProgram.websiteUrl} trackingId={selectedProgram.slug} sponsored={Boolean(selectedProgram.affiliateUrl)} className="inline-flex min-h-11 items-center rounded-md bg-neon px-4 py-2 text-sm font-bold text-black hover:opacity-90">Acessar plataforma</OutboundLink>
              )}
            </div>
            <ProgramFirstWithdrawal slug={selectedProgram.slug} programName={selectedProgram.name} paymentMethods={selectedProgram.paymentMethods} defaultOpen />
            <ProgramStrategies slug={selectedProgram.slug} category={selectedProgram.category} tags={selectedProgram.tags} />
            {selectedProgram.slug === BUY_ME_A_COFFEE_SLUG && (
              <section className="mt-5 rounded-lg border border-neon/25 bg-neon/5 p-4">
                <p className="text-sm leading-relaxed">Convide outras pessoas para conhecer esta oportunidade.</p>
                <OutboundLink
                  href={BUY_ME_A_COFFEE_INVITE_URL}
                  trackingId="buy-me-a-coffee-invite"
                  sponsored
                  className="mt-3 inline-flex min-h-11 items-center rounded-md bg-neon px-4 py-2 text-sm font-bold text-black hover:opacity-90"
                >
                  Convidar no Pague um Café
                </OutboundLink>
              </section>
            )}
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
                        <button type="button" onClick={() => void shareProgram(selectedProgram, project.href)} className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border text-neon hover:border-neon" aria-label={`Compartilhar projeto ${project.title}`}>
                          <Share2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {selectedProgram.slug === 'micro1' && (
              <div className="mt-5">
                <Micro1OpportunitiesSection
                  opportunities={micro1Opportunities}
                  error={micro1Error}
                  variant="full"
                />
              </div>
            )}
            {selectedProgram.slug === 'marketplaces-afiliados' && (
              <section className="mt-5 rounded-lg border border-border bg-background p-4">
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
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedProgram.languages.map((language) => <span key={`language-${language}`} className="rounded-full border border-neon/50 px-2.5 py-1 text-xs font-medium text-neon">{language}</span>)}
              {(selectedProgram.communityTags.length >= 1 ? selectedProgram.communityTags : selectedProgram.tags).map((tag) => <span key={tag} className="rounded-full border border-border px-2.5 py-1 text-xs">{tag}</span>)}
            </div>
            <div className="mt-6 space-y-4 border-t border-border pt-5">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/programas/${selectedProgram.slug}`} className="inline-flex min-h-11 items-center rounded-md border border-orange-500/60 px-4 py-2 text-sm font-bold text-orange-500 hover:bg-orange-500/10 dark:text-orange-400">
                  Abrir página completa
                </Link>
                <button type="button" onClick={() => setShowReviewForm((visible) => !visible)} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 py-2 text-sm font-bold hover:border-orange-500">
                  {showReviewForm ? 'Ocultar avaliação' : 'Avaliar oportunidade'}
                </button>
                <SaveProgramButton
                  slug={selectedProgram.slug}
                  name={selectedProgram.name}
                  nextPath={`/programas/${selectedProgram.slug}`}
                  isSaved={savedSlugSet.has(selectedProgram.slug)}
                />
                <SocialEmbed
                  youtubeId={selectedProgram.youtubeVideoId}
                  tiktokId={selectedProgram.tiktokVideoId}
                  programName={selectedProgram.name}
                  triggerLabel="Ver vídeo"
                />
                <button
                  type="button"
                  onClick={() => void shareProgram(selectedProgram)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-neon px-4 py-2 text-sm font-bold text-neon transition-colors hover:bg-neon hover:text-black"
                >
                  <Share2 size={16} aria-hidden="true" />
                  <span>Compartilhar</span>
                </button>
              </div>
              {showReviewForm && <form action={reviewAction} className="mt-4 space-y-4 border-t border-border pt-5">
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
              <ProgramSecondaryOffer programSlug={selectedProgram.slug} currentPage={safeCurrentPage} />
            </div>
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
      {filtersOpen && (
        <div
          className="fixed inset-0 z-[310] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setFiltersOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filtros e ordenação"
            className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon">Catálogo de Renda Extra</p>
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
              <label className="text-sm sm:col-span-2">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide opacity-65">Categoria</span>
                <select
                  id="category-filters"
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-neon"
                >
                  <option value="todas">Todas as categorias</option>
                  {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>

              <label className="text-sm">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide opacity-65">Dificuldade</span>
                <select
                  value={difficulty}
                  onChange={(event) => {
                    setDifficulty(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-neon"
                >
                  <option value="todas">Todas</option>
                  <option value="fácil">Fácil</option>
                  <option value="médio">Médio</option>
                  <option value="difícil">Difícil</option>
                </select>
              </label>

              <label className="text-sm">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide opacity-65">Ordenar por</span>
                <select
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-neon"
                >
                  <option value="relevancia">Relevância</option>
                  <option value="nota">Nota</option>
                  <option value="ganhos">Ganhos</option>
                  <option value="nome">Nome</option>
                </select>
              </label>

              <label className="text-sm sm:col-span-2">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide opacity-65">Direção</span>
                <select
                  value={sortDirection}
                  onChange={(event) => {
                    setSortDirection(event.target.value as 'asc' | 'desc');
                    setCurrentPage(1);
                  }}
                  className="min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-neon"
                >
                  <option value="desc">Decrescente (melhores primeiro)</option>
                  <option value="asc">Crescente (A–Z / menor primeiro)</option>
                </select>
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <button
                type="button"
                onClick={resetAllFilters}
                className="min-h-11 rounded-xl border border-border px-4 py-2 text-sm font-semibold transition hover:border-neon hover:text-neon"
              >
                Limpar filtros
              </button>
              <button
                type="button"
                onClick={() => {
                  setFiltersOpen(false);
                  scrollToCards();
                }}
                className="min-h-11 rounded-xl bg-neon px-5 py-2 text-sm font-bold text-black transition hover:opacity-90"
              >
                Ver {filteredPrograms.length} resultados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
