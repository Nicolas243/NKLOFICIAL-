'use client';

import { useEffect, useState } from 'react';
import type { GuideAsset } from '@/lib/guide-assets';
import type { GuestGuideStatus } from '@/lib/guest-guide-status';
import { GuideAssetDownloads } from '@/components/sales/guide-asset-downloads';
import { GuidePurchaseAnalytics } from '@/components/sales/guide-purchase-analytics';

type Props = {
  reference: string;
  guestAccessToken: string;
  assets: readonly GuideAsset[];
};

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 10;

export function GuestGuideStatus({ reference, guestAccessToken, assets }: Props) {
  const [status, setStatus] = useState<GuestGuideStatus>('pending');
  const [message, setMessage] = useState<string | null>(null);
  const [remainingDownloads, setRemainingDownloads] = useState(2);
  const [amountCents, setAmountCents] = useState<number | null>(null);
  const [offerVariant, setOfferVariant] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    let attempts = 0;

    async function poll(): Promise<void> {
      attempts += 1;
      try {
        const query = new URLSearchParams({
          reference,
          guest_access_token: guestAccessToken,
        });
        const response = await fetch(`/api/payments/guide-status?${query.toString()}`, {
          cache: 'no-store',
        });
        const payload: {
          status?: GuestGuideStatus;
          message?: string;
          remainingDownloads?: number;
          amountCents?: number;
          offerVariant?: string | null;
        } = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (!response.ok || !payload.status) {
          setMessage(payload.message ?? 'Não foi possível confirmar este acesso.');
          return;
        }
        setStatus(payload.status);
        if (typeof payload.remainingDownloads === 'number') setRemainingDownloads(payload.remainingDownloads);
        if (typeof payload.amountCents === 'number') setAmountCents(payload.amountCents);
        if (payload.offerVariant !== undefined) setOfferVariant(payload.offerVariant);
        if (payload.status === 'pending' && attempts < MAX_POLL_ATTEMPTS) {
          timer = window.setTimeout(() => void poll(), POLL_INTERVAL_MS);
        } else if (payload.status === 'pending') {
          setMessage('A confirmação está demorando mais que o esperado. Recarregue esta página em alguns instantes.');
        }
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : 'Não foi possível confirmar este acesso.');
      }
    }

    void poll();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [guestAccessToken, reference]);

  if (status === 'rejected') {
    return (
      <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700 dark:text-red-300">Acesso não liberado</p>
        <h1 className="mt-3 font-playfair text-4xl font-bold">Não foi possível confirmar o pagamento.</h1>
        <p className="mt-4 leading-relaxed text-foreground/75">Confira o status no seu e-mail ou tente novamente com o mesmo endereço usado no checkout.</p>
      </section>
    );
  }

  if (status === 'approved' || status === 'active') {
    const trackedValueBrl = typeof amountCents === 'number' && amountCents > 0 ? amountCents / 100 : 39;
    return (
      <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8">
        <GuidePurchaseAnalytics
          transactionId={reference}
          value={trackedValueBrl}
          offerVariant={offerVariant}
        />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Pagamento confirmado</p>
        <h1 className="mt-3 font-playfair text-4xl font-bold">Seu acesso foi liberado.</h1>
        <p className="mt-4 leading-relaxed text-foreground/75">Seus materiais personalizados estão disponíveis abaixo.</p>
        <GuideAssetDownloads
          assets={assets}
          initialRemainingDownloads={remainingDownloads}
          accessToken={guestAccessToken}
        />
        {message && <p className="mt-4 text-sm text-foreground/70" role="status">{message}</p>}
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-orange/30 bg-orange/5 p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Pagamento em processamento</p>
      <h1 className="mt-3 font-playfair text-4xl font-bold">Estamos confirmando seu pagamento.</h1>
      <p className="mt-4 leading-relaxed text-foreground/75">Aguarde alguns instantes enquanto o Stripe confirma a transação. Não feche esta página.</p>
      {message && <p className="mt-4 text-sm text-foreground/70" role="status">{message}</p>}
    </section>
  );
}
