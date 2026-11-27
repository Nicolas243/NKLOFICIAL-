'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { Bookmark, Share2 } from 'lucide-react';
import { useState } from 'react';

const RAFFLE_URL = 'https://123rifas.com/acao/os-3-melhores-livros-de-financas-fisicos';

export type EditorialCardData = {
  eyebrow: string;
  title: string;
  description: string;
  destination: string;
  destinationLabel: string;
  incomeDisplay: string;
  imageSrc: string;
  imageAlt: string;
  badges: readonly string[];
  tags: readonly string[];
  caption: string;
  external?: boolean;
};

export const EDITORIAL_CARDS: EditorialCardData[] = [
  {
    eyebrow: 'Apoio independente',
    title: 'Os 3 melhores livros de finanças (ou R$ 50 no Pix)',
    description: 'Participe do sorteio: se ganhar, você escolhe entre receber os 3 livros físicos/digitais ou R$ 50 no Pix.',
    destination: RAFFLE_URL,
    destinationLabel: 'Abrir sorteio',
    incomeDisplay: 'Livros ou R$ 50 Pix',
    imageSrc: '/images/areas/renda-extra.jpg',
    imageAlt: 'Capa da ação de apoio do Portal NKL',
    badges: ['Português', 'Sorteio'],
    tags: ['Finanças', 'Livros ou Pix'],
    caption: 'Nota máxima NKL · Escolha o prêmio ao vencer',
    external: true,
  },
  {
    eyebrow: 'Programa de Liberdade Financeira',
    title: 'Guias para escolher melhor',
    description: 'Aprofunde seus próximos passos com materiais práticos para organizar sua renda extra.',
    destination: '/guias/renda-extra',
    destinationLabel: 'Conhecer o programa',
    incomeDisplay: 'R$ 400 a R$ 3.000/mês',
    imageSrc: '/images/areas/guia-renda-extra.jpg',
    imageAlt: 'Capa do Guia de Renda Extra Portal NKL',
    badges: ['Português', 'Acesso Digital'],
    tags: ['Renda extra', 'Guias práticos'],
    caption: 'Nota máxima NKL · Acesso imediato',
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
    const shareData = {
      title: card.title,
      text: card.description,
      url: new URL(card.destination, window.location.origin).toString(),
    };
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

  const saveOverlayClass =
    'inline-flex h-11 w-11 items-center justify-center rounded-md border border-border bg-income-card/90 font-bold shadow-sm backdrop-blur-sm transition-colors hover:border-neon hover:text-neon';
  const lerMaisClass =
    'inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-border px-3 text-xs font-bold leading-none hover:border-neon sm:text-sm';
  const mainCtaClass =
    'inline-flex h-11 min-w-0 flex-1 items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap rounded-md bg-neon px-3 text-xs font-bold leading-none text-black hover:opacity-90 sm:text-sm';

  return (
    <article
      className="group relative flex min-h-full cursor-pointer flex-col gap-4 rounded-xl border border-border bg-income-card/95 p-4 shadow-sm transition-colors hover:border-neon/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon [container-type:inline-size] md:gap-5 md:p-6"
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
      <div className="absolute right-3 top-3 z-20 md:right-4 md:top-4" onClick={stopCardNavigation}>
        {card.external ? (
          <a
            href={card.destination}
            target="_blank"
            rel="noopener noreferrer"
            className={saveOverlayClass}
            aria-label={`Abrir ${card.title}`}
            title={`Abrir ${card.title}`}
          >
            <Bookmark size={16} aria-hidden="true" />
          </a>
        ) : (
          <Link
            href={card.destination}
            className={saveOverlayClass}
            aria-label={`Abrir ${card.title}`}
            title={`Abrir ${card.title}`}
          >
            <Bookmark size={16} aria-hidden="true" />
          </Link>
        )}
      </div>

      <div className="flex min-w-0 items-start justify-between gap-3 pr-14">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-neon">{card.eyebrow}</p>
          <h2 className="mt-1 break-words font-playfair text-2xl font-bold">{card.title}</h2>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="inline-flex max-w-full items-center rounded-full border border-neon/40 bg-neon/10 px-2.5 py-1 text-xs font-bold text-neon">
            {card.incomeDisplay}
          </span>
          <span className="inline-flex min-h-9 shrink-0 items-center rounded-full border border-neon px-3 py-1.5 text-xs font-bold">
            10.0/10
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {card.badges.map((badge) => (
          <span key={badge} className="rounded-full border border-border px-2.5 py-1 text-xs font-medium">
            {badge}
          </span>
        ))}
      </div>

      <p className="line-clamp-2 text-sm leading-relaxed opacity-75">{card.description}</p>

      <div className="mt-auto flex min-w-0 flex-col gap-2">
        <div className="flex min-h-16 items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap content-start items-start gap-1.5">
              <span className="whitespace-nowrap rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-neon">
                Começar imediato
              </span>
              {card.tags.map((tag) => (
                <span
                  key={tag}
                  className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-border px-2.5 py-1 text-xs opacity-75"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="mt-1 text-xs opacity-50">{card.caption}</p>
          </div>
          {card.external ? (
            <a
              href={card.destination}
              target="_blank"
              rel="noopener noreferrer"
              onClick={stopCardNavigation}
              className="relative z-20 inline-flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background p-1 shadow-sm transition-transform hover:scale-105 hover:border-neon"
              aria-label={`Abrir oferta: ${card.title}`}
            >
              <img src={card.imageSrc} alt={card.imageAlt} className="h-full w-full rounded-md object-cover" />
            </a>
          ) : (
            <Link
              href={card.destination}
              onClick={stopCardNavigation}
              className="relative z-20 inline-flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background p-1 shadow-sm transition-transform hover:scale-105 hover:border-neon"
              aria-label={`Abrir oferta: ${card.title}`}
            >
              <img src={card.imageSrc} alt={card.imageAlt} className="h-full w-full rounded-md object-cover" />
            </Link>
          )}
        </div>

        <div className="flex min-w-0 w-full items-center gap-1.5 overflow-hidden">
          {card.external ? (
            <>
              <a
                href={card.destination}
                target="_blank"
                rel="noopener noreferrer"
                onClick={stopCardNavigation}
                className={lerMaisClass}
              >
                Ler mais
              </a>
              <a
                href={card.destination}
                target="_blank"
                rel="noopener noreferrer"
                onClick={stopCardNavigation}
                className={mainCtaClass}
              >
                {card.destinationLabel}
              </a>
            </>
          ) : (
            <>
              <Link href={card.destination} onClick={stopCardNavigation} className={lerMaisClass}>
                Ler mais
              </Link>
              <Link href={card.destination} onClick={stopCardNavigation} className={mainCtaClass}>
                {card.destinationLabel}
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void shareCard();
            }}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border text-neon transition-colors hover:border-neon hover:bg-neon/10"
            aria-label={`Compartilhar ${card.title}`}
            title="Compartilhar"
          >
            <Share2 size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {message && <p role="status" className="mt-2 text-xs text-neon">{message}</p>}
    </article>
  );
}
