import type { StringCatalogEntry } from '@/lib/seo/string-catalog-all';

export type StringComparisonDefinition = {
  slug: string;
  leftName: string;
  rightName: string;
  title: string;
};

export const STRING_COMPARISONS: StringComparisonDefinition[] = [
  {
    slug: 'thomastik-dynamo-vs-warchal-timbre',
    leftName: 'Thomastik Dynamo',
    rightName: 'Warchal Timbre',
    title: 'Thomastik Dynamo vs Warchal Timbre: qual corda escolher para violino?',
  },
  {
    slug: 'thomastik-dynamo-solo-vs-thomastik-peter-infeld',
    leftName: 'Thomastik Dynamo Solo',
    rightName: 'Thomastik Peter Infeld (PI)',
    title: 'Thomastik Dynamo Solo vs Peter Infeld (PI): comparativo para solistas',
  },
  {
    slug: 'larsen-il-cannone-vs-pirastro-evah-pirazzi',
    leftName: 'Larsen Il Cannone',
    rightName: 'Pirastro Evah Pirazzi',
    title: 'Larsen Il Cannone vs Pirastro Evah Pirazzi: projeção e timbre lado a lado',
  },
  {
    slug: 'pirastro-evah-pirazzi-gold-vs-pirastro-perpetual',
    leftName: 'Pirastro Evah Pirazzi Gold',
    rightName: 'Pirastro Perpetual',
    title: 'Pirastro Evah Pirazzi Gold vs Pirastro Perpetual: qual entrega mais brilho e resposta?',
  },
  {
    slug: 'thomastik-rondo-vs-thomastik-dominant-pro',
    leftName: 'Thomastik Rondo',
    rightName: 'Thomastik Dominant Pro',
    title: 'Thomastik Rondo vs Dominant Pro: diferenças de projeção, núcleo e durabilidade',
  },
  {
    slug: 'warchal-amber-vs-pirastro-obligato',
    leftName: 'Warchal Amber',
    rightName: 'Pirastro Obligato',
    title: 'Warchal Amber vs Pirastro Obligato: comparativo de cordas com som quente',
  },
  {
    slug: 'larsen-il-cannone-gold-vs-evah-pirazzi-neo',
    leftName: 'Larsen Il Cannone Gold',
    rightName: 'Evah Pirazzi Neo',
    title: 'Larsen Il Cannone Gold vs Evah Pirazzi Neo: comparativo técnico completo',
  },
  {
    slug: 'pirastro-oliv-vs-pirastro-passione-solo',
    leftName: 'Pirastro Oliv',
    rightName: 'Pirastro Passione Solo',
    title: 'Pirastro Oliv vs Passione Solo: qual corda de tripa vale mais a pena?',
  },
  {
    slug: 'warchal-the-beast-vs-thomastik-vision-tit-solo',
    leftName: 'Warchal The Beast',
    rightName: 'Thomastik Vision Tit. Solo',
    title: 'Warchal The Beast vs Thomastik Vision Tit. Solo: potência e resposta',
  },
  {
    slug: 'erudithus-01-vs-mauro-calixto-padrao',
    leftName: 'Erudithus #01',
    rightName: 'Mauro Calixto Padrão',
    title: 'Erudithus #01 vs Mauro Calixto Padrão: comparativo de cordas nacionais',
  },
];

export function normalizeStringName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, ' ')
    .trim();
}

export function findStringEntryByName(
  strings: StringCatalogEntry[],
  name: string,
): StringCatalogEntry | null {
  const trimmed = name.trim().toLowerCase();
  const exact = strings.find((entry) => entry.name.trim().toLowerCase() === trimmed);
  if (exact) return exact;

  const target = normalizeStringName(name);
  if (!target) return null;
  return strings.find((entry) => normalizeStringName(entry.name) === target) ?? null;
}

export function getStringComparisonBySlug(slug: string): StringComparisonDefinition | null {
  const normalized = slug.trim().toLowerCase();
  return STRING_COMPARISONS.find((entry) => entry.slug === normalized) ?? null;
}

export function getStringComparisonsForName(stringName: string): StringComparisonDefinition[] {
  const target = normalizeStringName(stringName);
  if (!target) return [];
  return STRING_COMPARISONS.filter(
    (entry) =>
      normalizeStringName(entry.leftName) === target ||
      normalizeStringName(entry.rightName) === target,
  );
}

function parsePositiveNumber(value: string | null | undefined): number | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function resolvePriceNumber(entry: StringCatalogEntry): number | null {
  const real = parsePositiveNumber(entry.realPrice);
  if (real !== null) return real;
  const min = parsePositiveNumber(entry.priceMin);
  const max = parsePositiveNumber(entry.priceMax);
  if (min !== null && max !== null) return Number(((min + max) / 2).toFixed(2));
  return min ?? max;
}

function formatPriceText(price: number | null): string | null {
  if (price === null) return null;
  return `R$ ${price.toFixed(2).replace('.', ',')}`;
}

