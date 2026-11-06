'use client';

import { useState } from 'react';

type Props = {
  youtubeId?: string | null;
  tiktokId?: string | null;
  programName: string;
};

function isPlaceholder(value: string | null | undefined): boolean {
  return !value || value === 'SEU_ID_EXEMPLO';
}

export function SocialEmbed({ youtubeId, tiktokId, programName }: Props) {
  const [isLoaded, setIsLoaded] = useState(false);
  const activeYoutubeId = isPlaceholder(youtubeId) ? null : youtubeId;
  const activeTiktokId = isPlaceholder(tiktokId) ? null : tiktokId;

  if (!activeYoutubeId && !activeTiktokId) {
    const searchParams = new URLSearchParams({ search_query: `como funciona ${programName}` });
    return (
      <div className="mt-6 rounded-xl border border-border bg-background/60 p-5">
        <p className="text-sm leading-relaxed text-foreground/75">Ainda não há vídeo editorial cadastrado para esta oportunidade.</p>
        <a
          href={`https://www.youtube.com/results?${searchParams.toString()}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-11 items-center rounded-md border border-orange px-4 py-3 text-sm font-bold text-orange hover:bg-orange/10"
        >
          Pesquisar tutoriais no YouTube
        </a>
      </div>
    );
  }

  if (isLoaded) {
    return (
      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-black aspect-video">
        <iframe
          title="Vídeo editorial da oportunidade"
          src={activeYoutubeId ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(activeYoutubeId)}` : `https://www.tiktok.com/player/v1/${encodeURIComponent(activeTiktokId ?? '')}`}
          className="h-full w-full"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button type="button" onClick={() => setIsLoaded(true)} className="mt-6 flex aspect-video w-full items-center justify-center rounded-xl border border-border bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.35),rgba(7,21,45,0.96)_55%)] p-6 text-left text-white shadow-sm transition hover:border-orange-400" aria-label="Carregar vídeo editorial">
      <span>
        <span className="block text-xs font-bold uppercase tracking-[0.2em] text-orange-200">Vídeo curto</span>
        <span className="mt-2 block text-xl font-bold">Carregar vídeo sobre esta oportunidade</span>
        <span className="mt-2 block text-sm text-white/75">O player só será carregado depois do seu clique.</span>
      </span>
    </button>
  );
}
