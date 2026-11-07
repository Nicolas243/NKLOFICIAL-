'use client';

import { useState } from 'react';

type CheckoutResponse = {
  initPoint?: string;
  message?: string;
};

type GuideCheckoutButtonProps = {
  label?: string;
  enabled?: boolean;
  offerVariant?: string;
};

export function GuideCheckoutButton({ label = 'Liberar meu acesso', enabled = true, offerVariant = 'sales-page' }: GuideCheckoutButtonProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function createCheckout(): Promise<void> {
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/payments/create-guide-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerVariant }),
      });
      const payload: CheckoutResponse = await response.json();
      if (!response.ok) {
        setMessage(payload.message ?? 'Não foi possível iniciar o checkout.');
        return;
      }
      if (!payload.initPoint) {
        setMessage('O Mercado Pago não retornou um endereço de checkout válido.');
        return;
      }
      window.location.assign(payload.initPoint);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível iniciar o checkout.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={() => void createCheckout()} disabled={!enabled || isLoading} className="inline-flex min-h-12 items-center justify-center rounded-md bg-orange px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-dark disabled:cursor-not-allowed disabled:bg-foreground/20 disabled:text-foreground/45 disabled:shadow-none">
        {isLoading ? 'Preparando checkout...' : label}
      </button>
      {message && <p className="mt-3 max-w-md text-sm leading-relaxed text-foreground/70" role="alert">{message}</p>}
      <p className="mt-3 flex items-center gap-2 text-xs font-medium text-foreground/60">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-600/40 text-emerald-700 dark:text-emerald-300" aria-hidden="true">
          <svg viewBox="0 0 20 20" className="h-3 w-3 fill-none stroke-current" strokeWidth="2">
            <path d="m5 10 3 3 7-7" />
          </svg>
        </span>
        Pagamento processado com segurança pelo Mercado Pago
      </p>
    </div>
  );
}
