'use client';

import { useState } from 'react';

const PLATFORM_LABELS: Record<string, string> = {
  mercado_livre: 'Mercado Livre',
  shopee: 'Shopee',
  ebay: 'eBay',
  amazon: 'Amazon',
  ver_mais: 'Ver mais ofertas',
};

const PLATFORM_ORDER = ['mercado_livre', 'shopee', 'ebay', 'amazon', 'ver_mais'];

/**
 * Tarefa 6 — CTA "Comprar" que revela as opções de marketplace da corda
 * (links de afiliados migrados do legado, armazenados no jsonb
 * `strings_catalog.affiliate_links`).
 */
export function AffiliateLinks({
  links,
  variant = 'full',
}: {
  links: Record<string, string> | null;
  /** 'full' = bloco vertical (detalhe) | 'compact' = inline no card do catálogo */
  variant?: 'full' | 'compact';
}) {
  const [open, setOpen] = useState(false);

  if (!links) return null;

  const entries = PLATFORM_ORDER.filter((key) => Boolean(links[key]?.trim())).map((key) => ({
    key,
    label: PLATFORM_LABELS[key] ?? key,
    url: links[key].trim(),
  }));

  if (entries.length === 0) return null;

  if (variant === 'compact') {
    return (
      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 px-4 py-2 border border-neon text-neon rounded-md font-bold text-sm transition-all hover:bg-neon hover:text-black"
        >
          Comprar <span className="text-xs">{open ? '▴' : '▾'}</span>
        </button>
        {open && (
          <div className="absolute left-0 bottom-full mb-2 z-20 min-w-[180px] bg-surface border border-border rounded-lg shadow-xl py-2 px-2 flex flex-col gap-1">
            {entries.map((entry) => (
              <a
                key={entry.key}
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-neon transition-colors"
              >
                {entry.label}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex justify-center py-3 bg-text text-bg rounded-md font-bold transition-all hover:opacity-90"
      >
        {open ? 'Fechar opções' : 'Comprar'}
      </button>
      {open && (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <a
              key={entry.key}
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex justify-center py-2.5 px-4 border border-neon text-neon rounded-md font-bold text-sm transition-all hover:bg-neon hover:text-black"
            >
              {entry.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
