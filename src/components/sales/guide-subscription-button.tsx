'use client';

import { useState } from 'react';
import { HotmartCheckoutLink } from '@/components/sales/hotmart-checkout-link';

type Props = {
  offerVariant: string;
  label?: string;
  hotmartCheckoutUrl?: string;
};

type SubscriptionResponse = {
  initPoint?: string;
  message?: string;
};

export function GuideSubscriptionButton({ offerVariant, label = 'Começar por R$ 19/mês', hotmartCheckoutUrl }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [payerEmail, setPayerEmail] = useState('');

  async function startSubscription(): Promise<void> {
    if (!payerEmail.trim()) {
      setMessage('Informe seu e-mail para continuar com a assinatura.');
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/payments/create-guide-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerVariant, payerEmail }),
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
      <label htmlFor="guide-subscription-email" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-foreground/60">
        E-mail para a assinatura
      </label>
      <input
        id="guide-subscription-email"
        type="email"
        value={payerEmail}
        onChange={(event) => setPayerEmail(event.target.value)}
        placeholder="voce@exemplo.com"
        autoComplete="email"
        className="mb-3 min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/20"
      />
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
      {hotmartCheckoutUrl && (
        <div className="mt-3">
          <HotmartCheckoutLink href={hotmartCheckoutUrl} label="Assinar com Hotmart" />
        </div>
      )}
    </div>
  );
}
