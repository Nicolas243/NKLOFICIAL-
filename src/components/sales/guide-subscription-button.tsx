'use client';

import { useEffect, useRef, useState } from 'react';
import { trackOfferFunnelEvent } from '@/lib/analytics';
import type { GuideResumeIntent } from '@/lib/auth/return-intent';

type Props = {
  offerVariant: string;
  label?: string;
  resumeIntent?: GuideResumeIntent | null;
};

type SubscriptionResponse = {
  error?: string;
  checkoutUrl?: string;
  message?: string;
};

export function GuideSubscriptionButton({
  offerVariant,
  label = 'Começar por R$ 19/mês',
  resumeIntent = null,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [cpfConsentConfirmed, setCpfConsentConfirmed] = useState(false);
  const cpfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resumeIntent !== 'subscription') return;
    cpfInputRef.current?.scrollIntoView({ block: 'center' });
    cpfInputRef.current?.focus();
  }, [resumeIntent]);

  async function startSubscription(): Promise<void> {
    trackOfferFunnelEvent(offerVariant, 'checkout');
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/payments/create-guide-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerVariant,
          fullName,
          email,
          cpf,
          cpfConsentConfirmed,
        }),
      });
      const payload: SubscriptionResponse = await response.json();
      if (!response.ok || !payload.checkoutUrl) {
        setMessage(payload.message ?? 'Não foi possível iniciar a assinatura.');
        return;
      }
      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível iniciar a assinatura.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <label htmlFor="guide-subscription-name" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-foreground/60">
        Nome completo
      </label>
      <input
        id="guide-subscription-name"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        placeholder="Seu nome completo"
        autoComplete="name"
        className="mb-3 min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/20"
      />
      <label htmlFor="guide-subscription-email" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-foreground/60">
        E-mail para receber o acesso
      </label>
      <input
        id="guide-subscription-email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="voce@exemplo.com"
        autoComplete="email"
        className="mb-3 min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/20"
      />
      <label htmlFor="guide-subscription-cpf" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-foreground/60">
        CPF para personalizar os materiais
      </label>
      <input
        id="guide-subscription-cpf"
        ref={cpfInputRef}
        inputMode="numeric"
        value={cpf}
        onChange={(event) => setCpf(event.target.value)}
        placeholder="000.000.000-00"
        autoComplete="off"
        className="mb-3 min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/20"
      />
      <label className="mb-3 flex items-start gap-2 text-xs leading-relaxed text-foreground/65">
        <input
          type="checkbox"
          checked={cpfConsentConfirmed}
          onChange={(event) => setCpfConsentConfirmed(event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-orange"
        />
        <span>Concordo que o CPF seja usado apenas para personalizar e proteger meus materiais.</span>
      </label>
      <button
        type="button"
        onClick={() => {
          setMessage(null);
          void startSubscription();
        }}
        disabled={isLoading}
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-orange px-4 py-2 text-sm font-bold text-orange transition hover:bg-orange/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Preparando acesso...' : label}
      </button>
      {message && <p className="mt-2 text-xs text-red-700 dark:text-red-300" role="alert">{message}</p>}
      <p className="mt-2 flex items-center gap-2 text-xs text-foreground/55">
        <span aria-hidden="true" className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-emerald-600/40 text-emerald-700 dark:text-emerald-300">
          <svg viewBox="0 0 20 20" className="h-2.5 w-2.5 fill-none stroke-current" strokeWidth="2">
            <path d="m5 10 3 3 7-7" />
          </svg>
        </span>
        Escolha o meio de pagamento após clicar
      </p>
    </div>
  );
}
