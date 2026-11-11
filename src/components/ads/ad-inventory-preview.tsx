import Link from 'next/link';
import {
  AD_BANDS,
  AD_MURAL_SLOTS,
  type AdPreviewSlot,
} from '@/lib/ad-inventory';

function PreviewSlot({ slot }: { slot: AdPreviewSlot }) {
  return (
    <div
      data-ad-slot
      aria-label={slot.label}
      className="flex aspect-square min-h-11 min-w-11 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-orange-400/40 bg-orange-50/60 p-2 text-center text-[10px] font-semibold uppercase tracking-wide text-orange-800 dark:border-orange-300/30 dark:bg-orange-950/20 dark:text-orange-200"
    >
      <span className="sr-only">{slot.label}</span>
      <span aria-hidden="true">Espaço livre</span>
    </div>
  );
}

export function AdInventoryPreview() {
  return (
    <section className="space-y-10" aria-labelledby="ad-inventory-title">
      <div className="rounded-2xl border border-orange-300/40 bg-orange-50/70 p-5 text-orange-950 dark:border-orange-200/20 dark:bg-orange-950/20 dark:text-orange-100">
        <p className="text-xs font-bold uppercase tracking-[0.18em]">Prévia local</p>
        <p className="mt-2 text-sm leading-relaxed">
          Este mural mostra uma ideia visual de inventário. O valor exibido é apenas
          simbólico: ainda não há cobrança, assinatura ou publicação automática.
        </p>
      </div>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600 dark:text-orange-300">Mural NKL</p>
            <h2 id="ad-inventory-title" className="mt-2 font-playfair text-3xl font-bold">Blocos para negócios parceiros</h2>
          </div>
          <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground/60">40 espaços · referência 80px</span>
        </div>
        <div data-ad-inventory="mural" className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10">
          {AD_MURAL_SLOTS.map((slot) => <PreviewSlot key={slot.id} slot={slot} />)}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600 dark:text-orange-300">Faixas in-feed</p>
          <h2 className="mt-2 font-playfair text-3xl font-bold">Espaços horizontais no fluxo</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/70">
            Cada faixa tem dez espaços e pode ser rolada no celular. Uma futura versão
            poderá oferecer assinatura mensal e medição de cliques, depois de definirmos
            regras de moderação e transparência.
          </p>
        </div>
        {AD_BANDS.map((band, index) => (
          <div key={band[0]?.id ?? index} data-ad-inventory="band" className="overflow-x-auto pb-2">
            <div className="flex min-w-max gap-2">
              {band.map((slot) => <PreviewSlot key={slot.id} slot={slot} />)}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6 text-center">
        <h2 className="font-playfair text-2xl font-bold">Quer reservar interesse?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-foreground/70">
          Fale com a equipe pelo fluxo existente de anúncios. Esta prévia não cobra e
          não garante visualizações ou leads.
        </p>
        <Link
          href="/noticias/anunciar"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-orange-500 px-5 py-3 font-bold text-white transition-colors hover:bg-orange-600"
        >
          Quero anunciar
        </Link>
      </div>
    </section>
  );
}
