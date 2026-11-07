'use client';

import { useState } from 'react';
import type { GuideAsset, GuideAssetId } from '@/lib/guide-assets';

type GuideDownloadContext =
  | { external_reference: string; payment_id: string }
  | { provider: 'hotmart'; payment_id: string }
  | { subscription_reference: string };

type SignedDownloadResponse = {
  downloadUrl?: string;
  remainingDownloads?: number;
};

type GuideAssetDownloadsProps = {
  assets: readonly GuideAsset[];
  context: GuideDownloadContext;
  initialRemainingDownloads: number;
};

const DOWNLOAD_LINK_CLEANUP_DELAY_MS = 1000;

export function GuideAssetDownloads({
  assets,
  context,
  initialRemainingDownloads,
}: GuideAssetDownloadsProps) {
  const [remainingDownloads, setRemainingDownloads] = useState(initialRemainingDownloads);
  const [loadingAsset, setLoadingAsset] = useState<GuideAssetId | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function downloadAsset(assetId: GuideAssetId): Promise<void> {
    setLoadingAsset(assetId);
    setMessage(null);
    try {
      const response = await fetch('/api/downloads/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...context, assetId }),
      });
      if (!response.ok) {
        const payload: { message?: string } = await response.json().catch(() => ({}));
        setMessage(payload.message ?? 'Não foi possível liberar este material.');
        return;
      }
      const signedDownload = response.headers.get('content-type')?.includes('application/json')
        ? await response.json() as SignedDownloadResponse
        : null;
      if (signedDownload?.downloadUrl) {
        const signedResponse = await fetch(signedDownload.downloadUrl);
        if (!signedResponse.ok) throw new Error('Não foi possível baixar este material.');
        const file = await signedResponse.blob();
        await saveDownload(file, assetId);
        if (typeof signedDownload.remainingDownloads === 'number') {
          setRemainingDownloads(signedDownload.remainingDownloads);
        }
        return;
      }
      const file = await response.blob();
      await saveDownload(file, assetId);
      const remainingHeader = response.headers.get('X-Downloads-Remaining');
      if (remainingHeader) setRemainingDownloads(Number(remainingHeader));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível liberar este material.');
    } finally {
      setLoadingAsset(null);
    }
  }

  function saveDownload(file: Blob, assetId: GuideAssetId): void {
    const objectUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = assets.find((item) => item.id === assetId)?.filename ?? 'material-nkl';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), DOWNLOAD_LINK_CLEANUP_DELAY_MS);
  }

  return (
    <div className="mt-6 rounded-xl border border-border bg-background/60 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-foreground/55">Materiais incluídos</p>
          <p className="mt-1 text-sm text-foreground/70">Acesso protegido por cota total de tentativas.</p>
        </div>
        <p className="text-sm font-bold text-foreground">
          {remainingDownloads} {remainingDownloads === 1 ? 'tentativa restante' : 'tentativas restantes'}
        </p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {assets.map((asset) => (
          <button
            key={asset.id}
            type="button"
            onClick={() => void downloadAsset(asset.id)}
            disabled={loadingAsset !== null || remainingDownloads <= 0}
            className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-border bg-income-card px-4 py-3 text-left text-sm font-bold transition hover:border-neon hover:bg-neon/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{asset.label}</span>
            <span aria-live="polite" className="shrink-0 text-neon">{loadingAsset === asset.id ? 'Carregando' : 'Baixar'}</span>
          </button>
        ))}
      </div>
      {message && <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">{message}</p>}
    </div>
  );
}
