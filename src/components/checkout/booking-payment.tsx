'use client';

import { useState } from 'react';
import { PaymentBrick } from '@/components/payment-brick';

type BookingPaymentProps = {
  bookingId: string;
};

export function BookingPayment({ bookingId }: BookingPaymentProps) {
  const [message, setMessage] = useState('');

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Pagamento</p>
          <h2 className="mt-2 font-playfair text-2xl font-bold">Aula individual</h2>
        </div>
        <strong className="text-2xl">R$ 150,00</strong>
      </div>
      <PaymentBrick
        amount={150}
        onSubmitPayment={async (formData) => {
          const response = await fetch('/api/payments/booking', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-booking-id': bookingId,
            },
            body: JSON.stringify(formData),
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
