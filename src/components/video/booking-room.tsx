'use client';

import { useState } from 'react';
import { DailyEmbed } from '@/components/video/daily-embed';

type BookingRoomProps = {
  url: string | null;
};

export function BookingRoom({ url }: BookingRoomProps) {
  const [open, setOpen] = useState(false);

  if (!url) {
    return <span className="mt-6 block rounded-md border border-border px-4 py-3 text-center text-sm opacity-60">A sala será liberada após a confirmação.</span>;
  }

  return open ? (
    <div className="mt-6">
      <DailyEmbed url={url} />
      <button type="button" onClick={() => setOpen(false)} className="mt-3 text-sm font-semibold text-neon hover:underline">
        Fechar sala
      </button>
    </div>
  ) : (
    <button type="button" onClick={() => setOpen(true)} className="mt-6 inline-flex w-full justify-center rounded-md bg-neon px-4 py-3 font-bold text-black">
      Entrar na Sala
    </button>
  );
}
