'use client';

import { useState, useTransition } from 'react';
import { startPremiumCheckout, type CheckoutResult } from '@/actions/subscriptions';

export function PremiumCheckoutButton() {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const handleClick = () => {
    setFeedback(null);
    startTransition(async () => {
      try {
        const result: CheckoutResult = await startPremiumCheckout();
        setFeedback(result.message);
        setCheckoutUrl(result.checkoutUrl);
      } catch (error) {
        setFeedback(
          error instanceof Error ? error.message : 'Não foi possível iniciar o checkout.'
        );
      }
    });
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="w-full py-3 bg-neon text-black font-bold rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isPending ? 'Preparando checkout...' : 'Assinar Premium'}
      </button>

      {feedback && <p className="text-xs opacity-80 text-center">{feedback}</p>}

      {checkoutUrl && (
        <a
          href={checkoutUrl}
          className="text-xs text-neon underline hover:opacity-80"
        >
          Ir para o checkout
        </a>
      )}
    </div>
  );
}