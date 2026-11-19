'use client';

import { useState } from 'react';
import { AD_ASSET_MAX_BYTES, AD_ASSET_MIME_TYPES } from '@/lib/ad-inventory-config';

export function AdMaterialUploadForm({ campaignId }: { campaignId: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/ads/material', {
        method: 'POST',
        body: new FormData(event.currentTarget),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const detail = typeof payload === 'object'
          && payload !== null
          && 'message' in payload
          && typeof payload.message === 'string'
          ? payload.message
          : 'Não foi possível enviar o material.';
        throw new Error(detail);
      }
      setMessage('Material enviado. A equipe do Portal NKL fará a análise antes da publicação.');
      event.currentTarget.reset();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Não foi possível enviar o material.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border border-neon/30 bg-surface/70 p-5">
      <input type="hidden" name="campaignId" value={campaignId} />
      <label className="block text-sm font-bold">
        Arquivo do anúncio
        <input
          name="creative"
          type="file"
          required
          accept={AD_ASSET_MIME_TYPES.join(',')}
          className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-3 text-sm font-normal file:mr-3 file:rounded-md file:border-0 file:bg-neon file:px-3 file:py-2 file:font-bold file:text-black"
        />
        <span className="mt-2 block text-xs font-normal text-foreground/60">
          PNG, JPEG, GIF, WebP ou WebM · até {Math.round(AD_ASSET_MAX_BYTES / 1024 / 1024)}MB
        </span>
      </label>
      {error && <p role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error}</p>}
      {message && <p role="status" className="rounded-md border border-neon/30 bg-neon/10 px-3 py-2 text-sm text-neon">{message}</p>}
      <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center justify-center rounded-md bg-neon px-5 py-3 text-sm font-bold text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
        {pending ? 'Enviando material…' : 'Enviar para análise'}
      </button>
    </form>
  );
}
