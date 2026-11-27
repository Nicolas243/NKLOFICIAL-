import assert from 'node:assert/strict';
import test from 'node:test';
import type { PartnerProgramCard } from '@/actions/partner-programs';
import { computeProgramCatalogStats } from '@/components/seo/catalog-stats-box';
import { INDEXNOW_KEY, buildIndexNowPayload } from '@/lib/seo/indexnow';
import {
  PROGRAM_COMPARISONS,
  buildProgramComparisonVerdict,
  getProgramComparisonBySlug,
  getProgramComparisonsForSlug,
} from '@/lib/seo/program-comparisons';
import {
  SCHEMA_IDS,
  buildAuthorPersonNode,
  buildOrganizationNode,
  buildProgramsDatasetNode,
  buildStringProductNode,
  buildStringsDatasetNode,
  buildWebsiteNode,
} from '@/lib/seo/schema-graph';
import type { StringCatalogEntry } from '@/lib/seo/string-catalog-all';
import {
  STRING_COMPARISONS,
  buildStringComparisonVerdict,
  findStringEntryByName,
  getStringComparisonBySlug,
  getStringComparisonsForName,
  normalizeStringName,
} from '@/lib/seo/string-comparisons';
import { SITE_URL, absoluteSiteUrl } from '@/lib/site';

const EMOJI_PATTERN = /\p{Extended_Pictographic}/u;

function makeProgramFixture(overrides: Partial<PartnerProgramCard>): PartnerProgramCard {
  return {
    id: 'prog-1',
    slug: 'programa-teste',
    name: 'Programa Teste',
    shortDescription: 'Resumo curto de teste.',
    longDescription: 'Descrição longa de teste.',
    category: 'IA e Dados',
    difficulty: 'Média',
    tags: ['ia', 'remoto'],
    websiteUrl: 'https://example.com',
    logoUrl: '',
    affiliateUrl: null,
    editorialRating: 8,
    editorialSource: 'Portal NKL',
    pros: ['Pagamentos em dólar', 'Cadastro direto'],
    cons: ['Exige aprovação em teste'],
    requirements: ['Computador com internet'],
    paymentMethods: ['PayPal', 'Wise'],
    earningPotential: 'US$ 200 ±',
    lastVerifiedAt: '2026-11-20T00:00:00.000Z',
    youtubeVideoId: null,
    tiktokVideoId: null,
    zeroInvestmentRequired: true,
    averageEarning: 'US$ 200 ±',
    languages: ['Português', 'Inglês'],
    finalRating: 8,
    communityRating: null,
    communityReviewCount: 0,
    communityTags: [],
    ...overrides,
  };
}

function makeStringFixture(overrides: Partial<StringCatalogEntry>): StringCatalogEntry {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Corda Teste',
    projection: 'Alta',
    soundColor: 'Equilibrado',
    coreMaterial: 'Sintético',
    priceMin: '350.00',
    priceMax: '450.00',
    realPrice: '399.90',
    responseSpeed: 'Rápida',
    environment: 'Orquestra e Solo',
    qualityLevel: 'Profissional',
    communityScore: '9.2',
    durability: 'Alta',
    climateSensitivity: 'Baixa',
    coating: 'Cromo/Prata',
    fixation: 'Bolinha',
    arcTolerance: 'Alta',
    affiliateLinks: null,
    updatedAt: new Date('2026-11-20T00:00:00.000Z'),
    ...overrides,
  };
}

test('buildIndexNowPayload normalizes relative URLs, strips external hosts, deduplicates and sets keyLocation', () => {
  const payload = buildIndexNowPayload([
    '/programas',
    'programas',
    absoluteSiteUrl('/programas'),
    'comparar/thomastik-dynamo-vs-warchal-timbre',
    'https://evil.example.com/phishing',
    'http://another-domain.example/path',
    '   ',
  ]);

  const expectedHost = new URL(SITE_URL).host;
  assert.equal(payload.host, expectedHost);
  assert.equal(payload.key, INDEXNOW_KEY);
  assert.equal(payload.keyLocation, `${SITE_URL}/${INDEXNOW_KEY}.txt`);
  assert.deepEqual(payload.urlList, [
    `${SITE_URL}/programas`,
    `${SITE_URL}/comparar/thomastik-dynamo-vs-warchal-timbre`,
  ]);
});

