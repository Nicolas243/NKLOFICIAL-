import assert from 'node:assert/strict';
import test from 'node:test';
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
  '/guias/renda-extra',
  '/quiz-negocios',
  '/mural-de-parceiros',
] as const;

const COMING_SOON_LANGUAGE_IDS = ['italiano', 'frances', 'alemao', 'espanhol', 'mandarim'] as const;

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
  assert.equal(music.href, '/musica/naipe_cordas');
  assert.equal(music.category, 'music');
  assert.equal(music.status, 'active');
});

test('quiz and advertise cards are registered as active', () => {
  const quiz = PORTAL_AREA_CARDS.find((card) => card.id === 'quiz-negocios');
  const advertise = PORTAL_AREA_CARDS.find((card) => card.id === 'anuncie');
  assert.ok(quiz && advertise);
  assert.equal(quiz.href, '/quiz-negocios');
  assert.equal(quiz.category, 'income');
  assert.equal(quiz.status, 'active');
  assert.equal(quiz.label, 'Fazer diagnóstico');
  assert.equal(advertise.href, '/programas/anuncie');
  assert.equal(advertise.category, 'partners');
  assert.equal(advertise.status, 'active');
  assert.equal(advertise.label, 'Anunciar');
});

test('only english language e-book is active; five others are coming soon', () => {
  const english = PORTAL_AREA_CARDS.find((card) => card.id === 'ingles');
  assert.ok(english);
  assert.equal(english.href, '/guias/ingles');
  assert.equal(english.status, 'active');
  for (const id of COMING_SOON_LANGUAGE_IDS) {
    const card = PORTAL_AREA_CARDS.find((entry) => entry.id === id);
    assert.ok(card, `${id} ausente`);
    assert.equal(card.status, 'coming-soon', `${id} deveria estar em breve`);
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
    const text = `${card.title} ${card.description} ${card.label ?? ''} ${card.meta ?? ''}`;
    assert.doesNotMatch(text, forbidden, `${card.id} contem promessa de resultado`);
  }
});

test('registry copy contains no emoji', () => {
  const emoji = /\p{Extended_Pictographic}/u;
  for (const card of PORTAL_AREA_CARDS) {
    assert.doesNotMatch(`${card.title} ${card.description}`, emoji, `${card.id} contem emoji`);
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
