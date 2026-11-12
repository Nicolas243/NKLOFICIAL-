import type { Metadata } from 'next';
import Link from 'next/link';
import { NativeAdPreview } from '@/components/ads/native-ad-preview';
import {
  calculateNovemberProjection,
  getConfiguredProjectionFromEnv,
} from '@/lib/analytics/november-projection';
import { absoluteSiteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Anuncie no Portal NKL',
  description: 'Conheça as prévias dos espaços publicitários próprios do Portal NKL.',
  alternates: { canonical: absoluteSiteUrl('/anuncie') },
};

export default function AdvertisePage() {
  const configuredPreview = getConfiguredProjectionFromEnv();
  const projection = configuredPreview
    ? calculateNovemberProjection({ recentDailyViews: [], configuredPreview })
    : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-4 md:pt-8">
      <header className="rounded-[1.5rem] border border-border bg-income-surface/90 px-5 py-8 md:rounded-[2rem] md:px-12 md:py-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Prévia de lançamento</p>
        <h1 className="mt-3 max-w-3xl font-playfair text-4xl font-bold leading-tight md:text-6xl">Anuncie no Portal NKL</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-foreground/75 md:text-lg">
          Apresente sua marca para pessoas que estão comparando caminhos de renda extra, serviços e conteúdo.
          Os formatos abaixo são uma prévia editorial, ainda sem checkout ou inventário ativo.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="#formatos" className="inline-flex min-h-11 items-center rounded-md bg-neon px-5 py-3 text-sm font-bold text-black hover:opacity-90">
            Ver formatos
          </Link>
          <Link href="/mural-de-parceiros" className="inline-flex min-h-11 items-center rounded-md border border-border px-5 py-3 text-sm font-bold hover:border-neon hover:text-neon">
            Ver mural de prévia
          </Link>
        </div>
      </header>

      <div className="mt-5 rounded-xl border border-orange/30 bg-orange/5 px-4 py-3 text-sm leading-relaxed text-foreground/75">
        <strong className="text-foreground">Sem checkout ativo nesta fase.</strong> Nenhuma vaga é vendida,
        nenhum pagamento é processado e nenhum anúncio real está publicado.
      </div>

      <section id="formatos" className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-border bg-income-surface/80 p-5 md:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon">Formato 01</p>
          <h2 className="mt-2 font-playfair text-3xl font-bold">Mural de parceiros</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/70">
            Um bloco visual com tiles quadrados para marcas que querem presença contínua em uma página dedicada.
          </p>
          <p className="mt-5 text-2xl font-bold text-neon">R$ 19,90<span className="text-sm font-normal text-foreground/60">/mês por tile</span></p>
        </article>
        <article className="rounded-2xl border border-border bg-income-surface/80 p-5 md:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon">Formato 02</p>
          <h2 className="mt-2 font-playfair text-3xl font-bold">Lote nativo</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/70">
            Uma faixa horizontal dividida em dez espaços, pensada para aparecer entre conteúdos sem bloquear a leitura.
          </p>
          <p className="mt-5 text-2xl font-bold text-neon">R$ 49,90<span className="text-sm font-normal text-foreground/60">/mês por lote</span></p>
        </article>
      </section>

      <div className="mt-8">
        <NativeAdPreview projection={projection} />
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-income-surface/80 p-5 md:p-6">
        <h2 className="font-playfair text-2xl font-bold">O que ainda será definido</h2>
        <ul className="mt-4 grid gap-3 text-sm leading-relaxed text-foreground/70 md:grid-cols-2">
          <li>Critérios de aprovação, transparência e remoção.</li>
          <li>Termos de publicidade e política de cancelamento.</li>
          <li>Checkout e recibos, em uma fase posterior.</li>
          <li>Métricas reais de alcance e cliques, sem promessas antecipadas.</li>
        </ul>
      </section>
    </div>
  );
}
