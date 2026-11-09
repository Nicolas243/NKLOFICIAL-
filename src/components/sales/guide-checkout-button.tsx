'use client';

import { useState } from 'react';
import { trackOfferFunnelEvent } from '@/lib/analytics';

type CheckoutResponse = {
  initPoint?: string;
  message?: string;
};

type GuideCheckoutButtonProps = {
  label?: string;
  enabled?: boolean;
  offerVariant?: string;
  hotmartCheckoutUrl?: string;
};

export function GuideCheckoutButton({
  label = 'Liberar meu acesso',
  enabled = true,
  offerVariant = 'sales-page',
  hotmartCheckoutUrl,
}: GuideCheckoutButtonProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChooserOpen, setIsChooserOpen] = useState(false);

  async function createCheckout(): Promise<void> {
    trackOfferFunnelEvent(offerVariant, 'checkout');
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
      <button
        type="button"
        onClick={() => {
          setMessage(null);
          if (hotmartCheckoutUrl) {
            setIsChooserOpen(true);
            return;
          }
          void createCheckout();
        }}
        disabled={!enabled || isLoading}
        className="inline-flex min-h-12 items-center justify-center rounded-md bg-orange px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-dark disabled:cursor-not-allowed disabled:bg-foreground/20 disabled:text-foreground/45 disabled:shadow-none"
      >
        {isLoading ? 'Preparando checkout...' : label}
      </button>
      {message && <p className="mt-3 max-w-md text-sm leading-relaxed text-foreground/70" role="alert">{message}</p>}
      <p className="mt-3 flex items-center gap-2 text-xs font-medium text-foreground/60">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-600/40 text-emerald-700 dark:text-emerald-300" aria-hidden="true">
          <svg viewBox="0 0 20 20" className="h-3 w-3 fill-none stroke-current" strokeWidth="2">
            <path d="m5 10 3 3 7-7" />
          </svg>
        </span>
        Escolha o meio de pagamento após clicar
      </p>
      {isChooserOpen && hotmartCheckoutUrl && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 px-4" role="presentation" onMouseDown={() => setIsChooserOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-payment-title"
            className="w-full max-w-md rounded-2xl border border-border bg-background p-6 text-foreground shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange">Checkout seguro</p>
                <h2 id="guide-payment-title" className="mt-2 font-playfair text-2xl font-bold">Como você prefere pagar?</h2>
              </div>
              <button type="button" onClick={() => setIsChooserOpen(false)} className="rounded-md px-2 py-1 text-xl leading-none text-foreground/60 hover:bg-foreground/10" aria-label="Fechar escolha de pagamento">
                ×
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground/70">Você será encaminhado para o ambiente seguro do meio escolhido.</p>
            <div className="mt-6 grid gap-3">
              <button type="button" onClick={() => void createCheckout()} disabled={isLoading} className="inline-flex min-h-12 items-center justify-center rounded-md bg-orange px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-dark disabled:cursor-not-allowed disabled:opacity-60">
                {isLoading ? 'Preparando Mercado Pago...' : 'Pagar com Mercado Pago'}
              </button>
              <a href={hotmartCheckoutUrl} onClick={() => trackOfferFunnelEvent(offerVariant, 'checkout')} className="inline-flex min-h-12 items-center justify-center rounded-md border border-foreground/25 px-4 py-3 text-sm font-bold text-foreground transition hover:border-foreground/50 hover:bg-foreground/5">
                Pagar com Hotmart
              </a>
            </div>
            <p className="mt-4 text-center text-xs text-foreground/55">A confirmação e a liberação do acesso acontecem após o pagamento.</p>
          </div>
        </div>
      )}
    </div>
  );
}
