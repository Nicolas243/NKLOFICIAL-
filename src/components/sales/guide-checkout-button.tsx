'use client';

import { useEffect, useRef, useState } from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

type CheckoutResponse = {
  preferenceId?: string;
  message?: string;
};

type GuideCheckoutButtonProps = {
  label?: string;
};

export function GuideCheckoutButton({ label = 'Quero conhecer o guia' }: GuideCheckoutButtonProps) {
  const [email, setEmail] = useState('');
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const initializedKey = useRef<string | null>(null);
  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;

  useEffect(() => {
    if (!publicKey || initializedKey.current === publicKey) return;
    initMercadoPago(publicKey, { locale: 'pt-BR' });
    initializedKey.current = publicKey;
  }, [publicKey]);

  async function createCheckout(): Promise<void> {
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/payments/create-guide-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const payload: CheckoutResponse = await response.json();
      if (!response.ok) {
        setMessage(payload.message ?? 'Não foi possível iniciar o checkout.');
        return;
      }
      if (!payload.preferenceId) {
        setMessage('O Mercado Pago não retornou uma preferência válida.');
        return;
      }
      setPreferenceId(payload.preferenceId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível iniciar o checkout.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      {!preferenceId && (
        <>
          <label htmlFor="guide-checkout-email" className="text-sm font-bold">Seu e-mail para receber o acesso</label>
          <input
            id="guide-checkout-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@exemplo.com"
            autoComplete="email"
            required
            className="mt-2 block min-h-12 w-full max-w-md rounded-md border border-border bg-background px-4 text-sm outline-none transition focus:border-orange"
          />
          <button type="button" onClick={() => void createCheckout()} disabled={isLoading || !email.trim()} className="mt-4 inline-flex min-h-12 items-center justify-center rounded-md bg-orange px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-dark disabled:cursor-not-allowed disabled:opacity-60">
            {isLoading ? 'Preparando checkout...' : label}
          </button>
        </>
      )}
      {preferenceId && publicKey && (
        <div className="mt-4 max-w-md">
          <Wallet initialization={{ preferenceId }} />
        </div>
      )}
      {preferenceId && !publicKey && <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">O checkout está temporariamente indisponível.</p>}
      {message && <p className="mt-3 max-w-md text-sm leading-relaxed text-foreground/70" role="alert">{message}</p>}
    </div>
  );
}
