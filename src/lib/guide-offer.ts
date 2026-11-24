import { GUIDE_PAGE_CTA_VARIANTS as GUIDE_PAGE_CTA_IDS } from '@/lib/offer-experiment';

export const GUIDE_PRICE_CENTS = 3900;
export const ENGLISH_EBOOK_PRICE_CENTS = 4700;
export const GUIDE_COMPARE_AT_CENTS = 9700;
export const GUIDE_TITLE = 'Guia Essencial Renda Extra 2027 | Portal NKL';
export const ENGLISH_EBOOK_TITLE = 'Inglês para ganhar dinheiro | E-book Portal NKL';
export const GUIDE_SUBSCRIPTION_PRICE_CENTS = 1900;
export const GUIDE_SUBSCRIPTION_TITLE = 'Guias para Liberdade Financeira NKL';
export const GUIDE_OFFER_PROVIDER = 'Stripe';
export const ENGLISH_EBOOK_OFFER_VARIANT = 'english-ebook-sales-page';
export const LANGUAGE_EBOOKS = {
  italiano: { offerVariant: 'italian-ebook-sales-page', title: 'Italiano para ganhar possibilidades | E-book Portal NKL', language: 'Italiano', slug: 'italiano', priceCents: 4700, comingSoon: false },
  frances: { offerVariant: 'french-ebook-sales-page', title: 'Francês para ganhar possibilidades | E-book Portal NKL', language: 'Francês', slug: 'frances', priceCents: 4700, comingSoon: false },
  alemao: { offerVariant: 'german-ebook-sales-page', title: 'Alemão para ganhar possibilidades | E-book Portal NKL', language: 'Alemão', slug: 'alemao', priceCents: 4700, comingSoon: false },
  espanhol: { offerVariant: 'spanish-ebook-sales-page', title: 'Espanhol para ganhar possibilidades | E-book Portal NKL', language: 'Espanhol', slug: 'espanhol', priceCents: 4700, comingSoon: false },
  chines: { offerVariant: 'mandarin-ebook-sales-page', title: 'Mandarim para ganhar possibilidades | E-book Portal NKL', language: 'Mandarim', slug: 'chines', priceCents: 4700, comingSoon: false },
} as const;

export const ALL_LANGUAGE_OFFER_VARIANTS = [
  ENGLISH_EBOOK_OFFER_VARIANT,
  'italian-ebook-sales-page',
  'french-ebook-sales-page',
  'german-ebook-sales-page',
  'spanish-ebook-sales-page',
  'mandarin-ebook-sales-page',
] as const;

export const LANGUAGE_UPSELL_TIERS = [
  { ownedCount: 1, label: '2º Idioma', discountPercent: 30 as const, priceCents: 3290 },
  { ownedCount: 2, label: '3º+ Idioma', discountPercent: 50 as const, priceCents: 2350 },
] as const;

export function calculateLanguageBundleDiscount(ownedLanguageCount: number): 0 | 30 | 50 {
  if (!Number.isFinite(ownedLanguageCount) || ownedLanguageCount <= 0) return 0;
  if (ownedLanguageCount === 1) return 30;
  return 50;
}

export function getDiscountedLanguagePriceCents(
  ownedLanguageCount: number,
  basePriceCents = ENGLISH_EBOOK_PRICE_CENTS,
): number {
  const discount = calculateLanguageBundleDiscount(ownedLanguageCount);
  if (discount === 0) return basePriceCents;
  return Math.round((basePriceCents * (100 - discount)) / 100);
}

export function formatBrlFromCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export type LanguageEbookSlug = keyof typeof LANGUAGE_EBOOKS;
export type LanguageEbookOfferVariant = (typeof LANGUAGE_EBOOKS)[LanguageEbookSlug]['offerVariant'];

export function getLanguageEbookByOffer(offerVariant: string | null | undefined) {
  return Object.values(LANGUAGE_EBOOKS).find((offer) => offer.offerVariant === offerVariant);
}

export function isLanguageEbookOffer(offerVariant: string | null | undefined): boolean {
  return Boolean(getLanguageEbookByOffer(offerVariant));
}

export function isComingSoonLanguageOffer(offerVariant: string | null | undefined): boolean {
  const offer: { comingSoon: boolean } | undefined = getLanguageEbookByOffer(offerVariant);
  return offer?.comingSoon === true;
}

export function getGuideCancelPath(offerVariant: string | null | undefined): string {
  if (offerVariant === ENGLISH_EBOOK_OFFER_VARIANT) return '/guias/ingles';
  const languageEbook = getLanguageEbookByOffer(offerVariant);
  if (languageEbook) return `/guias/${languageEbook.slug}`;
  return '/guias/renda-extra';
}
export function isEnglishEbookOffer(offerVariant: string | null | undefined): boolean {
  return offerVariant === ENGLISH_EBOOK_OFFER_VARIANT;
}

export type GuidePageCtaVariant = (typeof GUIDE_PAGE_CTA_IDS)[number];

export type GuidePageOfferVariant = {
  id: GuidePageCtaVariant;
  title: string;
  summary: string;
  ctaLabel: string;
  angle: string;
};

export const GUIDE_PAGE_CTA_VARIANTS: readonly GuidePageOfferVariant[] = [
  {
    id: '0',
    title: 'Receba os 5 materiais de novembro',
    summary: 'Um pacote organizado para estudar oportunidades de renda extra com mais clareza, sem promessa de resultado.',
    ctaLabel: 'Quero o pacote de novembro',
    angle: 'Pacote de novembro',
  },
  {
    id: '1',
    title: 'Faça um diagnóstico rápido em novembro',
    summary: 'Use os materiais para identificar seus próximos passos e onde seu dinheiro pode estar escapando.',
    ctaLabel: 'Quero fazer meu diagnóstico',
    angle: 'Diagnóstico rápido',
  },
  {
    id: '2',
    title: 'Comece novembro com uma ação prática',
    summary: 'Pare de adiar: encontre orientações simples para escolher uma primeira ação possível.',
    ctaLabel: 'Quero começar com um plano',
    angle: 'Ação imediata',
  },
  {
    id: '3',
    title: 'Organize suas oportunidades em novembro',
    summary: 'Compare ideias, links e passos em um só pacote para decidir por onde começar.',
    ctaLabel: 'Quero organizar minhas escolhas',
    angle: 'Oportunidades',
  },
  {
    id: '4',
    title: 'Prepare-se melhor para a Black Friday',
    summary: 'Veja orientações de novembro para avaliar oportunidades e se proteger de decisões apressadas.',
    ctaLabel: 'Quero me preparar',
    angle: 'Proteção e Black Friday',
  },
];