test('schema-graph builders link @id references and omit aggregateRating when reviewCount is 0', () => {
  const org = buildOrganizationNode();
  const website = buildWebsiteNode();
  const author = buildAuthorPersonNode();
  const programsDataset = buildProgramsDatasetNode(45, '2026-11-27T00:00:00.000Z');
  const stringsDataset = buildStringsDatasetNode(118, '2026-11-27T00:00:00.000Z');

  assert.equal(org['@id'], SCHEMA_IDS.organization);
  assert.equal(website['@id'], SCHEMA_IDS.website);
  assert.deepEqual(website.publisher, { '@id': SCHEMA_IDS.organization });
  assert.equal(author['@id'], SCHEMA_IDS.author);
  assert.deepEqual(author.worksFor, { '@id': SCHEMA_IDS.organization });
  assert.equal(programsDataset['@id'], SCHEMA_IDS.programsDataset);
  assert.deepEqual(programsDataset.creator, { '@id': SCHEMA_IDS.organization });
  assert.equal(stringsDataset['@id'], SCHEMA_IDS.stringsDataset);
  assert.deepEqual(stringsDataset.creator, { '@id': SCHEMA_IDS.organization });

  const fixtureString = makeStringFixture({
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Thomastik Dynamo',
    communityScore: '9.4',
  });

  const withoutReviews = buildStringProductNode(fixtureString, 0);
  assert.equal('aggregateRating' in withoutReviews, false);
  assert.equal(withoutReviews.url, absoluteSiteUrl(`/catalogo/${fixtureString.id}`));

  const withReviews = buildStringProductNode(fixtureString, 12);
  assert.deepEqual(withReviews.aggregateRating, {
    '@type': 'AggregateRating',
    ratingValue: 9.4,
    bestRating: 10,
    worstRating: 0,
    ratingCount: 12,
  });
});

test('computeProgramCatalogStats calculates exact counts and percentages', () => {
  const fixtures: PartnerProgramCard[] = [
    makeProgramFixture({
      slug: 'p1',
      category: 'IA',
      zeroInvestmentRequired: true,
      averageEarning: 'US$ 300 ±',
      earningPotential: 'US$ 300 ±',
      paymentMethods: ['PayPal'],
      languages: ['Português', 'Inglês'],
      tags: ['ia', 'celular'],
      finalRating: 9,
      lastVerifiedAt: '2026-11-10T00:00:00.000Z',
    }),
    makeProgramFixture({
      slug: 'p2',
      category: 'Pesquisas',
      zeroInvestmentRequired: true,
      averageEarning: 'US$ 50 ±',
      earningPotential: 'US$ 50 ±',
      paymentMethods: ['Wise'],
      languages: ['Inglês'],
      tags: ['pesquisa'],
      requirements: ['Uso pelo computador'],
      shortDescription: 'Estudos acadêmicos online.',
      finalRating: 8,
      lastVerifiedAt: '2026-11-25T00:00:00.000Z',
    }),
    makeProgramFixture({
      slug: 'p3',
      category: 'Comércio',
      zeroInvestmentRequired: false,
      averageEarning: 'R$ 500 ±',
      earningPotential: 'R$ 500 ±',
      paymentMethods: ['Pix'],
      languages: ['Português'],
      tags: ['ecommerce', 'app'],
      finalRating: 7,
      lastVerifiedAt: '2026-11-15T00:00:00.000Z',
    }),
    makeProgramFixture({
      slug: 'p4',
      category: 'IA',
      zeroInvestmentRequired: true,
      averageEarning: 'R$ 200 ±',
      earningPotential: 'R$ 200 ±',
      paymentMethods: ['Pix'],
      languages: ['Espanhol'],
      tags: ['remoto'],
      requirements: ['Desktop'],
      shortDescription: 'Projetos digitais.',
      finalRating: 8,
      lastVerifiedAt: '2026-11-20T00:00:00.000Z',
    }),
  ];

  const stats = computeProgramCatalogStats(fixtures);
  assert.equal(stats.total, 4);
  assert.equal(stats.zeroInvestmentCount, 3);
  assert.equal(stats.zeroInvestmentPct, 75);
  assert.equal(stats.usdCount, 2);
  assert.equal(stats.usdPct, 50);
  assert.equal(stats.portugueseCount, 2);
  assert.equal(stats.portuguesePct, 50);
  assert.equal(stats.mobileCount, 2);
  assert.equal(stats.mobilePct, 50);
  assert.equal(stats.averageRating, 8);
  assert.equal(stats.categoryCount, 3);
  assert.equal(stats.lastVerifiedIso, '2026-11-25T00:00:00.000Z');
});

