import Link from 'next/link';
import type { ProjectionResult } from '@/lib/analytics/november-projection';
import { AdPreviewTile } from '@/components/ads/ad-preview-tile';

type NativeAdPreviewProps = {
  projection?: ProjectionResult | null;
};

function formatViews(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function NativeAdPreview({ projection }: NativeAdPreviewProps) {
  return (
    <section
      aria-label="Prévia de lote nativo"
      className="overflow-hidden rounded-2xl border border-orange/30 bg-income-surface/90 p-4 shadow-[0_16px_40px_rgba(70,55,35,0.08)] md:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange">Publicidade · Prévia</p>
          <h2 className="mt-2 font-playfair text-2xl font-bold">Lote nativo no fluxo do Portal NKL</h2>
        </div>
        <span className="rounded-full border border-orange/30 px-3 py-1 text-xs font-bold text-orange">R$ 49,90/mês</span>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10">
        {Array.from({ length: 10 }, (_, index) => <AdPreviewTile key={index} index={index + 1} compact />)}
      </div>
      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-income-card/70 p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-foreground/75">
          {projection
            ? <>Anuncie aqui e alcance uma projeção de <strong className="text-foreground">{formatViews(projection.projectedNovember)} visualizações</strong> em novembro.</>
            : 'A projeção de visualizações será exibida quando o painel de analytics estiver configurado.'}
        </p>
        <Link href="/anuncie" className="inline-flex min-h-11 items-center justify-center rounded-md bg-neon px-4 py-2 text-center text-sm font-bold text-black hover:opacity-90">
          Quero anunciar
        </Link>
      </div>
    </section>
  );
}
