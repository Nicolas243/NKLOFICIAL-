'use client';

import { useMemo, useState } from 'react';
import {
  SOCIAL_CHANNELS,
  type ChannelConnectionStatus,
  type PlatformPostOverride,
  type SocialChannel,
  type SocialPublishJob,
} from '../../../tools/social-publisher/types';
import {
  CHANNEL_LIMITS,
  CHANNEL_METADATA,
  composePostText,
  validatePostForChannel,
} from '../../../tools/social-publisher/validators';
import {
  buildDeterministicChannelCopy,
  normalizeTargetUrl,
} from '../../../tools/social-publisher/ai-copy-generator';

interface SocialPublisherStudioProps {
  connectionStatus: ChannelConnectionStatus[];
}

interface ChannelDraft {
  enabled: boolean;
  title: string;
  caption: string;
  hashtagsText: string;
  videoUrl: string;
  scheduledAt: string;
}

const DEFAULT_ENABLED_CHANNELS: SocialChannel[] = [
  'youtube',
  'tiktok',
  'instagram',
  'facebook',
  'bluesky',
  'threads',
  'mastodon',
  'x',
  'kwai',
];

const QUICK_DESTINATION_ROUTES = [
  { label: 'Home (/ )', value: '/' },
  { label: 'Renda Extra (/programas)', value: '/programas' },
  { label: 'Hub de Idiomas (/idiomas)', value: '/idiomas' },
  { label: 'IA na Prática (/ia/oferta)', value: '/ia/oferta' },
  { label: 'Bússola de Negócios (/ofertas/bussola-negocios)', value: '/ofertas/bussola-negocios' },
  { label: 'Naipe de Cordas (/musica/naipe_cordas)', value: '/musica/naipe_cordas' },
] as const;

function buildInitialDrafts(
  topic: string,
  targetPath: string,
  navboostKeyword: string,
): Record<SocialChannel, ChannelDraft> {
  const drafts = {} as Record<SocialChannel, ChannelDraft>;
  for (const channel of SOCIAL_CHANNELS) {
    const generated = buildDeterministicChannelCopy(
      channel,
      topic,
      targetPath,
      navboostKeyword || undefined,
    );
    drafts[channel] = {
      enabled: DEFAULT_ENABLED_CHANNELS.includes(channel),
      title: generated.title ?? '',
      caption: generated.caption,
      hashtagsText: generated.hashtags.join(' '),
      videoUrl: '',
      scheduledAt: '',
    };
  }
  return drafts;
}

