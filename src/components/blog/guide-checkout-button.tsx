'use client';

import { useState } from 'react';

type CheckoutResponse = {
  message?: string;
};

export function GuideCheckoutButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function createCheckout(): Promise<void> {
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/payments/create-guide-checkout', { method: 'POST' });
      const payload: CheckoutResponse = await response.json();
      if (!response.ok) {
        setMessage(payload.message ?? 'O checkout ainda não está disponível.');
        return;
      }
      setMessage(payload.message ?? 'Checkout criado.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível iniciar o checkout.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={() => void createCheckout()} disabled={isLoading} className="inline-flex min-h-12 items-center justify-center rounded-md bg-orange px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-dark disabled:cursor-not-allowed disabled:opacity-60">
        {isLoading ? 'Preparando checkout...' : 'Quero conhecer o guia'}
      </button>
      {message && <p className="mt-3 max-w-sm text-sm leading-relaxed text-foreground/70" role="status">{message}</p>}
    </div>
  );
}
