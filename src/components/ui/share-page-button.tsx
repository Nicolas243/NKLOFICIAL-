'use client';

import { Share2 } from 'lucide-react';
import { useState } from 'react';
import { getCanonicalShareUrl } from '@/lib/share-url';

type Props = {
  canonicalHref?: string | null;
  title?: string;
  text?: string;
  className?: string;
  compact?: boolean;
};

export function SharePageButton({
  canonicalHref,
  title = 'Portal NKL',
  text = 'Confira esta página do Portal NKL.',
  className = '',
  compact = false,
}: Props) {
  const [message, setMessage] = useState<string | null>(null);

  async function share(): Promise<void> {
    const canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;
    const url = getCanonicalShareUrl({
      canonicalHref: canonicalHref ?? canonicalLink,
      currentHref: window.location.href,
    });

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        setMessage('Compartilhado.');
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setMessage('Mensagem e link copiados.');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setMessage('Não foi possível compartilhar agora.');
    }

    window.setTimeout(() => setMessage(null), 2600);
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => void share()}
        className={`inline-flex min-h-11 items-center gap-2 rounded-md border border-neon/50 px-3 py-2 text-sm font-bold text-neon hover:border-neon hover:bg-neon/10 ${compact ? 'rounded-full' : ''}`}
        aria-label={`Compartilhar ${title}`}
      >
        <Share2 size={16} aria-hidden="true" />
        <span>{compact ? 'Compartilhar página' : 'Compartilhar'}</span>
      </button>
      {message && <span role="status" className="text-xs text-neon">{message}</span>}
    </span>
  );
}
