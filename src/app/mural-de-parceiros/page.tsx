/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next';
import Link from 'next/link';
import { getActiveAdSlots, type ActiveAdSlot } from '@/lib/ad-inventory';
import { absoluteSiteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mural de parceiros',
  description: 'Marcas e projetos parceiros com campanha ativa no Portal NKL.',
  alternates: { canonical: absoluteSiteUrl('/mural-de-parceiros') },
};

export default async function PartnerMuralPage() {
  const slots = await getActiveAdSlots().catch((error: unknown) => {
    console.error('[MURAL_PAGE] Falha ao carregar inventário publicitário:', error);
    return [] as ActiveAdSlot[];
  });
  const activeSlots = slots.filter(
    (slot): slot is ActiveAdSlot & { campaignId: string; assetUrl: string; destinationUrl: string } =>
      Boolean(slot.campaignId && slot.assetUrl && slot.destinationUrl),
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-4 md:pt-8">
      <header className="rounded-[1.5rem] border border-border bg-income-surface/90 px-5 py-8 md:rounded-[2rem] md:px-12 md:py-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Publicidade · Inventário editorial</p>
        <h1 className="mt-3 font-playfair text-4xl font-bold leading-tight md:text-6xl">Mural de parceiros</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-foreground/75 md:text-lg">
          Uma página dedicada a marcas e projetos com campanhas revisadas e ativas para quem explora o Portal NKL.
        </p>
      </header>

      {activeSlots.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-border bg-income-surface/80 p-4 md:p-6" aria-label="Parceiros ativos no mural">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {activeSlots.map((slot) => (
              <a
                key={slot.slotNumber}
                href={`/api/ads/click?slot=${slot.slotNumber}`}
                rel="sponsored noopener"
                aria-label={`Visitar anúncio de ${slot.businessName ?? 'empresa parceira'}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-income-card/90 transition-colors hover:border-neon"
              >
                <div className="aspect-video w-full overflow-hidden bg-black">
                  {slot.assetMimeType === 'video/webm' ? (
                    <video
                      src={slot.assetUrl}
                      aria-label={slot.assetAltText ?? slot.businessName ?? 'Anúncio'}
                      className="h-full w-full object-cover"
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <img
                      src={slot.assetUrl}
                      alt={slot.assetAltText ?? slot.businessName ?? 'Anúncio'}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-neon">
                      Espaço {String(slot.slotNumber).padStart(2, '0')}
                    </p>
                    <h2 className="mt-1 font-playfair text-lg font-bold">
                      {slot.businessName ?? 'Marca parceira'}
                    </h2>
                    {slot.assetAltText && (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-foreground/70">
                        {slot.assetAltText}
                      </p>
                    )}
                  </div>
                  <span className="mt-3 inline-flex text-xs font-bold text-neon group-hover:underline">
                    Visitar parceiro
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : (
        <section className="mt-8 rounded-2xl border border-orange/30 bg-orange/5 p-6 md:p-8" aria-label="Estado do mural de parceiros">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange">Inventário disponível</p>
          <h2 className="mt-2 font-playfair text-2xl font-bold">Nenhum anúncio está ativo no momento</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/75">
            O Portal NKL exibe neste mural apenas campanhas reais aprovadas pela revisão editorial. Não exibimos marcas fictícias nem espaços simulados como vendidos.
          </p>
          <div className="mt-5">
            <Link
              href="/programas/anuncie"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-neon px-5 py-3 text-sm font-bold text-black hover:opacity-90"
            >
              Reservar espaço publicitário
            </Link>
          </div>
        </section>
      )}

      <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl border border-border bg-income-surface/80 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div>
          <h2 className="font-playfair text-2xl font-bold">Quer entender os formatos?</h2>
          <p className="mt-1 text-sm leading-relaxed text-foreground/70">Veja os valores, as regras de revisão editorial e a disponibilidade atual de cotas.</p>
        </div>
        <Link href="/programas/anuncie" className="inline-flex min-h-11 items-center justify-center rounded-md bg-neon px-5 py-3 text-center text-sm font-bold text-black hover:opacity-90">
          Conhecer planos para anunciar
        </Link>
      </div>
    </div>
  );
}
