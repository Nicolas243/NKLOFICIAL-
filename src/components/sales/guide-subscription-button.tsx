'use client';

import { useState } from 'react';

type Props = {
  offerVariant: string;
  label?: string;
};

type SubscriptionResponse = {
  initPoint?: string;
  message?: string;
};

export function GuideSubscriptionButton({ offerVariant, label = 'Começar por R$ 19/mês' }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function startSubscription(): Promise<void> {
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/payments/create-guide-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerVariant }),
      });
      const payload: SubscriptionResponse = await response.json();
      if (!response.ok || !payload.initPoint) {
        setMessage(payload.message ?? 'Não foi possível iniciar a assinatura.');
        return;
      }
      window.location.assign(payload.initPoint);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível iniciar a assinatura.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={() => void startSubscription()} disabled={isLoading} className="inline-flex min-h-11 items-center justify-center rounded-md border border-orange px-4 py-2 text-sm font-bold text-orange transition hover:bg-orange/10 disabled:cursor-not-allowed disabled:opacity-50">
        {isLoading ? 'Preparando acesso...' : label}
      </button>
      {message && <p className="mt-2 text-xs text-red-700 dark:text-red-300" role="alert">{message}</p>}
      <p className="mt-2 flex items-center gap-2 text-xs text-foreground/55">
        <span aria-hidden="true" className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-emerald-600/40 text-emerald-700 dark:text-emerald-300">
          <svg viewBox="0 0 20 20" className="h-2.5 w-2.5 fill-none stroke-current" strokeWidth="2">
            <path d="m5 10 3 3 7-7" />
          </svg>
        </span>
        Cobrança recorrente processada pelo Mercado Pago
      </p>
    </div>
  );
}
