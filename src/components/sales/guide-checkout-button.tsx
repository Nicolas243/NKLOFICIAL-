'use client';

import { useEffect, useRef, useState } from 'react';
import { trackOfferFunnelEvent } from '@/lib/analytics';
import { buildLoginPath, type GuideResumeIntent } from '@/lib/auth/return-intent';

type CheckoutResponse = {
  error?: string;
  checkoutUrl?: string;
  message?: string;
};

type GuideCheckoutButtonProps = {
  label?: string;
  enabled?: boolean;
  offerVariant?: string;
  resumeIntent?: GuideResumeIntent | null;
};

export function GuideCheckoutButton({
  label = 'Liberar meu acesso',
  enabled = true,
  offerVariant = 'sales-page',
  resumeIntent = null,
}: GuideCheckoutButtonProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cpf, setCpf] = useState('');
  const [cpfConsentConfirmed, setCpfConsentConfirmed] = useState(false);
  const cpfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resumeIntent !== 'purchase') return;
    cpfInputRef.current?.scrollIntoView({ block: 'center' });
    cpfInputRef.current?.focus();
  }, [resumeIntent]);

  async function createCheckout(): Promise<void> {
    trackOfferFunnelEvent(offerVariant, 'checkout');
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/payments/create-guide-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerVariant, cpf, cpfConsentConfirmed }),
      });
      const payload: CheckoutResponse = await response.json();
      if (!response.ok) {
        if (response.status === 401 && payload.error === 'authentication_required') {
          window.location.assign(buildLoginPath('/guias/renda-extra', 'purchase'));
          return;
        }
        setMessage(payload.message ?? 'Não foi possível iniciar o checkout.');
        return;
      }
      if (!payload.checkoutUrl) {
        setMessage('O Stripe não retornou um endereço de checkout válido.');
        return;
      }
      window.location.assign(payload.checkoutUrl);
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
          void createCheckout();
        }}
        disabled={!enabled || isLoading}
        className="inline-flex min-h-12 items-center justify-center rounded-md bg-orange px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-dark disabled:cursor-not-allowed disabled:bg-foreground/20 disabled:text-foreground/45 disabled:shadow-none"
      >
        {isLoading ? 'Preparando checkout...' : label}
      </button>
      <label htmlFor="guide-purchase-cpf" className="mt-4 block text-xs font-bold uppercase tracking-[0.12em] text-foreground/60">
        CPF para personalizar os materiais
      </label>
      <input
        id="guide-purchase-cpf"
        ref={cpfInputRef}
        inputMode="numeric"
        value={cpf}
        onChange={(event) => setCpf(event.target.value)}
        placeholder="000.000.000-00"
        autoComplete="off"
        className="mt-2 min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/20"
      />
      <label className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-foreground/65">
        <input
          type="checkbox"
          checked={cpfConsentConfirmed}
          onChange={(event) => setCpfConsentConfirmed(event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-orange"
        />
        <span>Concordo que o CPF seja usado apenas para personalizar e proteger meus materiais.</span>
      </label>
      {message && <p className="mt-3 max-w-md text-sm leading-relaxed text-foreground/70" role="alert">{message}</p>}
      <p className="mt-3 flex items-center gap-2 text-xs font-medium text-foreground/60">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-600/40 text-emerald-700 dark:text-emerald-300" aria-hidden="true">
          <svg viewBox="0 0 20 20" className="h-3 w-3 fill-none stroke-current" strokeWidth="2">
            <path d="m5 10 3 3 7-7" />
          </svg>
        </span>
        Escolha o meio de pagamento após clicar
      </p>
    </div>
  );
}