test('PROGRAM_COMPARISONS has 12 unique pairs and helpers return grounded verdicts without emojis', () => {
  assert.equal(PROGRAM_COMPARISONS.length, 12);
  const slugs = PROGRAM_COMPARISONS.map((entry) => entry.slug);
  assert.equal(new Set(slugs).size, 12);

  for (const entry of PROGRAM_COMPARISONS) {
    assert.equal(EMOJI_PATTERN.test(entry.title), false);
    assert.equal(EMOJI_PATTERN.test(entry.focusKeyword), false);
    assert.equal(getProgramComparisonBySlug(entry.slug)?.slug, entry.slug);
  }

  assert.equal(getProgramComparisonBySlug('inexistente'), null);
  const outlierMatches = getProgramComparisonsForSlug('outlier-ai');
  assert.equal(outlierMatches.length, 2);

  const left = makeProgramFixture({
    slug: 'outlier-ai',
    name: 'Outlier AI',
    category: 'Treinamento de IA',
    averageEarning: 'US$ 300 ±',
    finalRating: 8.6,
    languages: ['Português', 'Inglês'],
    zeroInvestmentRequired: true,
    paymentMethods: ['PayPal', 'AirTM'],
  });
  const right = makeProgramFixture({
    slug: 'dataannotation',
    name: 'DataAnnotation',
    category: 'Treinamento de IA',
    averageEarning: 'US$ 200 ±',
    finalRating: 8.2,
    languages: ['Inglês'],
    zeroInvestmentRequired: true,
    paymentMethods: ['PayPal'],
  });

  const verdict = buildProgramComparisonVerdict(left, right);
  assert.ok(verdict.bluf.trim().length > 20);
  assert.ok(verdict.chooseLeft.length >= 2);
  assert.ok(verdict.chooseRight.length >= 2);
  assert.equal(EMOJI_PATTERN.test(verdict.bluf), false);
});

test('STRING_COMPARISONS has 10 unique pairs, matches all 20 names and builds grounded verdicts', () => {
  assert.equal(STRING_COMPARISONS.length, 10);
  const slugs = STRING_COMPARISONS.map((entry) => entry.slug);
  assert.equal(new Set(slugs).size, 10);

  const allNames = STRING_COMPARISONS.flatMap((entry) => [entry.leftName, entry.rightName]);
  assert.equal(allNames.length, 20);

  const catalogFixtures = allNames.map((name, index) =>
    makeStringFixture({
      id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      name,
    }),
  );

  assert.equal(normalizeStringName('Mauro Calixto Padrão'), 'mauro calixto padrao');
  assert.equal(normalizeStringName('Erudithus #01'), 'erudithus 01');
  assert.equal(normalizeStringName('Thomastik Peter Infeld (PI)'), 'thomastik peter infeld pi');

  for (const entry of STRING_COMPARISONS) {
    assert.equal(EMOJI_PATTERN.test(entry.title), false);
    assert.equal(getStringComparisonBySlug(entry.slug)?.slug, entry.slug);

    const foundLeft = findStringEntryByName(catalogFixtures, entry.leftName);
    const foundRight = findStringEntryByName(catalogFixtures, entry.rightName);
    assert.ok(foundLeft, `Não encontrou ${entry.leftName}`);
    assert.ok(foundRight, `Não encontrou ${entry.rightName}`);
  }

  assert.equal(getStringComparisonBySlug('inexistente'), null);
  assert.equal(findStringEntryByName(catalogFixtures, 'Corda Inexistente'), null);
  assert.equal(getStringComparisonsForName('Mauro Calixto Padrão').length, 1);

  const leftString = makeStringFixture({
    name: 'Thomastik Dynamo',
    coreMaterial: 'Sintético',
    qualityLevel: 'Solista',
    soundColor: 'Rico e focado',
    projection: 'Muito alta',
    responseSpeed: 'Rápida',
    realPrice: '980.00',
    communityScore: '9.5',
  });
  const rightString = makeStringFixture({
    name: 'Warchal Timbre',
    coreMaterial: 'Sintético',
    qualityLevel: 'Profissional',
    soundColor: 'Quente e complexo',
    projection: 'Alta',
    responseSpeed: 'Muito rápida',
    realPrice: '720.00',
    communityScore: '9.1',
  });

  const verdict = buildStringComparisonVerdict(leftString, rightString);
  assert.ok(verdict.bluf.trim().length > 20);
  assert.ok(verdict.chooseLeft.length >= 2);
  assert.ok(verdict.chooseRight.length >= 2);
  assert.equal(EMOJI_PATTERN.test(verdict.bluf), false);
});
