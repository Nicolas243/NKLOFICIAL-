import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { PDFDocument } from 'pdf-lib';
import {
  FREE_MATERIALS,
  generateFreeMaterialPdf,
  getGuideAsset,
  getGuideAssetsForOffer,
  loadFreeMaterial,
} from '@/lib/guide-assets';
import {
  calculateLanguageBundleDiscount,
  getDiscountedLanguagePriceCents,
  getGuideCancelPath,
  isComingSoonLanguageOffer,
} from '@/lib/guide-offer';
import {
  ENGLISH_EBOOK_SAMPLE_LESSON_COUNT,
  readEnglishEbookPublicSample,
} from '@/lib/english-ebook';
import { YOUGLISH_LANGUAGE_SLUGS } from '@/components/language-ebook-preview';
import { getLanguageContent } from '@/components/language-learning-page';

test('loads or generates free income material PDF without ENOENT and never uses paid R$ 39 guide', async () => {
  const loaded = await loadFreeMaterial('income');
  assert.equal(loaded.filename, 'guia-renda-extra-nkl.pdf');
  assert.doesNotMatch(loaded.filename, /2027/u);
  assert.ok(loaded.content.byteLength > 100);
  const parsedPdf = await PDFDocument.load(loaded.content);
  assert.ok(parsedPdf.getPageCount() >= 1);

  const fallback = await loadFreeMaterial('income', path.join(process.cwd(), '__nonexistent_dir__'));
  assert.equal(fallback.filename, 'guia-renda-extra-nkl.pdf');
  const fallbackPdf = await PDFDocument.load(fallback.content);
  assert.equal(fallbackPdf.getPageCount(), 1);
});

test('generates free music material PDF in memory via pdf-lib without ENOENT', async () => {
  const loaded = await loadFreeMaterial('music');
  assert.equal(loaded.filename, FREE_MATERIALS.music.filename);
  assert.ok(loaded.content.byteLength > 100);
  const parsedPdf = await PDFDocument.load(loaded.content);
  assert.equal(parsedPdf.getPageCount(), 1);

  const generated = await generateFreeMaterialPdf('music');
  const generatedPdf = await PDFDocument.load(generated);
  assert.equal(generatedPdf.getPageCount(), 1);
});

test('uses canonical chines-para-ganhar-possibilidades.pdf filename for Mandarin asset', () => {
  const mandarinAsset = getGuideAsset('mandarim-para-ganhar-possibilidades');
  assert.equal(mandarinAsset.filename, 'chines-para-ganhar-possibilidades.pdf');
  assert.equal(
    mandarinAsset.storagePath,
    'guides/chines-para-ganhar-possibilidades/chines-para-ganhar-possibilidades.pdf',
  );
  const granted = getGuideAssetsForOffer('mandarin-ebook-sales-page');
  assert.equal(granted.length, 1);
  assert.equal(granted[0]?.filename, 'chines-para-ganhar-possibilidades.pdf');

  assert.equal(getGuideAssetsForOffer('sales-page:essential').length, 1);
  assert.equal(getGuideAssetsForOffer('sales-page:essential')[0]?.id, 'guia-essencial-renda-extra-2027');
  assert.equal(getGuideAssetsForOffer('sales-page').length, 5);
  assert.equal(getGuideAssetsForOffer('sales-page:vip').length, 11);
  assert.equal(getGuideAssetsForOffer('mandarin-ebook-sales-page:vip').length, 7);
});

test('marks all 6 language ebook offers as active, resolves cancel paths, and applies 30%/50% progressive upsell', () => {
  for (const [offerVariant, cancelPath] of [
    ['italian-ebook-sales-page', '/guias/italiano'],
    ['french-ebook-sales-page', '/guias/frances'],
    ['german-ebook-sales-page', '/guias/alemao'],
    ['spanish-ebook-sales-page', '/guias/espanhol'],
    ['mandarin-ebook-sales-page', '/guias/chines'],
  ] as const) {
    assert.equal(isComingSoonLanguageOffer(offerVariant), false);
    assert.equal(getGuideCancelPath(offerVariant), cancelPath);
  }
  assert.equal(isComingSoonLanguageOffer('english-ebook-sales-page'), false);
  assert.equal(getGuideCancelPath('english-ebook-sales-page'), '/guias/ingles');
  assert.equal(getGuideCancelPath('guide-page-cta:1'), '/guias/renda-extra');

  assert.equal(calculateLanguageBundleDiscount(0), 0);
  assert.equal(calculateLanguageBundleDiscount(1), 30);
  assert.equal(calculateLanguageBundleDiscount(2), 50);
  assert.equal(calculateLanguageBundleDiscount(4), 50);
  assert.equal(getDiscountedLanguagePriceCents(0), 4700);
  assert.equal(getDiscountedLanguagePriceCents(1), 3290);
  assert.equal(getDiscountedLanguagePriceCents(2), 2350);
});

test('limits public English ebook sample to 5 full lessons and strips locked lessons 6-100 bodies', async () => {
  const sample = await readEnglishEbookPublicSample();
  assert.equal(sample.sampleLessons.length, ENGLISH_EBOOK_SAMPLE_LESSON_COUNT);
  assert.equal(sample.totalLessons, 100);
  assert.equal(sample.totalExamples, 500);
  assert.equal(sample.lockedLessons.length, 95);
  assert.equal(sample.sampleLessons[0]?.number, 1);
  assert.equal(sample.sampleLessons[4]?.number, 5);
  assert.equal(sample.lockedLessons[0]?.number, 6);
  assert.equal(sample.lockedLessons[94]?.number, 100);
  for (const locked of sample.lockedLessons) {
    assert.deepEqual(Object.keys(locked).sort(), ['number', 'title']);
  }
});

test('maps YouGlish language slugs to English identifiers and serves Italian study page in Portuguese', () => {
  assert.deepEqual(YOUGLISH_LANGUAGE_SLUGS, {
    italiano: 'italian',
    frances: 'french',
    alemao: 'german',
    espanhol: 'spanish',
    chines: 'chinese',
  });
  const italian = getLanguageContent('italiano');
  assert.match(italian.title, /Aprenda italiano do zero/u);
  assert.deepEqual(italian.examples[0], ['Mi chiamo Ana.', 'Meu nome é Ana.']);
  assert.deepEqual(italian.examples[3], ['Lavoro da casa.', 'Eu trabalho em casa.']);
});
