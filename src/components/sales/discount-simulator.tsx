'use client';

import { useEffect, useState } from 'react';
import { GuideCheckoutButton } from '@/components/sales/guide-checkout-button';

type Status = 'idle' | 'analyzing' | 'approved';
type DisplayPhase = 'normal' | 'approved' | 'denied';
type DiscountSimulatorProps = {
  offerVariant?: string;
};

const ANALYSIS_STEP_MS = 200;
const ANALYSIS_DURATION_MS = 3500;

const PHASE_STYLES: Record<DisplayPhase, string> = {
  normal: 'border-border bg-background text-foreground',
  approved: 'border-emerald-500/45 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
  denied: 'border-red-500/35 bg-red-500/10 text-red-900 dark:text-red-100',
};

const PHASE_LABELS: Record<DisplayPhase, string> = {
  normal: 'Preço normal',
  approved: 'Critério compatível',
  denied: 'Critério não compatível',
};

export function DiscountSimulator({ offerVariant = 'sales-page' }: DiscountSimulatorProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [displayPhase, setDisplayPhase] = useState<DisplayPhase>('normal');

  useEffect(() => {
    if (status !== 'analyzing') return;

    let phaseIndex = 0;
    const phases: DisplayPhase[] = ['approved', 'denied', 'normal'];
    const interval = window.setInterval(() => {
      setDisplayPhase(phases[phaseIndex % phases.length]);
      phaseIndex += 1;
    }, ANALYSIS_STEP_MS);
    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      setDisplayPhase('approved');
      setStatus('approved');
    }, ANALYSIS_DURATION_MS);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [status]);

  function startAnalysis(): void {
    setDisplayPhase('normal');
    setStatus('analyzing');
  }

  return (
    <section className="rounded-2xl border border-orange/25 bg-income-surface p-6 shadow-sm md:p-8" aria-labelledby="discount-simulator-title">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Oferta de lançamento</p>
      <h2 id="discount-simulator-title" className="mt-2 font-playfair text-3xl font-bold">O mapa completo para começar com clareza</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/70">
        Consulte a autenticidade da condição editorial antes de liberar o acesso. Não usamos dados pessoais nem prometemos renda.
      </p>

      <div className="mt-6 flex items-end gap-3" aria-label="Preço promocional">
        <span className="text-lg font-medium text-foreground/45 line-through">R$ 97,00</span>
        <span className="font-playfair text-5xl font-bold text-orange">R$ 39,00</span>
        <span className="pb-2 text-xs font-bold uppercase tracking-wide text-foreground/55">pagamento único</span>
      </div>
      <div className={`mt-5 rounded-xl border p-5 transition-colors duration-150 ${PHASE_STYLES[displayPhase]}`} aria-live="polite">
        <p className="text-xs font-bold uppercase tracking-[0.16em]">{PHASE_LABELS[displayPhase]}</p>
        {status === 'idle' && <p className="mt-2 text-sm">Verifique a autenticidade da oferta para habilitar o botão de acesso.</p>}
        {status === 'analyzing' && <p className="mt-2 text-sm font-bold">Verificando a condição editorial da oferta...</p>}
        {status === 'approved' && (
          <>
            <p className="mt-2 text-lg font-bold">Oferta autenticada. O acesso está liberado.</p>
            <p className="mt-2 text-sm">O checkout será aberto imediatamente ao clicar no botão.</p>
          </>
        )}
      </div>

      <div className="mt-5">
        <button type="button" onClick={startAnalysis} disabled={status === 'analyzing' || status === 'approved'} className="inline-flex min-h-12 items-center justify-center rounded-md border border-orange px-6 py-3 text-sm font-bold text-orange transition hover:bg-orange/10 disabled:cursor-not-allowed disabled:opacity-50">
          {status === 'analyzing' ? 'Verificando autenticidade...' : status === 'approved' ? 'Oferta autenticada' : 'Verificar autenticidade'}
        </button>
        <div className="mt-3">
          <GuideCheckoutButton label="Quero liberar meu acesso" enabled={status === 'approved'} offerVariant={offerVariant} />
        </div>
      </div>
    </section>
  );
}
