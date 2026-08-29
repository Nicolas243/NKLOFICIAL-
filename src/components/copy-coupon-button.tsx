'use client';

import { useState } from 'react';

export function CopyCouponButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText('METODONKL');
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback para navegadores antigos ou contextos sem clipboard.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="bg-text text-bg border-none px-4 py-2 rounded-md cursor-pointer transition-opacity font-bold hover:opacity-80"
    >
      {copied ? 'Copiado!' : 'Copiar Cupom'}
    </button>
  );
}