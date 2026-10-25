'use client';

type DailyEmbedProps = {
  url: string;
};

export function DailyEmbed({ url }: DailyEmbedProps) {
  return (
    <iframe
      title="Sala de aula virtual"
      src={url}
      className="h-[min(70vh,42rem)] w-full rounded-xl border border-border"
      allow="camera; microphone; fullscreen; display-capture; autoplay"
    />
  );
}
