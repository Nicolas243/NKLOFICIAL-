import { getRifaCampaignUrl } from '@/lib/rifa-campaign';

export function EditorialSupportOffers() {
  const raffleUrl = getRifaCampaignUrl('card');

  return (
    <section className="mt-8" aria-label="Apoie o Portal NKL">
      <article className="rounded-xl border border-neon/35 bg-neon/5 p-4 shadow-sm transition hover:border-neon/60 md:p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon">Apoie o Portal NKL</p>
        <h2 className="mt-2 font-playfair text-xl font-bold">Apoie e concorra no sorteio</h2>
        <p className="mt-2 text-sm leading-relaxed opacity-75">A curadoria, a revisão e a manutenção do catálogo dependem do apoio de quem usa o Portal. Participe da ação e, se ganhar, escolha entre receber 3 livros sobre finanças e empreendedorismo (físicos ou digitais) ou R$ 50 no Pix.</p>
        <a
          href={raffleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-neon px-4 py-2 text-sm font-bold text-black hover:opacity-90"
        >
          Participar do sorteio
        </a>
      </article>
    </section>
  );
}
