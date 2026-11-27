import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildFoundationChapters } from '../chapters-foundation';
import { buildScaleChapters } from '../chapters-scale';
import {
  computeBrazilianPaperbackSpineMm,
  sanitizeForWideDistribution,
} from '../multiplatform-export';
import type { BookBusinessProfileRow } from '../types';

describe('sanitizeForWideDistribution', () => {
  it('adapts front-matter and colophon Kindle/KDP store framing to store-neutral copy', () => {
    const sampleFrontMatter = [
      '<p>Esta edição digital Kindle foi publicada na Amazon KDP sob o Selo KDP.</p>',
      '<h2>Como ler e aplicar na edição Kindle</h2>',
      '<p>Na leitura digital em e-reader ou aplicativo Kindle, use o recurso de grifo do Kindle.</p>',
      '<p>Especificação: Padrão KDP · Espaço reservado para código de barras KDP.</p>',
    ].join('\n');

    const result = sanitizeForWideDistribution(sampleFrontMatter);

    assert.equal(result.includes('edição digital Kindle'), false);
    assert.equal(result.includes('publicada na Amazon KDP'), false);
    assert.equal(result.includes('Selo KDP'), false);
    assert.equal(result.includes('Padrão KDP'), false);
    assert.equal(result.includes('aplicativo Kindle'), false);
    assert.equal(result.includes('grifo do Kindle'), false);
    assert.ok(result.includes('edição digital'));
    assert.ok(result.includes('publicada de forma independente'));
    assert.ok(result.includes('Selo Portal NKL'));
    assert.ok(result.includes('Padrão Portal NKL'));
    assert.ok(result.includes('aplicativo de leitura'));
    assert.ok(result.includes('grifo do seu leitor digital'));
  });

  it('preserves educational sections teaching how to publish and earn on Amazon KDP', () => {
    const educationalChapter = [
      '<h2>Capítulo 9: Produtos Digitais, Amazon KDP e Modelos com Investimento Inicial</h2>',
      '<p>Publicação de e-books e livros na Amazon KDP permite ganhar em dólar com Royalties KDP.</p>',
      '<p>Entrada simples: e-book Kindle curto (30 a 60 páginas) nas subcategorias da Amazon.</p>',
    ].join('\n');

    const result = sanitizeForWideDistribution(educationalChapter);

    assert.ok(result.includes('Amazon KDP'));
    assert.ok(result.includes('Royalties KDP'));
    assert.ok(result.includes('subcategorias da Amazon'));
    assert.ok(result.includes('e-book Kindle curto'));
  });

  it('sanitizes real foundation front-matter while keeping KDP scale glossary intact', () => {
    const foundation = buildFoundationChapters();
    const frontMatter = foundation[0];
    assert.ok(frontMatter);

    const sanitizedFrontKindle = sanitizeForWideDistribution(frontMatter.htmlKindle);
    assert.equal(sanitizedFrontKindle.includes('edição Kindle'), false);
    assert.equal(sanitizedFrontKindle.includes('aplicativo Kindle'), false);
    assert.equal(sanitizedFrontKindle.includes('grifo do Kindle'), false);
    assert.ok(sanitizedFrontKindle.includes('edição digital'));

    const mockProfiles: BookBusinessProfileRow[] = [
      {
        id: 'kdp-test',
        name: 'Publicação de e-books e livros na Amazon KDP',
        minCapital: '0',
        minTimeHours: 6,
        techLevel: 'low',
        riskLevel: 'low',
      },
    ];
    const scaleChapters = buildScaleChapters(mockProfiles);
    const scaleText = scaleChapters
      .map((ch) => sanitizeForWideDistribution(ch.htmlKindle))
      .join('\n');

    assert.equal(scaleText.includes('Versão Kindle'), false);
    assert.ok(scaleText.includes('Versão Digital'));
    assert.ok(scaleText.includes('Publicação de e-books e livros na Amazon KDP'));
    assert.ok(scaleText.includes('Royalties KDP'));
  });
});

describe('computeBrazilianPaperbackSpineMm', () => {
  it('computes 90g polen soft spine accurately rounded to 2 decimals', () => {
    // 200 pages = 100 leaves * 0.115mm + 1.2mm = 12.7mm
    assert.equal(computeBrazilianPaperbackSpineMm(200, 90), 12.7);
    // Default paperGsm is 90
    assert.equal(computeBrazilianPaperbackSpineMm(200), 12.7);
    // 401 pages = 201 leaves * 0.115mm + 1.2mm = 24.315 -> 24.32mm
    assert.equal(computeBrazilianPaperbackSpineMm(401, 90), 24.32);
  });

  it('computes 80g offset spine accurately rounded to 2 decimals', () => {
    // 200 pages = 100 leaves * 0.10mm + 1.2mm = 11.2mm
    assert.equal(computeBrazilianPaperbackSpineMm(200, 80), 11.2);
    // 400 pages = 200 leaves * 0.10mm + 1.2mm = 21.2mm
    assert.equal(computeBrazilianPaperbackSpineMm(400, 80), 21.2);
  });

  it('throws on non-positive page counts', () => {
    assert.throws(() => computeBrazilianPaperbackSpineMm(0, 90), RangeError);
    assert.throws(() => computeBrazilianPaperbackSpineMm(-10, 80), RangeError);
  });
});
