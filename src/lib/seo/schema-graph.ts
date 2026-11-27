import { absoluteSiteUrl, SITE_URL } from '@/lib/site';
import type { StringCatalogEntry } from '@/lib/seo/string-catalog-all';

export const SITE_CONTENT_LAST_MODIFIED = '2026-11-27T00:00:00.000Z';

export const SCHEMA_IDS = {
  organization: `${SITE_URL}/#organization`,
  website: `${SITE_URL}/#website`,
  author: `${SITE_URL}/#author`,
  programsDataset: `${SITE_URL}/programas#dataset`,
  stringsDataset: `${SITE_URL}/catalogo#dataset`,
} as const;

const OFFICIAL_SOCIAL_PROFILES = [
  'https://www.instagram.com/nkloficial/',
  'https://www.tiktok.com/@nkloficial',
  'https://www.youtube.com/@nkloficial',
];

function parsePositiveNumber(value: string | null | undefined): number | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Number(parsed.toFixed(2));
}

function addPropertyValue(
  properties: Array<Record<string, unknown>>,
  name: string,
  value: string | null | undefined,
): void {
  if (typeof value !== 'string') return;
  const trimmed = value.trim();
  if (trimmed === '') return;
  properties.push({
    '@type': 'PropertyValue',
    name,
    value: trimmed,
  });
}

export function buildOrganizationNode(): Record<string, unknown> {
  return {
    '@type': 'Organization',
    '@id': SCHEMA_IDS.organization,
    name: 'Portal NKL',
    url: SITE_URL,
    logo: absoluteSiteUrl('/NKL.png'),
    sameAs: OFFICIAL_SOCIAL_PROFILES,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'contato@nkloficial.com.br',
      availableLanguage: ['Portuguese'],
    },
  };
}

export function buildWebsiteNode(): Record<string, unknown> {
  return {
    '@type': 'WebSite',
    '@id': SCHEMA_IDS.website,
    name: 'Portal NKL',
    url: SITE_URL,
    inLanguage: 'pt-BR',
    publisher: { '@id': SCHEMA_IDS.organization },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/programas?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildAuthorPersonNode(): Record<string, unknown> {
  return {
    '@type': 'Person',
    '@id': SCHEMA_IDS.author,
    name: 'NKL_oficial',
    url: absoluteSiteUrl('/metodologia'),
    worksFor: { '@id': SCHEMA_IDS.organization },
    sameAs: OFFICIAL_SOCIAL_PROFILES,
    knowsAbout: [
      'Renda Extra Online',
      'Economia Digital',
      'Cordas de Violino',
      'Luteria e Acústica Musical',
      'Inteligência Artificial Aplicada',
      'Aprendizado de Idiomas',
    ],
  };
}

export function buildProgramsDatasetNode(
  programCount: number,
  dateModified: string,
): Record<string, unknown> {
  return {
    '@type': 'Dataset',
    '@id': SCHEMA_IDS.programsDataset,
    url: absoluteSiteUrl('/programas'),
    inLanguage: 'pt-BR',
    creator: { '@id': SCHEMA_IDS.organization },
    dateModified,
    name: `Levantamento Portal NKL de Renda Extra e Plataformas Digitais (${programCount} programas)`,
    description:
      'Base editorial verificada com plataformas de renda extra, requisitos de entrada, meios de saque em BRL e USD, exigência de investimento inicial e avaliações da comunidade.',
    variableMeasured: [
      'Investimento inicial exigido',
      'Moeda e meios de pagamento',
      'Faixa estimada de ganhos',
      'Idiomas necessários',
      'Nota editorial e avaliação comunitária',
      'Compatibilidade com celular',
    ],
  };
}

export function buildStringsDatasetNode(
  stringCount: number,
  dateModified: string,
): Record<string, unknown> {
  return {
    '@type': 'Dataset',
    '@id': SCHEMA_IDS.stringsDataset,
    url: absoluteSiteUrl('/catalogo'),
    inLanguage: 'pt-BR',
    creator: { '@id': SCHEMA_IDS.organization },
    dateModified,
    name: `Catálogo Técnico Portal NKL de Cordas para Violino (${stringCount} encordoamentos)`,
    description:
      'Base comparativa de encordoamentos para violino com material do núcleo, cor sonora, projeção, velocidade de resposta, durabilidade, sensibilidade climática e preços em reais.',
    variableMeasured: [
      'Material do núcleo',
      'Cor e brilho sonoro',
      'Projeção acústica',
      'Velocidade de resposta',
      'Durabilidade',
      'Sensibilidade climática',
      'Faixa de preço em BRL',
      'Nota da comunidade',
    ],
  };
}

export function buildStringProductNode(
  stringData: StringCatalogEntry,
  reviewCount: number,
): Record<string, unknown> {
  const additionalProperty: Array<Record<string, unknown>> = [];
  addPropertyValue(additionalProperty, 'Material do núcleo', stringData.coreMaterial);
  addPropertyValue(additionalProperty, 'Cor sonora', stringData.soundColor);
  addPropertyValue(additionalProperty, 'Projeção', stringData.projection);
  addPropertyValue(additionalProperty, 'Velocidade de resposta', stringData.responseSpeed);
  addPropertyValue(additionalProperty, 'Durabilidade', stringData.durability);
  addPropertyValue(additionalProperty, 'Sensibilidade climática', stringData.climateSensitivity);

  const minPrice = parsePositiveNumber(stringData.priceMin);
  const maxPrice = parsePositiveNumber(stringData.priceMax);
  const realPrice = parsePositiveNumber(stringData.realPrice);

  let offers: Record<string, unknown> | undefined;
  if (minPrice !== null && maxPrice !== null) {
    offers = {
      '@type': 'AggregateOffer',
      priceCurrency: 'BRL',
      lowPrice: Math.min(minPrice, maxPrice),
      highPrice: Math.max(minPrice, maxPrice),
    };
  } else if (realPrice !== null) {
    offers = {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      price: realPrice,
    };
  }

  const parsedScore =
    typeof stringData.communityScore === 'string' && stringData.communityScore.trim() !== ''
      ? Number(stringData.communityScore)
      : NaN;
  const aggregateRating =
    Number.isFinite(parsedScore) && parsedScore > 0 && reviewCount > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: parsedScore,
          bestRating: 10,
          worstRating: 0,
          ratingCount: reviewCount,
        }
      : undefined;

  const productNode: Record<string, unknown> = {
    '@type': 'Product',
    name: stringData.name,
    category: 'Cordas para Violino',
    url: absoluteSiteUrl(`/catalogo/${stringData.id}`),
  };

  if (additionalProperty.length > 0) {
    productNode.additionalProperty = additionalProperty;
  }
  if (offers) {
    productNode.offers = offers;
  }
  if (aggregateRating) {
    productNode.aggregateRating = aggregateRating;
  }

  return productNode;
}
