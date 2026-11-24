import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  APP_BRAND_NAME,
  APP_BRAND_SHORT_NAME,
  APP_BRAND_TAGLINE,
  APP_ICONS,
  AREA_SUB_APPS,
} from '@/config/app-brand';
import { PAID_PRODUCTS, getProductBySlug } from '@/config/products';
import { PORTAL_TRACKS, getTrackById } from '@/config/tracks';
import { getPortalSurface, isIncomePortalPath } from '@/lib/income-portal';
import {
  PORTAL_AREA_CARDS,
  getValidPortalAreaCards,
  isValidPortalHref,
  type PortalAreaCard,
} from '@/lib/portal-areas';

const REQUIRED_HREFS = [
  '/musica/naipe_cordas',
  '/programas',
  '/blog/aprender/ingles',
  '/ia',
  '/ofertas/pacote-renda-extra',
  '/ofertas/bussola-negocios',
  '/ofertas/ferramenta-ia',
  '/ofertas/curso-ia-pratica',
  '/ofertas/ebook-ingles',
  '/mural-de-parceiros',
] as const;

const COMING_SOON_LANGUAGE_IDS = ['italiano', 'frances', 'alemao', 'espanhol', 'mandarim'] as const;
const EMOJI_PATTERN = /\p{Extended_Pictographic}/u;
const BANNED_JARGON_PATTERN =
  /(mapa editorial|ecossistemas principais|plataforma multidisciplinar|ecossistema|diagn[oó]stico|produ[cç][aã]o editorial|arquitetura|solu[cç][oõ]es integradas)/iu;

const base: PortalAreaCard = {
  id: 'sample',
  title: 'Amostra',
  description: 'Descricao valida.',
  href: '/amostra',
  category: 'income',
  status: 'active',
};

