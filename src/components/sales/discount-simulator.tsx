'use client';

import { useEffect, useState } from 'react';
import { GuideCheckoutButton } from '@/components/sales/guide-checkout-button';

type Status = 'idle' | 'analyzing' | 'approved';
type DisplayPhase = 'normal' | 'approved' | 'denied';

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

export function DiscountSimulator() {
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
    <section className="rounded-2xl border border-orange/30 bg-surface p-6 shadow-sm md:p-8" aria-labelledby="discount-simulator-title">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Oferta transparente</p>
      <h2 id="discount-simulator-title" className="mt-2 font-playfair text-3xl font-bold">Veja a condição disponível para este lançamento</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/70">
        A verificação abaixo é uma simulação visual da oferta editorial. Ela não consulta dados pessoais, não substitui critérios de pagamento e não garante renda.
      </p>

      <div className={`mt-6 rounded-xl border p-5 transition-colors duration-150 ${PHASE_STYLES[displayPhase]}`} aria-live="polite">
        <p className="text-xs font-bold uppercase tracking-[0.16em]">{PHASE_LABELS[displayPhase]}</p>
        {status === 'idle' && <p className="mt-2 text-sm">Clique para visualizar a condição promocional do guia.</p>}
        {status === 'analyzing' && <p className="mt-2 text-sm font-bold">Analisando a condição editorial da oferta...</p>}
        {status === 'approved' && (
          <>
            <p className="mt-2 text-lg font-bold">Análise concluída. Perfil validado para Desconto Especial.</p>
            <p className="mt-2 text-sm">A condição promocional do lançamento é R$ 39,00 em pagamento único. Informe seu e-mail abaixo para abrir o checkout seguro do Mercado Pago.</p>
          </>
        )}
      </div>

      <div className="mt-5">
        {status !== 'approved' ? (
          <button type="button" onClick={startAnalysis} disabled={status === 'analyzing'} className="inline-flex min-h-12 items-center justify-center rounded-md bg-orange px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-dark disabled:cursor-wait disabled:opacity-60">
            {status === 'analyzing' ? 'Verificando elegibilidade...' : 'Verificar elegibilidade'}
          </button>
        ) : (
          <GuideCheckoutButton label="Iniciar checkout" />
        )}
      </div>
    </section>
  );
}
