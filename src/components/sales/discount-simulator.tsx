'use client';

import { useCallback, useEffect, useState } from 'react';
import { GuideCheckoutButton } from '@/components/sales/guide-checkout-button';

type Status = 'idle' | 'analyzing' | 'approved' | 'unavailable';
type DisplayPhase = 'normal' | 'approved' | 'denied';
type DiscountSimulatorProps = {
  offerVariant?: string;
  hotmartCheckoutUrl?: string;
};

const PHASE_STYLES: Record<DisplayPhase, string> = {
  normal: 'border-border bg-background text-foreground',
  approved: 'border-emerald-500/45 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
  denied: 'border-red-500/35 bg-red-500/10 text-red-900 dark:text-red-100',
};

const PHASE_LABELS: Record<DisplayPhase, string> = {
  normal: 'Preço normal',
  approved: 'Critério compatível',
  denied: 'Oferta indisponível',
};

export function DiscountSimulator({ offerVariant = 'sales-page', hotmartCheckoutUrl }: DiscountSimulatorProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [displayPhase, setDisplayPhase] = useState<DisplayPhase>('normal');

  const startAnalysis = useCallback(async (): Promise<void> => {
    setDisplayPhase('normal');
    setStatus('analyzing');
    try {
      const response = await fetch('/api/sales/verify-offer', { cache: 'no-store' });
      const payload: { verified?: boolean; message?: string } = await response.json();
      if (!response.ok || !payload.verified) {
        setDisplayPhase('denied');
        setStatus('unavailable');
        return;
      }
      setDisplayPhase('approved');
      setStatus('approved');
    } catch (error) {
      console.error('[DISCOUNT_SIMULATOR] Falha ao verificar oferta:', error instanceof Error ? error.message : 'erro desconhecido');
      setDisplayPhase('denied');
      setStatus('unavailable');
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void startAnalysis();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [startAnalysis]);

  return (
    <section className="rounded-2xl border border-orange/25 bg-income-surface p-6 shadow-sm md:p-8" aria-labelledby="discount-simulator-title">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Oferta de lançamento</p>
      <h2 id="discount-simulator-title" className="mt-2 font-playfair text-3xl font-bold">Seu guia essencial para começar com clareza</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/70">
        Estamos confirmando a disponibilidade do checkout enquanto você conhece a oferta. Não usamos dados pessoais nem prometemos renda.
      </p>

      <div className="mt-6 flex items-end gap-3" aria-label="Preço promocional">
        <span className="text-lg font-medium text-foreground/45 line-through">R$ 97,00</span>
        <span className="font-playfair text-5xl font-bold text-orange">R$ 39,00</span>
        <span className="pb-2 text-xs font-bold uppercase tracking-wide text-foreground/55">pagamento único</span>
      </div>
      <div className={`mt-5 rounded-xl border p-5 transition-colors duration-150 ${PHASE_STYLES[displayPhase]}`} aria-live="polite">
        <p className="text-xs font-bold uppercase tracking-[0.16em]">{PHASE_LABELS[displayPhase]}</p>
        {status === 'idle' && <p className="mt-2 text-sm">Preparando a oferta...</p>}
        {status === 'analyzing' && <p className="mt-2 text-sm font-bold">Verificando disponibilidade no servidor...</p>}
        {status === 'approved' && (
          <>
            <p className="mt-2 text-lg font-bold">Oferta autenticada. O acesso está liberado.</p>
            <p className="mt-2 text-sm">Escolha o meio de pagamento ao clicar no botão.</p>
          </>
        )}
        {status === 'unavailable' && <p className="mt-2 text-sm">A oferta não pôde ser confirmada agora. Tente novamente em alguns instantes.</p>}
      </div>

      <div className="mt-5">
        <GuideCheckoutButton
          label="Quero liberar meu acesso"
          enabled={status === 'approved'}
          offerVariant={offerVariant}
          hotmartCheckoutUrl={hotmartCheckoutUrl}
        />
      </div>
    </section>
  );
}
