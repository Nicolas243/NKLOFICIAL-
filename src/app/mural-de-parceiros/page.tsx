import type { Metadata } from 'next';
import Link from 'next/link';
import { AdPreviewTile } from '@/components/ads/ad-preview-tile';
import { absoluteSiteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Mural de parceiros',
  description: 'Prévia do mural de parceiros do Portal NKL.',
  alternates: { canonical: absoluteSiteUrl('/mural-de-parceiros') },
};

export default function PartnerMuralPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-4 md:pt-8">
      <header className="rounded-[1.5rem] border border-border bg-income-surface/90 px-5 py-8 md:rounded-[2rem] md:px-12 md:py-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Publicidade · Prévia</p>
        <h1 className="mt-3 font-playfair text-4xl font-bold leading-tight md:text-6xl">Mural de parceiros</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-foreground/75 md:text-lg">
          Uma página dedicada a marcas e projetos que desejam ser descobertos por quem explora o Portal NKL.
        </p>
      </header>

      <div className="mt-5 rounded-xl border border-orange/30 bg-orange/5 px-4 py-3 text-sm leading-relaxed text-foreground/75">
        <strong className="text-foreground">Prévia — nenhum anúncio está ativo.</strong> Estes tiles mostram apenas a
        proporção do formato; não representam inventário vendido ou marcas publicadas.
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-income-surface/80 p-4 md:p-6" aria-label="Tiles de prévia do mural">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-10 md:gap-3">
          {Array.from({ length: 20 }, (_, index) => <AdPreviewTile key={index} index={index + 1} />)}
        </div>
      </section>

      <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl border border-border bg-income-surface/80 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div>
          <h2 className="font-playfair text-2xl font-bold">Quer entender os formatos?</h2>
          <p className="mt-1 text-sm leading-relaxed text-foreground/70">Veja os valores de pré-lançamento e as limitações desta fase.</p>
        </div>
        <Link href="/anuncie" className="inline-flex min-h-11 items-center justify-center rounded-md bg-neon px-5 py-3 text-center text-sm font-bold text-black hover:opacity-90">
          Conhecer planos para anunciar
        </Link>
      </div>
    </div>
  );
}
