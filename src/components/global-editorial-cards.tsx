'use client';

import Image from 'next/image';
import { BellPlus, Share2 } from 'lucide-react';
import { useState } from 'react';

const RAFFLE_URL = 'https://123rifas.com/acao/os-3-melhores-livros-de-financas-fisicos';

export type EditorialCardData = {
  eyebrow: string;
  title: string;
  description: string;
  destination: string;
  destinationLabel: string;
  accentClass: string;
  tags: string[];
  external?: boolean;
};

export const EDITORIAL_CARDS: EditorialCardData[] = [
  {
    eyebrow: 'Apoio independente',
    title: 'Os 3 melhores livros de finanças',
    description: 'Participe do sorteio e concorra a uma seleção física para transformar seus próximos passos financeiros.',
    destination: RAFFLE_URL,
    destinationLabel: 'Abrir sorteio',
    accentClass: 'border-orange-500/35 bg-orange-500/5',
    tags: ['Sorteio', 'Finanças', 'Livros'],
    external: true,
  },
  {
    eyebrow: 'Programa de Liberdade Financeira',
    title: 'Guias para escolher melhor',
    description: 'Aprofunde seus próximos passos com materiais práticos para organizar sua renda extra.',
    destination: '/guias/renda-extra',
    destinationLabel: 'Conhecer o programa',
    accentClass: 'border-neon/35 bg-neon/5',
    tags: ['Renda extra', 'Guias', 'Próximos passos'],
  },
];

function stopCardNavigation(event: React.MouseEvent<HTMLElement>) {
  event.stopPropagation();
}

export function EditorialCardView({ card }: { card: EditorialCardData }) {
  const [message, setMessage] = useState<string | null>(null);
  const navigate = () => {
    if (card.external) window.open(card.destination, '_blank', 'noopener,noreferrer');
    else window.location.assign(card.destination);
  };

  async function shareCard() {
    const shareData = { title: card.title, text: card.description, url: new URL(card.destination, window.location.origin).toString() };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(shareData.url);
        setMessage('Link copiado.');
        window.setTimeout(() => setMessage(null), 2200);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setMessage('Não foi possível compartilhar agora.');
      window.setTimeout(() => setMessage(null), 2200);
    }
  }

  return (
    <article
      className="group relative flex min-h-full cursor-pointer flex-col gap-4 rounded-xl border border-border bg-income-card/95 p-4 shadow-sm transition hover:border-neon/60 hover:shadow-md [container-type:inline-size] md:gap-5 md:p-6"
      onClick={navigate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate();
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`Abrir ${card.title}`}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-neon">{card.eyebrow}</p>
          <h2 className="mt-1 break-words font-playfair text-2xl font-bold">{card.title}</h2>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium">Apoio independente</span>
        <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium">Conteúdo NKL</span>
      </div>
      <p className="line-clamp-2 text-sm leading-relaxed opacity-75">{card.description}</p>
      <div className="mt-auto flex min-w-0 flex-col gap-2">
        <div className="flex min-h-16 items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap content-start items-start gap-1.5">
            {card.tags.map((tag) => <span key={tag} className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-border px-2.5 py-1 text-xs opacity-75">{tag}</span>)}
          </div>
          <a
            href={card.destination}
            target={card.external ? '_blank' : undefined}
            rel={card.external ? 'noopener noreferrer' : undefined}
            onClick={stopCardNavigation}
            className="relative z-20 inline-flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neon/40 bg-white p-1.5"
            aria-label={`Abrir oferta: ${card.title}`}
          >
            <Image src="/NKL/nkl-logo.png" alt="Logo Portal NKL" width={64} height={64} className="h-full w-full object-contain" />
          </a>
        </div>
        <div className="flex min-w-0 w-full items-center gap-1.5 overflow-hidden">
          <a
            href={card.destination}
            target={card.external ? '_blank' : undefined}
            rel={card.external ? 'noopener noreferrer' : undefined}
            onClick={stopCardNavigation}
            className="inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-border px-3 text-sm font-bold leading-none hover:border-neon"
          >
            Ler mais
          </a>
          <a
            href={card.destination}
            target={card.external ? '_blank' : undefined}
            rel={card.external ? 'noopener noreferrer' : undefined}
            onClick={stopCardNavigation}
            className="inline-flex h-11 min-w-0 flex-1 items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap rounded-md bg-neon px-2 text-sm font-bold leading-none text-black hover:opacity-90"
          >
            {card.destinationLabel}
          </a>
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); void shareCard(); }}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border text-neon transition-colors hover:border-neon hover:bg-neon/10"
            aria-label={`Compartilhar ${card.title}`}
            title="Compartilhar"
          >
            <Share2 size={16} aria-hidden="true" />
          </button>
          <a
            href={card.destination}
            target={card.external ? '_blank' : undefined}
            rel={card.external ? 'noopener noreferrer' : undefined}
            onClick={stopCardNavigation}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border text-neon transition-colors hover:border-neon hover:bg-neon/10"
            aria-label={`Criar lembrete para ${card.title}`}
            title="Criar lembrete"
          >
            <BellPlus size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
      {message && <p role="status" className="mt-2 text-xs text-neon">{message}</p>}
    </article>
  );
}