function parseHashtags(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function SocialPublisherStudio({ connectionStatus }: SocialPublisherStudioProps) {
  const [jobId, setJobId] = useState('nkl-video-001');
  const [topic, setTopic] = useState('Como organizar sua rotina de estudos e renda com IA prática');
  const [targetPath, setTargetPath] = useState('/ia/oferta');
  const [navboostKeyword, setNavboostKeyword] = useState('portal nkl ia na pratica');
  const [videoPath, setVideoPath] = useState('workspace/videos/nkl-video-horizontal.mp4');
  const [verticalVideoPath, setVerticalVideoPath] = useState('workspace/videos/nkl-video-vertical.mp4');
  const [durationSecondsInput, setDurationSecondsInput] = useState('55');
  const [fileSizeMbInput, setFileSizeMbInput] = useState('28');
  const [copyFeedback, setCopyFeedback] = useState('');

  const [drafts, setDrafts] = useState<Record<SocialChannel, ChannelDraft>>(() =>
    buildInitialDrafts(
      'Como organizar sua rotina de estudos e renda com IA prática',
      '/ia/oferta',
      'portal nkl ia na pratica',
    ),
  );

  const statusByChannel = useMemo(() => {
    const map = new Map<SocialChannel, ChannelConnectionStatus>();
    for (const item of connectionStatus) {
      map.set(item.channel, item);
    }
    return map;
  }, [connectionStatus]);

  const parsedDuration = Number.isFinite(Number(durationSecondsInput)) && durationSecondsInput.trim() !== ''
    ? Number(durationSecondsInput)
    : undefined;
  const parsedFileSizeMb = Number.isFinite(Number(fileSizeMbInput)) && fileSizeMbInput.trim() !== ''
    ? Number(fileSizeMbInput)
    : undefined;

  const jobObject = useMemo<SocialPublishJob>(() => {
    const platforms: Partial<Record<SocialChannel, PlatformPostOverride>> = {};
    for (const channel of SOCIAL_CHANNELS) {
      const draft = drafts[channel];
      if (!draft.enabled) continue;
      const hashtags = parseHashtags(draft.hashtagsText);
      platforms[channel] = {
        enabled: true,
        caption: draft.caption,
        ...(draft.title.trim() ? { title: draft.title.trim() } : {}),
        ...(hashtags.length > 0 ? { hashtags } : {}),
        ...(draft.videoUrl.trim() ? { videoUrl: draft.videoUrl.trim() } : {}),
        ...(draft.scheduledAt.trim() ? { scheduledAt: draft.scheduledAt.trim() } : {}),
      };
    }

    return {
      id: jobId.trim() || 'nkl-video-001',
      topic: topic.trim() || 'Conteúdo Portal NKL',
      ...(videoPath.trim() ? { videoPath: videoPath.trim() } : {}),
      ...(verticalVideoPath.trim() ? { verticalVideoPath: verticalVideoPath.trim() } : {}),
      language: 'pt-BR',
      targetUrl: normalizeTargetUrl(targetPath),
      ...(navboostKeyword.trim() ? { navboostKeyword: navboostKeyword.trim() } : {}),
      platforms,
      createdAt: '2026-11-27T12:00:00.000Z',
    };
  }, [drafts, jobId, navboostKeyword, targetPath, topic, verticalVideoPath, videoPath]);

  const jobJson = useMemo(() => JSON.stringify(jobObject, null, 2), [jobObject]);
  const safeFileSlug = (jobId.trim() || 'nkl-video-001').replace(/[^a-zA-Z0-9._-]+/g, '-');
  const jobFilePath = `workspace/social-publisher/jobs/${safeFileSlug}.json`;

  const cliCommands = useMemo(() => {
    return [
      `npx tsx tools/social-publisher/cli.ts doctor`,
      `npx tsx tools/social-publisher/cli.ts validate --job ${jobFilePath}`,
      `npx tsx tools/social-publisher/cli.ts publish --job ${jobFilePath} --dry-run`,
      `npx tsx tools/social-publisher/cli.ts publish --job ${jobFilePath} --live`,
    ].join('\n');
  }, [jobFilePath]);

  function handleRegenerateCopies() {
    setDrafts((previous) => {
      const next = { ...previous };
      for (const channel of SOCIAL_CHANNELS) {
        const generated = buildDeterministicChannelCopy(
          channel,
          topic,
          targetPath,
          navboostKeyword || undefined,
        );
        next[channel] = {
          ...previous[channel],
          title: generated.title ?? previous[channel].title,
          caption: generated.caption,
          hashtagsText: generated.hashtags.join(' '),
        };
      }
      return next;
    });
    setCopyFeedback('Textos atualizados por canal sem alterar canais marcados.');
  }

  function handleToggleChannel(channel: SocialChannel) {
    setDrafts((previous) => ({
      ...previous,
      [channel]: {
        ...previous[channel],
        enabled: !previous[channel].enabled,
      },
    }));
  }

  function handleDraftChange(
    channel: SocialChannel,
    field: keyof Omit<ChannelDraft, 'enabled'>,
    value: string,
  ) {
    setDrafts((previous) => ({
      ...previous,
      [channel]: {
        ...previous[channel],
        [field]: value,
      },
    }));
  }

  async function handleCopyText(content: string, label: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopyFeedback(`${label} copiado para a área de transferência.`);
    } catch {
      setCopyFeedback('Não foi possível acessar a área de transferência neste navegador.');
    }
  }

  function handleDownloadJob() {
    const blob = new Blob([`${jobJson}\n`], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${safeFileSlug}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setCopyFeedback(`Arquivo ${safeFileSlug}.json baixado. Salve em ${jobFilePath}.`);
  }

  const enabledChannels = SOCIAL_CHANNELS.filter((channel) => drafts[channel].enabled);
  const connectedCount = connectionStatus.filter((item) => item.connected).length;

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-surface p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-playfair text-xl font-bold">
              Conexões Oficiais e Pontes ({connectedCount}/{connectionStatus.length} prontas)
            </h2>
            <p className="text-xs opacity-75">
              Bluesky usa AT Protocol, Threads usa API da Meta, Mastodon conecta no Fediverse e X usa API v2.
              Kwai, Pinterest, LinkedIn, Reddit e Telegram entram pela ponte Postiz ou Webhook (n8n/Make).
            </p>
          </div>
          <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold">
            Zero scraping · Apenas APIs documentadas
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {connectionStatus.map((status) => (
            <div
              key={status.channel}
              className="rounded-lg border border-border bg-background p-3 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">{status.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    status.connected
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-orange/15 text-orange border border-orange/30'
                  }`}
                >
                  {status.connected ? 'Conectado' : 'Falta .env.local'}
                </span>
              </div>
              <p className="opacity-70">
                Modo: {status.mode === 'native_api' ? 'API Oficial' : 'Bridge (Postiz / Webhook)'}
              </p>
              {!status.connected && status.missingEnvVars.length > 0 && (
                <p className="font-mono text-[11px] text-orange break-all">
                  Variáveis: {status.missingEnvVars.join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-playfair text-xl font-bold">1. Dados do Vídeo e Destino</h2>
          <button
            type="button"
            onClick={handleRegenerateCopies}
            className="rounded-md bg-neon px-4 py-2 text-xs font-bold text-black hover:opacity-90"
          >
            Gerar textos por rede
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-1 text-xs">
            <span className="font-bold">ID do Job</span>
            <input
              type="text"
              value={jobId}
              onChange={(event) => setJobId(event.target.value)}
              className="w-full rounded-md border border-border bg-background p-2.5 text-sm"
              placeholder="nkl-video-001"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-bold">Tema do Vídeo</span>
            <input
              type="text"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              className="w-full rounded-md border border-border bg-background p-2.5 text-sm"
              placeholder="Ex.: Guia rápido de inglês com áudio no Portal NKL"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-bold">Rota ou URL de Destino no Portal NKL</span>
            <input
              type="text"
              value={targetPath}
              onChange={(event) => setTargetPath(event.target.value)}
              className="w-full rounded-md border border-border bg-background p-2.5 text-sm"
              placeholder="/ia/oferta"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_DESTINATION_ROUTES.map((route) => (
                <button
                  key={route.value}
                  type="button"
                  onClick={() => setTargetPath(route.value)}
                  className="rounded border border-border bg-background px-2 py-0.5 text-[11px] hover:border-neon"
                >
                  {route.label}
                </button>
              ))}
            </div>
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-bold">Termo de Busca Navboost no Google (Opcional)</span>
            <input
              type="text"
              value={navboostKeyword}
              onChange={(event) => setNavboostKeyword(event.target.value)}
              className="w-full rounded-md border border-border bg-background p-2.5 text-sm"
              placeholder="Ex.: portal nkl bussola de negocios"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-bold">Vídeo Horizontal (16:9 - YouTube / Facebook / Bilibili)</span>
            <input
              type="text"
              value={videoPath}
              onChange={(event) => setVideoPath(event.target.value)}
              className="w-full rounded-md border border-border bg-background p-2.5 text-sm"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-bold">Vídeo Vertical (9:16 - TikTok / Reels / Shorts / Kwai)</span>
            <input
              type="text"
              value={verticalVideoPath}
              onChange={(event) => setVerticalVideoPath(event.target.value)}
              className="w-full rounded-md border border-border bg-background p-2.5 text-sm"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-bold">Duração Estimada (segundos)</span>
            <input
              type="number"
              min={1}
              value={durationSecondsInput}
              onChange={(event) => setDurationSecondsInput(event.target.value)}
              className="w-full rounded-md border border-border bg-background p-2.5 text-sm"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-bold">Tamanho Estimado do Arquivo (MB)</span>
            <input
              type="number"
              min={1}
              value={fileSizeMbInput}
              onChange={(event) => setFileSizeMbInput(event.target.value)}
              className="w-full rounded-md border border-border bg-background p-2.5 text-sm"
            />
          </label>
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-2 text-xs font-bold">Redes Selecionadas ({enabledChannels.length})</p>
          <div className="flex flex-wrap gap-2">
            {SOCIAL_CHANNELS.map((channel) => {
              const active = drafts[channel].enabled;
              return (
                <button
                  key={channel}
                  type="button"
                  onClick={() => handleToggleChannel(channel)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                    active
                      ? 'border-neon bg-neon/15 text-neon'
                      : 'border-border bg-background opacity-65 hover:opacity-100'
                  }`}
                >
                  {CHANNEL_METADATA[channel].label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-playfair text-xl font-bold">
          2. Revisão por Rede e Contagem de Caracteres
        </h2>

        {enabledChannels.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-surface p-6 text-sm opacity-75">
            Marque pelo menos um canal acima para editar e validar o texto.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {enabledChannels.map((channel) => {
              const draft = drafts[channel];
              const limits = CHANNEL_LIMITS[channel];
              const meta = CHANNEL_METADATA[channel];
              const status = statusByChannel.get(channel);
              const hashtags = parseHashtags(draft.hashtagsText);
              const validation = validatePostForChannel(channel, {
                caption: draft.caption,
                title: draft.title,
                hashtags,
                videoDurationSeconds: parsedDuration,
                fileSizeMb: parsedFileSizeMb,
                scheduledAt: draft.scheduledAt.trim() || undefined,
              });
              const fullText = composePostText(draft.caption, hashtags);

              return (
                <article
                  key={channel}
                  className="rounded-xl border border-border bg-surface p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                    <div>
                      <h3 className="font-bold text-sm">{meta.label}</h3>
                      <p className="text-[11px] opacity-70">{meta.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          validation.valid
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-red-500/15 text-red-400'
                        }`}
                      >
                        {validation.remainingChars} restantes / {limits.maxChars}
                      </span>
                      {status && (
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px]">
                          {status.connected ? 'Credencial OK' : 'Sem credencial'}
                        </span>
                      )}
                    </div>
                  </div>

                  {limits.maxTitle !== undefined && (
                    <label className="block space-y-1 text-xs">
                      <span className="font-semibold">
                        Título ({draft.title.trim().length}/{limits.maxTitle})
                      </span>
                      <input
                        type="text"
                        value={draft.title}
                        onChange={(event) => handleDraftChange(channel, 'title', event.target.value)}
                        className="w-full rounded-md border border-border bg-background p-2 text-xs"
                      />
                    </label>
                  )}

                  <label className="block space-y-1 text-xs">
                    <span className="font-semibold">
                      Legenda ({fullText.length} caracteres com hashtags)
                    </span>
                    <textarea
                      rows={4}
                      value={draft.caption}
                      onChange={(event) => handleDraftChange(channel, 'caption', event.target.value)}
                      className="w-full rounded-md border border-border bg-background p-2 text-xs"
                    />
                  </label>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label className="block space-y-1 text-xs">
                      <span className="font-semibold">Hashtags</span>
                      <input
                        type="text"
                        value={draft.hashtagsText}
                        onChange={(event) =>
                          handleDraftChange(channel, 'hashtagsText', event.target.value)
                        }
                        className="w-full rounded-md border border-border bg-background p-2 text-xs"
                      />
                    </label>
                    <label className="block space-y-1 text-xs">
                      <span className="font-semibold">URL Pública do Vídeo (Opcional)</span>
                      <input
                        type="url"
                        value={draft.videoUrl}
                        onChange={(event) =>
                          handleDraftChange(channel, 'videoUrl', event.target.value)
                        }
                        placeholder="https://..."
                        className="w-full rounded-md border border-border bg-background p-2 text-xs"
                      />
                    </label>
                  </div>

                  {(validation.errors.length > 0 || validation.warnings.length > 0) && (
                    <div className="space-y-1 rounded-md border border-border bg-background p-2.5 text-[11px]">
                      {validation.errors.map((err) => (
                        <p key={err} className="font-semibold text-red-400">
                          Erro: {err}
                        </p>
                      ))}
                      {validation.warnings.map((warn) => (
                        <p key={warn} className="text-orange">
                          Aviso: {warn}
                        </p>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-playfair text-xl font-bold">3. Exportar job.json e Executar no CLI</h2>
            <p className="text-xs opacity-75">
              Salve o JSON em <code>{jobFilePath}</code> e execute primeiro em <code>--dry-run</code> para revisar todos os endpoints antes do envio real.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleCopyText(jobJson, 'job.json')}
              className="rounded-md border border-border bg-background px-3 py-2 text-xs font-bold hover:border-neon"
            >
              Copiar job.json
            </button>
            <button
              type="button"
              onClick={handleDownloadJob}
              className="rounded-md bg-neon px-3 py-2 text-xs font-bold text-black hover:opacity-90"
            >
              Baixar job.json
            </button>
            <button
              type="button"
              onClick={() => handleCopyText(cliCommands, 'Comandos CLI')}
              className="rounded-md border border-border bg-background px-3 py-2 text-xs font-bold hover:border-neon"
            >
              Copiar comandos CLI
            </button>
          </div>
        </div>

        {copyFeedback && (
          <p className="rounded-md border border-neon/40 bg-neon/10 px-3 py-2 text-xs font-semibold text-neon">
            {copyFeedback}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-xs font-bold">Comandos de Terminal</p>
            <pre className="overflow-x-auto rounded-lg border border-border bg-background p-3 text-[11px] leading-relaxed">
              {cliCommands}
            </pre>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-bold">Prévia do job.json</p>
            <pre className="max-h-72 overflow-auto rounded-lg border border-border bg-background p-3 text-[11px] leading-relaxed">
              {jobJson}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
