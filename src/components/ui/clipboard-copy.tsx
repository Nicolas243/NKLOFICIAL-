'use client';

import { useState } from 'react';

type ClipboardCopyProps = {
  textToCopy: string;
};

export function ClipboardCopy({ textToCopy }: ClipboardCopyProps) {
  const [copied, setCopied] = useState(false);

  async function copyText(): Promise<void> {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('[CLIPBOARD_COPY] Falha ao copiar código:', error instanceof Error ? error.message : 'erro desconhecido');
    }
  }

  return (
    <button
      type="button"
      onClick={copyText}
      className="rounded-md border border-neon px-3 py-2 text-sm font-bold text-neon transition-colors hover:bg-neon hover:text-black"
    >
      {copied ? 'Copiado!' : 'Copiar código'}
    </button>
  );
}