test('registry has unique ids', () => {
  const ids = PORTAL_AREA_CARDS.map((card) => card.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every registry card has title, description and valid href', () => {
  for (const card of PORTAL_AREA_CARDS) {
    assert.ok(card.title.trim().length > 0, `${card.id} sem titulo`);
    assert.ok(card.description.trim().length > 0, `${card.id} sem descricao`);
    assert.ok(isValidPortalHref(card.href), `${card.id} com href invalido: ${card.href}`);
  }
});

test('registry contains every mandatory area href', () => {
  const hrefs = new Set(PORTAL_AREA_CARDS.map((card) => card.href));
  for (const href of REQUIRED_HREFS) {
    assert.ok(hrefs.has(href), `area obrigatoria ausente: ${href}`);
  }
});

test('music area points to the music hub and not to the old catalog home', () => {
  const music = PORTAL_AREA_CARDS.find((card) => card.id === 'nkl-cordas');
  assert.ok(music);
  assert.equal(music.title, 'NKL Cordas — Violino (outros em breve)');
  assert.equal(music.href, '/musica/naipe_cordas');
  assert.equal(music.category, 'music');
  assert.equal(music.status, 'active');
});

test('paid area cards route to dedicated offer pages with human labels', () => {
  const expectedPaidCards = [
    {
      id: 'guia-renda-extra',
      href: '/ofertas/pacote-renda-extra',
      category: 'income',
      accessBadge: 'Guia Completo',
    },
    {
      id: 'quiz-negocios',
      title: 'Bússola de Negócios',
      href: '/ofertas/bussola-negocios',
      category: 'income',
      label: 'Conhecer a Bússola',
      accessBadge: 'Acesso Especial',
    },
    {
      id: 'ferramenta-ia',
      href: '/ofertas/ferramenta-ia',
      category: 'learning',
      accessBadge: 'Acesso Especial',
    },
    {
      id: 'curso-ia',
      href: '/ofertas/curso-ia-pratica',
      category: 'learning',
      accessBadge: 'Guia Completo',
    },
    {
      id: 'ingles',
      href: '/ofertas/ebook-ingles',
      category: 'languages',
      accessBadge: 'Guia Completo',
    },
  ] as const;

  for (const expected of expectedPaidCards) {
    const card = PORTAL_AREA_CARDS.find((entry) => entry.id === expected.id);
    assert.ok(card, `${expected.id} ausente`);
    assert.equal(card.href, expected.href);
    assert.equal(card.category, expected.category);
    assert.equal(card.status, 'active');
    assert.equal(card.accessBadge, expected.accessBadge);
    if ('title' in expected) {
      assert.equal(card.title, expected.title);
    }
    if ('label' in expected) {
      assert.equal(card.label, expected.label);
    }
  }
});

test('advertise card is registered as active', () => {
  const advertise = PORTAL_AREA_CARDS.find((card) => card.id === 'anuncie');
  assert.ok(advertise);
  assert.equal(advertise.href, '/programas/anuncie');
  assert.equal(advertise.category, 'partners');
  assert.equal(advertise.status, 'active');
  assert.equal(advertise.label, 'Anunciar');
});

test('all six language e-book cards are active', () => {
  const english = PORTAL_AREA_CARDS.find((card) => card.id === 'ingles');
  assert.ok(english);
  assert.equal(english.href, '/ofertas/ebook-ingles');
  assert.equal(english.status, 'active');
  for (const id of COMING_SOON_LANGUAGE_IDS) {
    const card = PORTAL_AREA_CARDS.find((entry) => entry.id === id);
    assert.ok(card, `${id} ausente`);
    assert.equal(card.status, 'active', `${id} deveria estar ativo`);
  }
});

test('languages card describes six languages and not seven', () => {
  const languages = PORTAL_AREA_CARDS.find((card) => card.id === 'idiomas');
  assert.ok(languages);
  assert.doesNotMatch(languages.description, /mais cinco op/i);
  assert.match(languages.description, /cinco idiomas/i);
  const languageProducts = PORTAL_AREA_CARDS.filter(
    (card) => card.category === 'languages' && card.id !== 'idiomas',
  );
  assert.equal(languageProducts.length, 6);
  assert.equal(languages.meta, '6 idiomas');
});

test('registry copy has no fixed earnings or guaranteed result promises', () => {
  const forbidden = /(R\$\s?\d)|garantid|ganhe\s+\d|ganhos?\s+de|lucro\s+certo|renda\s+garantida|sem\s+risco/i;
  for (const card of PORTAL_AREA_CARDS) {
    const text = `${card.title} ${card.description} ${card.label ?? ''} ${card.accessBadge ?? ''} ${card.meta ?? ''}`;
    assert.doesNotMatch(text, forbidden, `${card.id} contem promessa de resultado`);
  }
});

test('registry copy contains no emoji', () => {
  for (const card of PORTAL_AREA_CARDS) {
    const text = `${card.title} ${card.description} ${card.label ?? ''} ${card.accessBadge ?? ''} ${card.meta ?? ''}`;
    assert.doesNotMatch(text, EMOJI_PATTERN, `${card.id} contem emoji`);
  }
});

test('registry copy avoids banned corporate or technical jargon', () => {
  for (const card of PORTAL_AREA_CARDS) {
    const text = `${card.title} ${card.description} ${card.label ?? ''} ${card.accessBadge ?? ''} ${card.meta ?? ''}`;
    assert.doesNotMatch(text, BANNED_JARGON_PATTERN, `${card.id} contem jargao proibido`);
  }
});

test('every registry card references an existing local visual media file under public', () => {
  for (const card of PORTAL_AREA_CARDS) {
    assert.ok(card.media, `${card.id} sem media visual`);
    assert.ok(card.media.src.startsWith('/'), `${card.id} deve usar imagem local: ${card.media.src}`);
    assert.ok(card.media.alt.trim().length > 0, `${card.id} sem alt da imagem`);
    const filePath = path.join(process.cwd(), 'public', card.media.src.replace(/^\//, ''));
    assert.ok(fs.existsSync(filePath), `${card.id} imagem ausente em disco: ${filePath}`);
  }
});

test('getValidPortalAreaCards keeps the whole valid registry by default', () => {
  assert.equal(getValidPortalAreaCards().length, PORTAL_AREA_CARDS.length);
});

test('getValidPortalAreaCards drops invalid, empty and duplicated entries safely', () => {
  const input: unknown[] = [
    base,
    { ...base, id: 'no-title', title: '   ' },
    { ...base, id: 'no-description', description: '' },
    { ...base, id: 'bad-href', href: 'javascript:alert(1)' },
    { ...base, id: 'protocol-relative', href: '//evil.example' },
    { ...base, id: 'bad-category', category: 'unknown' },
    { ...base, id: 'bad-status', status: 'archived' },
    { ...base, id: 'external', href: 'https://example.com/area' },
    { ...base, id: 'http-external', href: 'http://example.com/area' },
    { ...base },
    null,
    undefined,
    'texto',
    42,
    {},
  ];
  const result = getValidPortalAreaCards(input);
  assert.deepEqual(
    result.map((card) => card.id),
    ['sample', 'external'],
  );
});

test('getValidPortalAreaCards returns an empty list for non-array input', () => {
  assert.deepEqual(getValidPortalAreaCards([]), []);
  assert.deepEqual(getValidPortalAreaCards(null), []);
  assert.deepEqual(getValidPortalAreaCards('x' as unknown as unknown[]), []);
});

test('isValidPortalHref accepts internal routes and https only', () => {
  assert.equal(isValidPortalHref('/ia'), true);
  assert.equal(isValidPortalHref('https://example.com'), true);
  assert.equal(isValidPortalHref(''), false);
  assert.equal(isValidPortalHref('ia'), false);
  assert.equal(isValidPortalHref('/a b'), false);
  assert.equal(isValidPortalHref(undefined), false);
});

test('getPortalSurface separates root home, music hub and ecosystem verticals', () => {
  assert.equal(getPortalSurface('/'), 'home');
  for (const path of [
    '/musica',
    '/musica/naipe_cordas',
    '/catalogo',
    '/luthiers',
    '/professores',
    '/comparar',
    '/guia-de-cordas',
    '/clinica',
    '/fisica-do-som',
    '/recomendados',
    '/lojas',
    '/noticias',
    '/meu-setup',
    '/contatos',
  ]) {
    assert.equal(getPortalSurface(path), 'music', path);
  }
  for (const path of [
    '/ia',
    '/ia/oferta',
    '/quiz-negocios',
    '/resultado',
    '/blog/aprender/ingles',
    '/guias/ingles',
    '/guias/renda-extra',
    '/programas',
    '/mural-de-parceiros',
  ]) {
    assert.equal(getPortalSurface(path), 'ecosystem', path);
  }
  assert.equal(isIncomePortalPath('/programas'), true);
  assert.equal(isIncomePortalPath('/ia'), false);
});

test('APP_BRAND_NAME is Portal NKL, sub-apps have area names, and all APP_ICONS exist on disk', () => {
  assert.equal(APP_BRAND_NAME, 'Portal NKL');
  assert.equal(APP_BRAND_SHORT_NAME, 'Portal NKL');
  assert.doesNotMatch(`${APP_BRAND_NAME} ${APP_BRAND_TAGLINE}`, EMOJI_PATTERN);
  assert.doesNotMatch(`${APP_BRAND_NAME} ${APP_BRAND_TAGLINE}`, BANNED_JARGON_PATTERN);

  assert.equal(AREA_SUB_APPS['renda-extra'].name, 'Renda Extra');
  assert.equal(AREA_SUB_APPS.musica.name, 'Música');
  assert.equal(AREA_SUB_APPS['idiomas-ia'].name, 'Idiomas');
  assert.equal(AREA_SUB_APPS['ia-completa'].name, 'IA na Prática');

  for (const [groupKey, sizes] of Object.entries(APP_ICONS)) {
    for (const [sizeKey, iconHref] of Object.entries(sizes)) {
      assert.ok(iconHref.startsWith('/'), `${groupKey}.${sizeKey} deve ser caminho local`);
      assert.ok(iconHref.endsWith('.png'), `${groupKey}.${sizeKey} deve ser PNG`);
      const filePath = path.join(process.cwd(), 'public', iconHref.replace(/^\//, ''));
      assert.ok(fs.existsSync(filePath), `${groupKey}.${sizeKey} ausente em disco: ${filePath}`);
    }
  }
});

test('PORTAL_TRACKS defines 4 valid tracks without emojis or banned jargon', () => {
  assert.equal(PORTAL_TRACKS.length, 4);
  const trackIds = PORTAL_TRACKS.map((track) => track.id);
  assert.equal(new Set(trackIds).size, 4);

  for (const track of PORTAL_TRACKS) {
    assert.ok(getTrackById(track.id));
    assert.ok(isValidPortalHref(track.freePortalHref));
    assert.ok(getProductBySlug(track.recommendedProductSlug), `${track.id} produto ausente`);
    assert.equal(track.steps.length, 3);

    const stepText = track.steps
      .map((step) => `${step.tag} ${step.title} ${step.description}`)
      .join(' ');
    const fullText = `${track.title} ${track.shortLabel} ${track.summary} ${stepText}`;
    assert.doesNotMatch(fullText, EMOJI_PATTERN, `${track.id} contem emoji`);
    assert.doesNotMatch(fullText, BANNED_JARGON_PATTERN, `${track.id} contem jargao proibido`);

    track.steps.forEach((step, index) => {
      assert.equal(step.stepNumber, index + 1);
      assert.ok(isValidPortalHref(step.href));
    });
  }
});

test('PAID_PRODUCTS defines 6 unique SKUs with clean copy and standalone non-NKL PWAs', () => {
  assert.equal(PAID_PRODUCTS.length, 6);
  const slugs = PAID_PRODUCTS.map((product) => product.slug);
  assert.equal(new Set(slugs).size, 6);

  for (const product of PAID_PRODUCTS) {
    assert.equal(product.offerRoute, `/ofertas/${product.slug}`);
    assert.equal(product.toolRoute, `/app/${product.slug}`);
    assert.equal(product.checkoutRoute, `/ofertas/${product.slug}/checkout`);
    assert.ok(getTrackById(product.trackId), `${product.slug} trilha ausente`);

    const text = [
      product.title,
      product.shortName,
      product.badgeLabel,
      product.headline,
      product.aspirationalLead,
      product.priceLabel,
      product.billingNote,
      product.ctaLabel,
      ...product.deliverables,
      ...product.bonuses,
      product.pwaBrandName ?? '',
      product.pwaShortName ?? '',
      product.pwaDescription ?? '',
    ].join(' ');
    assert.doesNotMatch(text, EMOJI_PATTERN, `${product.slug} contem emoji`);
    assert.doesNotMatch(text, BANNED_JARGON_PATTERN, `${product.slug} contem jargao proibido`);

    if (product.hasStandalonePwa) {
      assert.ok(product.pwaBrandName && product.pwaBrandName.trim().length > 0);
      assert.ok(product.pwaShortName && product.pwaShortName.trim().length > 0);
      assert.equal(product.pwaBrandName.startsWith('NKL'), false);
      assert.equal(product.pwaShortName.startsWith('NKL'), false);
      const icon192 = product.pwaIcon192;
      const icon512 = product.pwaIcon512;
      assert.ok(icon192 && icon192.endsWith('.png'));
      assert.ok(icon512 && icon512.endsWith('.png'));
      const icon192Path = path.join(process.cwd(), 'public', icon192.replace(/^\//, ''));
      const icon512Path = path.join(process.cwd(), 'public', icon512.replace(/^\//, ''));
      assert.ok(fs.existsSync(icon192Path), `${product.slug} icon192 ausente: ${icon192Path}`);
      assert.ok(fs.existsSync(icon512Path), `${product.slug} icon512 ausente: ${icon512Path}`);
    }
  }
});
