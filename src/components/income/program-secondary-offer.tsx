'use client';

import { useEffect, useState } from 'react';
import { NativeAdCard } from '@/components/income/native-ad-card';
import { parseProgramSecondaryCtaVariant, PROGRAM_SECONDARY_CTA_VARIANTS } from '@/lib/offer-experiment';

const STORAGE_KEY = 'nkl_program_secondary_cta_variant_v1';

type ProgramSecondaryOfferProps = {
  programSlug: string;
  currentPage: number;
};

function randomVariant(): string {
  return PROGRAM_SECONDARY_CTA_VARIANTS[Math.floor(Math.random() * PROGRAM_SECONDARY_CTA_VARIANTS.length)] ?? '0';
}

export function ProgramSecondaryOffer({ programSlug, currentPage }: ProgramSecondaryOfferProps) {
  const [variant, setVariant] = useState<string | null>(null);

  useEffect(() => {
    const storedVariant = parseProgramSecondaryCtaVariant(window.localStorage.getItem(STORAGE_KEY));
    if (storedVariant !== null) {
      const frame = window.requestAnimationFrame(() => setVariant(storedVariant));
      return () => window.cancelAnimationFrame(frame);
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    const loadVariant = async (): Promise<void> => {
      try {
        const response = await fetch('/api/sales/offer-events?experiment=program-secondary-cta', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Resposta ${response.status}`);
        const payload: { variant?: string } = await response.json();
        const selectedVariant = parseProgramSecondaryCtaVariant(payload.variant);
        if (selectedVariant === null) throw new Error('Variante inválida.');
        window.localStorage.setItem(STORAGE_KEY, selectedVariant);
        if (!cancelled) setVariant(selectedVariant);
      } catch (error) {
        console.error('[PROGRAM_SECONDARY_CTA] Falha ao escolher variante:', error instanceof Error ? error.message : 'erro desconhecido');
        const fallback = randomVariant();
        window.localStorage.setItem(STORAGE_KEY, fallback);
        if (!cancelled) setVariant(fallback);
      } finally {
        window.clearTimeout(timeout);
      }
    };

    void loadVariant();
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, []);

  if (variant === null) return null;

  return (
    <section className="mt-5" aria-label="Recomendação editorial">
      <NativeAdCard
        currentPage={currentPage}
        experiment="program-secondary-cta"
        variant={variant}
        impressionKey={`program-secondary-cta:${programSlug}`}
      />
    </section>
  );
}
