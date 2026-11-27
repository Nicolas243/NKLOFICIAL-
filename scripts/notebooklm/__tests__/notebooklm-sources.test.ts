import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { AI_COURSE_MODULES } from '../../../src/lib/ai-course';
import { videoManifestSchema } from '../../../tools/nkl-video-factory';
import {
  buildAllPacksFromInputs,
  buildBatchPowerShellScript,
  buildIndexMarkdown,
  buildNotebookLmPrompt,
  buildVideoManifest,
  LANGUAGE_GUIDE_CONFIGS,
  renderCoverHtml,
  sanitizeNotebookLmText,
  stripHtmlAndEmojis,
} from '../build-notebooklm-sources';
import {
  buildCaptionsSrt,
  buildFfmpegArgs,
  buildUploadMetadata,
  processPack,
  resolveAudioFile,
} from '../render-deliverable-video';

const BANNED_CORPORATE_TERMS = [
  'Diagnóstico',
  'diagnóstico',
  'Mapa editorial',
  'Ecossistemas principais',
  'Plataforma multidisciplinar',
  'Arquitetura',
  'Soluções integradas',
];

test('stripHtmlAndEmojis removes tags, scripts, styles and emojis while preserving PT-BR text', () => {
  const dirty = [
    '<style>.a{color:red}</style>',
    '<h1>Guia Prático</h1>',
    '<p>Olá &amp; bem-vindo ao Portal NKL.</p>',
    '<script>alert(1)</script>',
  ].join('\n');

  const cleaned = stripHtmlAndEmojis(dirty);
  assert.equal(cleaned.includes('<'), false);
  assert.equal(cleaned.includes('>'), false);
  assert.equal(cleaned.includes('alert(1)'), false);
  assert.equal(cleaned.includes('color:red'), false);
  assert.ok(cleaned.includes('Guia Prático'));
  assert.ok(cleaned.includes('Olá & bem-vindo ao Portal NKL.'));

  const withEmoji = sanitizeNotebookLmText('Passo 1 \u{1F680} — Diagnóstico rápido \u{2705}');
  assert.equal(/\p{Extended_Pictographic}/u.test(withEmoji), false);
  assert.equal(withEmoji.includes('Diagnóstico'), false);
  assert.ok(withEmoji.includes('Análise rápido'));
});

test('buildAllPacksFromInputs collects all 15 packs with valid slugs, clean markdown, prompts and manifests', () => {
  const guideContents: Record<string, string | null> = {};
  for (const guide of LANGUAGE_GUIDE_CONFIGS) {
    guideContents[guide.slug] = `# ${guide.title}\n\nConteúdo prático de exemplo para ${guide.slug}.`;
  }

  const packs = buildAllPacksFromInputs({
    modules: AI_COURSE_MODULES,
    guideContents,
    programs: [
      {
        slug: 'utest',
        name: 'uTest',
        category: 'QA e Testes',
        difficulty: 'médio',
        shortDescription: 'Testes funcionais em aplicativos e sites.',
        longDescription: 'Plataforma global de testes de software sob demanda.',
        earningPotential: 'US$ 10 a US$ 30 por ciclo',
        zeroInvestmentRequired: true,
        editorialRating: 9,
        pros: ['Pagamento em dólar'],
        cons: ['Exige atenção a relatórios'],
        requirements: ['Inglês básico para leitura'],
        paymentMethods: ['Payoneer', 'PayPal'],
      },
    ],
    profiles: [
      {
        name: 'Testes de Usabilidade',
        minCapital: '0',
        minTimeHours: 4,
        techLevel: 'low',
        riskLevel: 'low',
      },
    ],
  });

  assert.equal(packs.length, 15);
  assert.equal(packs[0]?.slug, 'ia-01-pensar-com-ia');
  assert.equal(packs[6]?.slug, 'ia-07-codigo-seguranca');
  assert.equal(packs[7]?.slug, 'ingles-para-ganhar-dinheiro');
  assert.equal(packs[12]?.slug, 'chines-para-ganhar-possibilidades');
  assert.equal(packs[13]?.slug, 'guia-renda-extra-57-formas');
  assert.equal(packs[14]?.slug, 'bussola-negocios-18-modelos');

  for (const pack of packs) {
    assert.equal(/\p{Extended_Pictographic}/u.test(pack.sourceMarkdown), false);
    assert.equal(/<[^>]+>/u.test(pack.sourceMarkdown), false);
    for (const term of BANNED_CORPORATE_TERMS) {
      assert.equal(
        pack.sourceMarkdown.includes(term),
        false,
        `Banned term "${term}" found in ${pack.slug}`,
      );
    }

    const prompt = buildNotebookLmPrompt(pack);
    assert.ok(prompt.includes('Português do Brasil'));
    assert.ok(prompt.includes('pesquise Portal NKL no Google'));

    const manifest = buildVideoManifest(pack);
    const validated = videoManifestSchema.parse(manifest);
    assert.equal(validated.rightsConfirmed, true);
    assert.deepEqual(validated.channels, ['youtube', 'facebook']);
    assert.deepEqual(validated.formats, ['horizontal', 'vertical']);

    const html16x9 = renderCoverHtml(pack, '16x9');
    const html9x16 = renderCoverHtml(pack, '9x16');
    assert.ok(html16x9.includes('width: 1920px'));
    assert.ok(html9x16.includes('width: 1080px'));
    assert.ok(html16x9.includes(pack.targetRoute));
  }

  const indexMd = buildIndexMarkdown(packs);
  const ps1 = buildBatchPowerShellScript(packs);
  for (const pack of packs) {
    assert.ok(indexMd.includes(pack.slug));
    assert.ok(ps1.includes(pack.slug));
  }
});

