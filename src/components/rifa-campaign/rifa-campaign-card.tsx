import { RIFA_CAMPAIGN_COPY } from '@/lib/rifa-campaign';
import { RifaCampaignLink } from './rifa-campaign-link';

export function RifaCampaignCard() {
  return (
    <section className="mx-auto my-8 w-[min(100%-2rem,72rem)] rounded-2xl border border-orange-500/25 bg-orange-500/5 p-6" aria-labelledby="rifa-campaign-card-title">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-500">Apoio independente</p>
      <h2 id="rifa-campaign-card-title" className="mt-2 font-playfair text-2xl font-bold">{RIFA_CAMPAIGN_COPY.card.title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/75">{RIFA_CAMPAIGN_COPY.card.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <RifaCampaignLink surface="card" action="participate" className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">Participar por R$ 3</RifaCampaignLink>
        <RifaCampaignLink surface="card" action="rules" className="rounded-lg border border-border px-4 py-2 text-sm font-bold hover:border-orange-500">Ver prêmios e regras</RifaCampaignLink>
      </div>
    </section>
  );
}
