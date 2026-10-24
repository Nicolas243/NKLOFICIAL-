'use client';

import { useEffect, type ComponentProps } from 'react';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

type PaymentProps = ComponentProps<typeof Payment>;

type PaymentBrickProps = {
  amount: number;
  onSubmitPayment: NonNullable<PaymentProps['onSubmit']>;
};

export function PaymentBrick({ amount, onSubmitPayment }: PaymentBrickProps) {
  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;

  useEffect(() => {
    if (!publicKey) {
      console.error('[PAYMENT_BRICK] NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ausente.');
      return;
    }

    initMercadoPago(publicKey, { locale: 'pt-BR' });
  }, [publicKey]);

  if (!publicKey) {
    return <p role="alert" className="text-sm text-red-400">Pagamento temporariamente indisponível.</p>;
  }

  const initialization: PaymentProps['initialization'] = { amount };

  return (
    <Payment
      initialization={initialization}
      customization={{ paymentMethods: { creditCard: 'all' } }}
      onSubmit={async (formData) => {
        try {
          await onSubmitPayment(formData);
        } catch (error) {
          console.error('[PAYMENT_BRICK] Falha ao processar pagamento:', error instanceof Error ? error.message : 'erro desconhecido');
          throw error;
        }
      }}
      onReady={() => {
        console.log('[PAYMENT_BRICK] Brick pronto.');
      }}
      onError={(error) => {
        console.error('[PAYMENT_BRICK] Erro do Brick:', error);
      }}
    />
  );
}
