'use client';

import { useState } from 'react';
import { PaymentBrick } from '@/components/payment-brick';

type BookingPaymentProps = {
  bookingId: string;
  basePrice: number;
  studentFee: number;
  total: number;
};

export function BookingPayment({ bookingId, basePrice, studentFee, total }: BookingPaymentProps) {
  const [message, setMessage] = useState('');

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Pagamento</p>
          <h2 className="mt-2 font-playfair text-2xl font-bold">Aula individual</h2>
        </div>
        <strong className="text-2xl">R$ {total.toFixed(2).replace('.', ',')}</strong>
      </div>
      <dl className="mb-6 space-y-2 text-sm opacity-80">
        <div className="flex justify-between"><dt>Valor da aula</dt><dd>R$ {basePrice.toFixed(2).replace('.', ',')}</dd></div>
        <div className="flex justify-between"><dt>Taxa da plataforma (5%)</dt><dd>R$ {studentFee.toFixed(2).replace('.', ',')}</dd></div>
        <div className="flex justify-between border-t border-border pt-2 font-bold text-foreground"><dt>Total</dt><dd>R$ {total.toFixed(2).replace('.', ',')}</dd></div>
      </dl>
      <PaymentBrick
        amount={total}
        onSubmitPayment={async (formData) => {
          const response = await fetch('/api/payments/create-booking-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...formData, bookingId }),
          });
          const result: unknown = await response.json();
          if (!response.ok) {
            setMessage('Não foi possível iniciar o pagamento. Tente novamente.');
            throw new Error('booking_payment_failed');
          }
          setMessage('Pagamento enviado. Aguarde a confirmação para liberar a sala.');
          return result;
        }}
      />
      {message && <p className="mt-4 text-sm text-neon" role="status">{message}</p>}
    </section>
  );
}