test('buildAllPacksFromInputs handles missing guide files and HTML fallback cleanly', () => {
  const packs = buildAllPacksFromInputs({
    modules: AI_COURSE_MODULES,
    guideContents: {},
    programs: [],
    profiles: [],
    rendaExtraFallbackHtml: '<html><body><h1>57 Formas</h1><p>Conteúdo limpo.</p></body></html>',
  });

  assert.equal(packs.length, 15);
  const englishPack = packs.find((item) => item.slug === 'ingles-para-ganhar-dinheiro');
  assert.ok(englishPack?.sourceMarkdown.includes('Promessa responsável'));

  const rendaPack = packs.find((item) => item.slug === 'guia-renda-extra-57-formas');
  assert.ok(rendaPack?.sourceMarkdown.includes('57 Formas'));
  assert.equal(rendaPack?.sourceMarkdown.includes('<h1>'), false);

  const bussolaPack = packs.find((item) => item.slug === 'bussola-negocios-18-modelos');
  assert.ok(bussolaPack?.sourceMarkdown.includes('Bússola de Negócios'));
});

test('render-deliverable-video generates SRT captions, upload metadata and ffmpeg arguments cleanly', () => {
  const tempRoot = mkdtempSync(path.join(tmpdir(), 'nkl-notebooklm-test-'));
  try {
    const packDir = path.join(tempRoot, 'ia-01-pensar-com-ia');
    const pack = buildAllPacksFromInputs({
      modules: [AI_COURSE_MODULES[0]],
      guideContents: {},
      programs: [],
      profiles: [],
    })[0];
    assert.ok(pack);

    const manifest = buildVideoManifest(pack);
    const captions = buildCaptionsSrt(pack.sourceMarkdown, manifest.durationSeconds);
    assert.ok(captions.includes('00:00:00,000 --> '));

    const metadata = buildUploadMetadata(pack.slug, manifest, {
      cover16x9Path: path.join(packDir, 'cover-16x9.jpg'),
      cover9x16Path: path.join(packDir, 'cover-9x16.jpg'),
      captionsPath: path.join(packDir, 'captions.srt'),
      audioPath: null,
      video16x9Path: null,
      video9x16Path: null,
    });
    assert.equal(metadata.visibilitySuggestion, 'unlisted');
    assert.ok(metadata.callToAction.includes('Portal NKL'));

    const args16x9 = buildFfmpegArgs({
      coverPath: 'cover-16x9.jpg',
      audioPath: 'audio.mp3',
      outputPath: 'video-16x9.mp4',
      width: 1920,
      height: 1080,
    });
    assert.ok(args16x9.includes('libx264'));
    assert.ok(args16x9.includes('+faststart'));
    assert.ok(args16x9.includes('128k'));

    // Simulate processPack on a temporary folder without audio/ffmpeg
    const simDir = tempRoot;
    writeFileSync(path.join(simDir, 'source.md'), pack.sourceMarkdown, 'utf8');
    writeFileSync(path.join(simDir, 'video-manifest.json'), JSON.stringify(manifest), 'utf8');

    const resultNoAudio = processPack(simDir, { ffmpegPath: null });
    assert.equal(resultNoAudio.status, 'prepared_no_audio');
    assert.equal(existsSync(path.join(simDir, 'captions.srt')), true);
    assert.equal(existsSync(path.join(simDir, 'metadata-upload.json')), true);

    // Simulate dropping audio.m4a without ffmpeg installed
    const m4aPath = path.join(simDir, 'audio.m4a');
    writeFileSync(m4aPath, 'fake-m4a-header', 'utf8');
    assert.equal(resolveAudioFile(simDir), m4aPath);

    const resultNoFfmpeg = processPack(simDir, { ffmpegPath: null });
    assert.equal(resultNoFfmpeg.status, 'prepared_no_ffmpeg');
    const savedMetadata = JSON.parse(readFileSync(path.join(simDir, 'metadata-upload.json'), 'utf8')) as {
      assets: { audioSource: string | null };
    };
    assert.equal(savedMetadata.assets.audioSource, m4aPath);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
