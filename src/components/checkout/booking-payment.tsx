'use client';

import { useState } from 'react';

type BookingPaymentProps = {
  bookingId: string;
  basePrice: number;
  studentFee: number;
  total: number;
  modalityLabel: string;
  includedClasses: number;
};

export function BookingPayment({ bookingId, basePrice, studentFee, total, modalityLabel, includedClasses }: BookingPaymentProps) {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Pagamento</p>
          <h2 className="mt-2 font-playfair text-2xl font-bold">{modalityLabel}</h2>
        </div>
        <strong className="text-2xl">R$ {total.toFixed(2).replace('.', ',')}</strong>
      </div>
      <dl className="mb-6 space-y-2 text-sm opacity-80">
        <div className="flex justify-between"><dt>Valor da aula</dt><dd>R$ {basePrice.toFixed(2).replace('.', ',')}</dd></div>
        <div className="flex justify-between"><dt>Taxa da plataforma (5%)</dt><dd>R$ {studentFee.toFixed(2).replace('.', ',')}</dd></div>
        <div className="flex justify-between border-t border-border pt-2 font-bold text-foreground"><dt>Total</dt><dd>R$ {total.toFixed(2).replace('.', ',')}</dd></div>
      </dl>
      <p className="mb-6 text-sm opacity-75">O Stripe exibirá as formas de pagamento disponíveis para esta cobrança.</p>
      {includedClasses > 1 && <p className="mb-6 text-sm opacity-75">Após a aprovação, as {includedClasses} aulas do pacote serão liberadas automaticamente na sua carteira.</p>}
      <button
        type="button"
        className="w-full rounded-md bg-neon px-5 py-3 text-sm font-bold text-black transition hover:opacity-90"
        onClick={async () => {
          setMessage(null);
          const response = await fetch('/api/payments/create-booking-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId }),
          });
          const result: unknown = await response.json();
          if (!response.ok || typeof result !== 'object' || result === null || !('checkoutUrl' in result) || typeof result.checkoutUrl !== 'string') {
            setMessage('Não foi possível iniciar o pagamento. Tente novamente.');
            return;
          }
          window.location.assign(result.checkoutUrl);
        }}
      >
        Ir para o checkout Stripe
      </button>
      {message && <p className="mt-4 text-sm text-neon" role="status">{message}</p>}
    </section>
  );
}