function buildChooseReasons(
  primary: StringCatalogEntry,
  other: StringCatalogEntry,
): string[] {
  const reasons: string[] = [];

  reasons.push(
    `Procura timbre ${primary.soundColor.toLowerCase()} com projeção ${primary.projection.toLowerCase()} em núcleo ${primary.coreMaterial.toLowerCase()}.`,
  );

  if (primary.responseSpeed || primary.arcTolerance) {
    const responsePart = primary.responseSpeed
      ? `resposta ${primary.responseSpeed.toLowerCase()}`
      : 'resposta equilibrada';
    const arcPart = primary.arcTolerance
      ? ` e tolerância de arco ${primary.arcTolerance.toLowerCase()}`
      : '';
    reasons.push(`Prefere ${responsePart}${arcPart}.`);
  }

  if (primary.environment) {
    reasons.push(`Vai tocar em ${primary.environment.toLowerCase()} (nível ${primary.qualityLevel.toLowerCase()}).`);
  } else if (primary.durability || primary.climateSensitivity) {
    const durabilityPart = primary.durability ? `durabilidade ${primary.durability.toLowerCase()}` : '';
    const climatePart = primary.climateSensitivity
      ? `sensibilidade climática ${primary.climateSensitivity.toLowerCase()}`
      : '';
    const joined = [durabilityPart, climatePart].filter(Boolean).join(' e ');
    if (joined) reasons.push(`Valoriza ${joined}.`);
  }

  const primaryPrice = resolvePriceNumber(primary);
  const otherPrice = resolvePriceNumber(other);
  const primaryScore = parsePositiveNumber(primary.communityScore);
  const otherScore = parsePositiveNumber(other.communityScore);

  if (primaryPrice !== null && otherPrice !== null && primaryPrice < otherPrice) {
    reasons.push(
      `Quer menor desembolso médio (${formatPriceText(primaryPrice)} contra ${formatPriceText(otherPrice)} de ${other.name}).`,
    );
  } else if (primaryScore !== null && otherScore !== null && primaryScore > otherScore) {
    reasons.push(
      `Prioriza a nota mais alta da comunidade (${primaryScore}/10 contra ${otherScore}/10 de ${other.name}).`,
    );
  } else if (primaryPrice !== null) {
    reasons.push(`Está dentro do orçamento médio de ${formatPriceText(primaryPrice)}.`);
  } else if (primary.durability) {
    reasons.push(`Busca durabilidade ${primary.durability.toLowerCase()} no conjunto.`);
  }

  return reasons.slice(0, 4);
}

export function buildStringComparisonVerdict(
  left: StringCatalogEntry,
  right: StringCatalogEntry,
): { bluf: string; chooseLeft: string[]; chooseRight: string[] } {
  const leftPrice = formatPriceText(resolvePriceNumber(left));
  const rightPrice = formatPriceText(resolvePriceNumber(right));
  const leftScore = parsePositiveNumber(left.communityScore);
  const rightScore = parsePositiveNumber(right.communityScore);

  const intro = `${left.name} (núcleo ${left.coreMaterial.toLowerCase()}, nível ${left.qualityLevel.toLowerCase()}) entrega cor de som ${left.soundColor.toLowerCase()} e projeção ${left.projection.toLowerCase()}, enquanto ${right.name} (núcleo ${right.coreMaterial.toLowerCase()}, nível ${right.qualityLevel.toLowerCase()}) oferece som ${right.soundColor.toLowerCase()} e projeção ${right.projection.toLowerCase()}.`;

  const responseParts: string[] = [];
  if (left.responseSpeed) responseParts.push(`${left.name} tem resposta ${left.responseSpeed.toLowerCase()}`);
  if (right.responseSpeed) responseParts.push(`${right.name} tem resposta ${right.responseSpeed.toLowerCase()}`);
  const responseSentence =
    responseParts.length > 0 ? `Na tocabilidade, ${responseParts.join(' e ')}.` : '';

  const priceParts: string[] = [];
  if (leftPrice) priceParts.push(`${left.name} sai em torno de ${leftPrice}`);
  if (rightPrice) priceParts.push(`${right.name} fica na faixa de ${rightPrice}`);
  const scoreParts: string[] = [];
  if (leftScore !== null) scoreParts.push(`${left.name}: ${leftScore}/10`);
  if (rightScore !== null) scoreParts.push(`${right.name}: ${rightScore}/10`);

  const marketSentence = [
    priceParts.length > 0 ? `No mercado brasileiro, ${priceParts.join(' contra ')}.` : '',
    scoreParts.length > 0 ? `Avaliação da comunidade: ${scoreParts.join(' vs ')}.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const bluf = [intro, responseSentence, marketSentence].filter(Boolean).join(' ');

  return {
    bluf,
    chooseLeft: buildChooseReasons(left, right),
    chooseRight: buildChooseReasons(right, left),
  };
}
