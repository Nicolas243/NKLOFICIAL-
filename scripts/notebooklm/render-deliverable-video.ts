import { spawnSync } from 'node:child_process';
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  OUTPUT_PACKS_RELATIVE_DIR,
  sanitizeNotebookLmText,
} from './build-notebooklm-sources';
import { videoManifestSchema, type VideoManifest } from '../../tools/nkl-video-factory';

const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.wav'] as const;
const DEFAULT_CHUNK_SECONDS = 4.5;

export interface UploadMetadata {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  language: 'pt-BR';
  callToAction: string;
  channels: VideoManifest['channels'];
  visibilitySuggestion: 'unlisted' | 'public';
  assets: {
    cover16x9: string;
    cover9x16: string;
    captionsSrt: string;
    video16x9: string | null;
    video9x16: string | null;
    audioSource: string | null;
  };
  generatedAt: string;
}

export interface PackRenderResult {
  slug: string;
  captionsPath: string;
  metadataPath: string;
  audioPath: string | null;
  ffmpegPath: string | null;
  renderedVideo16x9: string | null;
  renderedVideo9x16: string | null;
  status: 'rendered' | 'prepared_no_audio' | 'prepared_no_ffmpeg';
  message: string;
}

function formatSrtTimestamp(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = Math.floor(safeSeconds % 60);
  const millis = Math.round((safeSeconds - Math.floor(safeSeconds)) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

function splitLineIntoCaptionChunks(line: string, maxChars = 72): string[] {
  const words = line.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      current = word;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export function buildCaptionsSrt(
  sourceMarkdown: string,
  targetDurationSeconds = 180,
): string {
  const cleaned = sanitizeNotebookLmText(sourceMarkdown)
    .replace(/^#+\s*/gm, '')
    .replace(/^- \[[ x]\]\s*/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1');

  const rawLines = cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length >= 12 && !line.startsWith('<!--'));

  const chunks: string[] = [];
  for (const line of rawLines) {
    for (const chunk of splitLineIntoCaptionChunks(line, 74)) {
      chunks.push(chunk);
      if (chunks.length >= 80) break;
    }
    if (chunks.length >= 80) break;
  }

  if (chunks.length === 0) {
    chunks.push('Portal NKL — Conteúdo prático em português. Pesquise Portal NKL no Google.');
  }

  const secondsPerCue = Math.max(
    2.5,
    Math.min(DEFAULT_CHUNK_SECONDS, targetDurationSeconds / chunks.length),
  );

  const blocks: string[] = [];
  chunks.forEach((chunk, index) => {
    const startSec = index * secondsPerCue;
    const endSec = startSec + secondsPerCue - 0.15;
    blocks.push(
      `${index + 1}\n${formatSrtTimestamp(startSec)} --> ${formatSrtTimestamp(endSec)}\n${chunk}`,
    );
  });

  return `${blocks.join('\n\n')}\n`;
}

export function buildUploadMetadata(
  slug: string,
  manifest: VideoManifest,
  options: {
    cover16x9Path: string;
    cover9x16Path: string;
    captionsPath: string;
    audioPath: string | null;
    video16x9Path: string | null;
    video9x16Path: string | null;
  },
): UploadMetadata {
  const navboostCta =
    manifest.callToAction ??
    'Pesquise Portal NKL no Google para acessar os materiais completos em PT-BR.';

  const sourceUrl = manifest.sources[0]?.url ?? 'https://nkloficial.com.br';
  const description = sanitizeNotebookLmText(
    [
      manifest.objective,
      '',
      `Público: ${manifest.audience}`,
      `Material de referência: ${sourceUrl}`,
      '',
      navboostCta,
    ].join('\n'),
  );

  const slugTags = slug
    .split('-')
    .map((part) => part.trim())
    .filter((part) => part.length >= 3);

  const tags = Array.from(
    new Set([
      'Portal NKL',
      'NKL',
      'educação prática',
      'Brasil',
      ...slugTags,
    ]),
  ).slice(0, 12);

  return {
    slug,
    title: sanitizeNotebookLmText(manifest.title).slice(0, 100),
    description,
    tags,
    language: manifest.language,
    callToAction: navboostCta,
    channels: manifest.channels,
    visibilitySuggestion: slug.startsWith('ia-') ? 'unlisted' : 'public',
    assets: {
      cover16x9: options.cover16x9Path,
      cover9x16: options.cover9x16Path,
      captionsSrt: options.captionsPath,
      video16x9: options.video16x9Path,
      video9x16: options.video9x16Path,
      audioSource: options.audioPath,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function resolveAudioFile(packDir: string, explicitAudioPath?: string): string | null {
  if (explicitAudioPath) {
    const resolved = path.resolve(explicitAudioPath);
    if (!existsSync(resolved) || !statSync(resolved).isFile()) {
      throw new Error(`Arquivo de áudio informado não encontrado: ${resolved}`);
    }
    return resolved;
  }

  for (const ext of AUDIO_EXTENSIONS) {
    const candidate = path.join(packDir, `audio${ext}`);
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

function searchWingetFfmpeg(localAppData: string | undefined): string | null {
  if (!localAppData) return null;
  const packagesDir = path.join(localAppData, 'Microsoft', 'WinGet', 'Packages');
  if (!existsSync(packagesDir)) return null;

  const packageEntries = readdirSync(packagesDir, { withFileTypes: true });
  for (const entry of packageEntries) {
    if (!entry.isDirectory() || !entry.name.toLowerCase().includes('ffmpeg')) continue;
    const packageRoot = path.join(packagesDir, entry.name);
    const directBin = path.join(packageRoot, 'bin', 'ffmpeg.exe');
    if (existsSync(directBin)) return directBin;

    const nestedEntries = readdirSync(packageRoot, { withFileTypes: true });
    for (const nested of nestedEntries) {
      if (!nested.isDirectory()) continue;
      const nestedBin = path.join(packageRoot, nested.name, 'bin', 'ffmpeg.exe');
      if (existsSync(nestedBin)) return nestedBin;
    }
  }
  return null;
}

export function findFfmpegBinary(env: NodeJS.ProcessEnv = process.env): string | null {
  const lookupCmd = process.platform === 'win32' ? 'where.exe' : 'which';
  const probe = spawnSync(lookupCmd, ['ffmpeg'], { encoding: 'utf8' });
  if (probe.status === 0 && probe.stdout) {
    const firstMatch = probe.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean);
    if (firstMatch && existsSync(firstMatch)) {
      return firstMatch;
    }
  }

  if (process.platform === 'win32') {
    return searchWingetFfmpeg(env.LOCALAPPDATA);
  }

  return null;
}

export function buildFfmpegArgs(options: {
  coverPath: string;
  audioPath: string;
  outputPath: string;
  width: number;
  height: number;
}): string[] {
  const { coverPath, audioPath, outputPath, width, height } = options;
  return [
    '-y',
    '-loop',
    '1',
    '-i',
    coverPath,
    '-i',
    audioPath,
    '-c:v',
    'libx264',
    '-tune',
    'stillimage',
    '-pix_fmt',
    'yuv420p',
    '-vf',
    `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-shortest',
    '-movflags',
    '+faststart',
    outputPath,
  ];
}

function renderMp4WithFfmpeg(
  ffmpegPath: string,
  coverPath: string,
  audioPath: string,
  outputPath: string,
  width: number,
  height: number,
): void {
  const args = buildFfmpegArgs({ coverPath, audioPath, outputPath, width, height });
  const result = spawnSync(ffmpegPath, args, { encoding: 'utf8' });
  if (result.status !== 0) {
    const stderr = result.stderr || result.stdout || 'Erro desconhecido ao executar ffmpeg';
    throw new Error(`Falha ao renderizar ${path.basename(outputPath)}: ${stderr.slice(0, 400)}`);
  }
}

export function processPack(
  packDir: string,
  options: {
    explicitAudioPath?: string;
    ffmpegPath: string | null;
  },
): PackRenderResult {
  const slug = path.basename(packDir);
  const sourcePath = path.join(packDir, 'source.md');
  const manifestPath = path.join(packDir, 'video-manifest.json');
  const cover16x9Path = path.join(packDir, 'cover-16x9.jpg');
  const cover9x16Path = path.join(packDir, 'cover-9x16.jpg');
  const captionsPath = path.join(packDir, 'captions.srt');
  const metadataPath = path.join(packDir, 'metadata-upload.json');

  if (!existsSync(sourcePath)) {
    throw new Error(`source.md ausente em ${packDir}. Rode primeiro build-notebooklm-sources.ts.`);
  }
  if (!existsSync(manifestPath)) {
    throw new Error(`video-manifest.json ausente em ${packDir}. Rode primeiro build-notebooklm-sources.ts.`);
  }

  const sourceMarkdown = readFileSync(sourcePath, 'utf8');
  const manifest = videoManifestSchema.parse(JSON.parse(readFileSync(manifestPath, 'utf8')));

  const captionsSrt = buildCaptionsSrt(sourceMarkdown, manifest.durationSeconds);
  writeFileSync(captionsPath, captionsSrt, 'utf8');

  const audioPath = resolveAudioFile(packDir, options.explicitAudioPath);
  const video16x9Out = path.join(packDir, 'video-16x9.mp4');
  const video9x16Out = path.join(packDir, 'video-9x16.mp4');

  let rendered16x9: string | null = null;
  let rendered9x16: string | null = null;
  let status: PackRenderResult['status'] = 'prepared_no_audio';
  let message = '';

  if (!audioPath) {
    status = 'prepared_no_audio';
    message = `Legendas e metadados gerados. Áudio não encontrado em ${slug} (adicione audio.mp3, audio.m4a ou audio.wav, ou use --audio <caminho>).`;
  } else if (!options.ffmpegPath) {
    status = 'prepared_no_ffmpeg';
    message = `Legendas e metadados gerados, mas ffmpeg não foi encontrado. Instale no Windows com: winget install Gyan.FFmpeg`;
  } else {
    if (!existsSync(cover16x9Path) || !existsSync(cover9x16Path)) {
      throw new Error(`Capas cover-16x9.jpg / cover-9x16.jpg ausentes em ${packDir}.`);
    }
    renderMp4WithFfmpeg(options.ffmpegPath, cover16x9Path, audioPath, video16x9Out, 1920, 1080);
    renderMp4WithFfmpeg(options.ffmpegPath, cover9x16Path, audioPath, video9x16Out, 1080, 1920);
    rendered16x9 = video16x9Out;
    rendered9x16 = video9x16Out;
    status = 'rendered';
    message = `Vídeos video-16x9.mp4 e video-9x16.mp4 renderizados com sucesso em ${slug}.`;
  }

  const metadata = buildUploadMetadata(slug, manifest, {
    cover16x9Path,
    cover9x16Path,
    captionsPath,
    audioPath,
    video16x9Path: rendered16x9,
    video9x16Path: rendered9x16,
  });
  writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');

  return {
    slug,
    captionsPath,
    metadataPath,
    audioPath,
    ffmpegPath: options.ffmpegPath,
    renderedVideo16x9: rendered16x9,
    renderedVideo9x16: rendered9x16,
    status,
    message,
  };
}

function readCliOption(argv: string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
}

function usage(): string {
  return [
    'Render Deliverable Video (NotebookLM Packs)',
    '',
    'Uso:',
    '  npx tsx scripts/notebooklm/render-deliverable-video.ts --pack <slug> [--audio <caminho>]',
    '  npx tsx scripts/notebooklm/render-deliverable-video.ts --all',
  ].join('\n');
}

export async function main(argv = process.argv.slice(2), cwd = process.cwd()): Promise<number> {
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }

  const packSlug = readCliOption(argv, '--pack');
  const allFlag = argv.includes('--all');
  const explicitAudio = readCliOption(argv, '--audio');

  if (!packSlug && !allFlag) {
    process.stderr.write(`Informe --pack <slug> ou --all.\n\n${usage()}\n`);
    return 1;
  }

  if (explicitAudio && allFlag) {
    process.stderr.write('Não combine --audio com --all; informe --pack <slug> ao passar --audio.\n');
    return 1;
  }

  const packsRoot = path.join(cwd, OUTPUT_PACKS_RELATIVE_DIR);
  if (!existsSync(packsRoot)) {
    process.stderr.write(`Pasta ${packsRoot} não encontrada. Execute primeiro: npx tsx scripts/notebooklm/build-notebooklm-sources.ts\n`);
    return 1;
  }

  const targetDirs: string[] = [];
  if (packSlug) {
    const singleDir = path.join(packsRoot, packSlug);
    if (!existsSync(singleDir)) {
      process.stderr.write(`Pack não encontrado: ${singleDir}\n`);
      return 1;
    }
    targetDirs.push(singleDir);
  } else {
    const entries = readdirSync(packsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      targetDirs.push(path.join(packsRoot, entry.name));
    }
  }

  const ffmpegPath = findFfmpegBinary();
  if (!ffmpegPath) {
    process.stdout.write(
      'Aviso: ffmpeg não detectado no PATH nem no WinGet. Para instalar no Windows: winget install Gyan.FFmpeg\n',
    );
  }

  const results: PackRenderResult[] = [];
  for (const dir of targetDirs) {
    const result = processPack(dir, {
      explicitAudioPath: explicitAudio,
      ffmpegPath,
    });
    results.push(result);
  }

  process.stdout.write(`${JSON.stringify({ processed: results.length, ffmpegDetected: Boolean(ffmpegPath), results }, null, 2)}\n`);
  return 0;
}

function isEntrypoint(): boolean {
  const entrypoint = process.argv[1];
  return Boolean(entrypoint && import.meta.url === pathToFileURL(entrypoint).href);
}

if (isEntrypoint()) {
  main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`RENDER_DELIVERABLE_VIDEO_FAILED: ${message}\n`);
      process.exitCode = 1;
    });
}
