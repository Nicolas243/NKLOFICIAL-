'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackBeginCheckout } from '@/lib/analytics';
import { getAiOfferPriceCents, type AiOfferPlan } from '@/lib/ai-product';

type AiOfferCheckoutProps = {
  plan: AiOfferPlan;
  label: string;
  helperText: string;
};

type CheckoutResponsePayload = {
  url?: string;
  error?: string;
  message?: string;
};

export function AiOfferCheckout({ plan, label, helperText }: AiOfferCheckoutProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(): Promise<void> {
    trackBeginCheckout({
      funnel: 'ia-na-pratica',
      tier: plan,
      valueBrl: getAiOfferPriceCents(plan) / 100,
      productSlug: 'curso-ia-pratica',
    });
    setIsLoading(true);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch('/api/payments/create-ai-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          cancelPath: typeof window !== 'undefined' ? window.location.pathname : undefined,
        }),
      });

      if (response.status === 401) {
        router.push('/login?next=/ia/oferta');
        return;
      }

      const payload = (await response.json().catch(() => null)) as CheckoutResponsePayload | null;

      if (response.status === 503 || payload?.error === 'ai_checkout_not_configured') {
        setNotice(
          payload?.message ?? 'Checkout de IA na Prática aguardando configuração do Stripe.',
        );
        return;
      }

      if (response.ok && payload?.url) {
        window.location.assign(payload.url);
        return;
      }

      setError(
        payload?.message ?? 'Não foi possível iniciar o checkout no momento. Tente novamente.',
      );
    } catch {
      setError('Não foi possível conectar ao serviço de pagamento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={() => void handleCheckout()}
        disabled={isLoading}
        className="min-h-12 w-full rounded-lg bg-neon px-5 py-3 font-bold text-black transition hover:scale-[1.01] disabled:cursor-wait disabled:opacity-60"
      >
        {isLoading ? 'Preparando checkout...' : label}
      </button>
      <p className="mt-3 text-center text-xs opacity-60">{helperText}</p>
      {notice ? (
        <p
          role="status"
          className="mt-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-center text-xs font-semibold leading-relaxed text-amber-200"
        >
          {notice}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-center text-xs font-semibold leading-relaxed text-red-300"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
