'use client';

import { useEffect, useState } from 'react';
import { trackAnalyticsEvent } from '@/lib/analytics';

type Props = {
  youtubeId?: string | null;
  tiktokId?: string | null;
  programName: string;
  triggerLabel?: string;
};

function isPlaceholder(value: string | null | undefined): boolean {
  return !value || value === 'SEU_ID_EXEMPLO';
}

export function SocialEmbed({ youtubeId, programName, triggerLabel = 'Ver vídeo em português' }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const activeYoutubeId = isPlaceholder(youtubeId) ? null : youtubeId;
  const searchQuery = encodeURIComponent(`como funciona ${programName} português`);
  const videoSource = activeYoutubeId
    ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(activeYoutubeId)}?hl=pt-BR`
    : null;

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  function openVideo(): void {
    setIsOpen(true);
    trackAnalyticsEvent('video_open', {
      embedded_video: Boolean(videoSource),
      program_name: programName,
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openVideo}
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md border border-orange px-4 py-3 text-sm font-bold text-orange transition hover:bg-orange/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        {triggerLabel}
      </button>
      {isOpen && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4"
          role="presentation"
          onMouseDown={() => setIsOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Vídeo em português sobre ${programName}`}
            className="w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange">YouTube</p>
                <h2 className="mt-1 font-playfair text-xl font-bold">Como funciona {programName}</h2>
                {!activeYoutubeId && <p className="mt-1 text-xs text-foreground/60">Ainda não há um vídeo incorporado para este tema.</p>}
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex min-h-11 items-center rounded-md border border-border px-3 py-2 text-sm font-bold hover:border-orange hover:text-orange"
                aria-label="Fechar vídeo"
              >
                Fechar
              </button>
            </div>
            {videoSource ? (
              <div className="aspect-video bg-black">
                <iframe
                  title={`Vídeo em português sobre ${programName}`}
                  src={videoSource}
                  className="h-full w-full"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
                <p className="max-w-md text-sm leading-relaxed text-white/75">
                  Estamos preparando um vídeo específico para esta oportunidade. Enquanto isso, veja os resultados em português no YouTube.
                </p>
                <a
                  href={`https://www.youtube.com/results?search_query=${searchQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-md bg-orange px-4 py-3 text-sm font-bold text-black hover:brightness-110"
                >
                  Pesquisar vídeos em português
                </a>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <p className="text-xs leading-relaxed text-foreground/60">O conteúdo é hospedado pelo YouTube e pode variar conforme a disponibilidade.</p>
              <a
                href={`https://www.youtube.com/results?search_query=${searchQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-orange hover:underline"
              >
                Abrir resultados no YouTube
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
