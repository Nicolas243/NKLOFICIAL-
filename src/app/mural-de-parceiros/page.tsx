/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  formatAdPrice,
  getActiveAdSlots,
  getActiveMuralCampaigns,
  getAdPricing,
  type ActiveAdSlot,
  type ActiveMuralCampaign,
} from '@/lib/ad-inventory';
import { absoluteSiteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mural de parceiros',
  description: 'Diretório vivo e sem limite máximo de marcas e projetos parceiros agrupados por área no Portal NKL.',
  alternates: { canonical: absoluteSiteUrl('/mural-de-parceiros') },
};

function categoryAnchorId(category: string): string {
  return (
    'area-' +
    category
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  );
}

export default async function PartnerMuralPage() {
  const [campaigns, slots] = await Promise.all([
    getActiveMuralCampaigns().catch((error: unknown) => {
      console.error('[MURAL_PAGE] Falha ao carregar campanhas ativas:', error);
      return [] as ActiveMuralCampaign[];
    }),
    getActiveAdSlots().catch((error: unknown) => {
      console.error('[MURAL_PAGE] Falha ao carregar inventário publicitário:', error);
      return [] as ActiveAdSlot[];
    }),
  ]);

  const pricing = getAdPricing();
  const slotByCampaignId = new Map(
    slots
      .filter((slot) => Boolean(slot.campaignId))
      .map((slot) => [slot.campaignId as string, slot.slotNumber]),
  );

  const fallbackCampaigns: ActiveMuralCampaign[] =
    campaigns.length > 0
      ? campaigns
      : slots
          .filter(
            (slot): slot is ActiveAdSlot & { campaignId: string; assetUrl: string; destinationUrl: string } =>
              Boolean(slot.campaignId && slot.assetUrl && slot.destinationUrl),
          )
          .map((slot) => ({
            id: slot.campaignId,
            businessName: slot.businessName ?? 'Marca parceira',
            businessCategory: 'Destaques do Portal',
            offerDescription: null,
            assetUrl: slot.assetUrl,
            assetMimeType: slot.assetMimeType,
            assetAltText: slot.assetAltText ?? slot.businessName ?? 'Anúncio parceiro',
            destinationUrl: slot.destinationUrl,
            monthlyAmountCents: pricing.monthlyPriceCents,
          }));

  const groupedByCategory = new Map<string, ActiveMuralCampaign[]>();
  for (const campaign of fallbackCampaigns) {
    const list = groupedByCategory.get(campaign.businessCategory) ?? [];
    list.push(campaign);
    groupedByCategory.set(campaign.businessCategory, list);
  }
  const categories = Array.from(groupedByCategory.entries()).sort(([a], [b]) =>
    a.localeCompare(b, 'pt-BR'),
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-4 md:pt-8">
      <header className="rounded-[1.5rem] border border-border bg-income-surface/90 px-5 py-8 md:rounded-[2rem] md:px-12 md:py-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">
          Diretório vivo · Sem limite máximo de áreas
        </p>
        <h1 className="mt-3 font-playfair text-4xl font-bold leading-tight md:text-6xl">
          Mural de parceiros
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-foreground/75 md:text-lg">
          Conforme empresas, professores, luthiers, serviços digitais e criadores anunciam a partir de{' '}
          <strong>{formatAdPrice(pricing.monthlyPriceCents)}/mês</strong>, novas áreas aparecem
          automaticamente aqui organizadas por categoria.
        </p>

        {categories.length > 0 && (
          <nav aria-label="Áreas ativas no mural" className="mt-6 flex flex-wrap gap-2">
            {categories.map(([cat, items]) => (
              <a
                key={cat}
                href={`#${categoryAnchorId(cat)}`}
                className="inline-flex min-h-10 items-center rounded-full border border-border bg-background/80 px-4 py-1.5 text-xs font-bold hover:border-neon hover:text-neon"
              >
                {cat} ({items.length})
              </a>
            ))}
          </nav>
        )}
      </header>

      {categories.length > 0 ? (
        <div className="mt-8 space-y-10">
          {categories.map(([cat, items]) => (
            <section
              key={cat}
              id={categoryAnchorId(cat)}
              aria-label={`Parceiros em ${cat}`}
              className="rounded-2xl border border-border bg-income-surface/80 p-5 md:p-6"
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon">
                    Área em destaque
                  </p>
                  <h2 className="mt-1 font-playfair text-2xl font-bold md:text-3xl">{cat}</h2>
                </div>
                <span className="rounded-full border border-border px-3 py-1 text-xs font-bold text-foreground/75">
                  {items.length} {items.length === 1 ? 'parceiro ativo' : 'parceiros ativos'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {items.map((campaign) => {
                  const slotNum = slotByCampaignId.get(campaign.id);
                  const href = slotNum ? `/api/ads/click?slot=${slotNum}` : campaign.destinationUrl;
                  return (
                    <a
                      key={campaign.id}
                      href={href}
                      target={slotNum ? undefined : '_blank'}
                      rel="sponsored noopener noreferrer"
                      aria-label={`Visitar anúncio de ${campaign.businessName}`}
                      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-income-card/90 transition-colors hover:border-neon"
                    >
                      <div className="aspect-video w-full overflow-hidden bg-black">
                        {campaign.assetUrl ? (
                          campaign.assetMimeType === 'video/webm' ? (
                            <video
                              src={campaign.assetUrl}
                              aria-label={campaign.assetAltText}
                              className="h-full w-full object-cover"
                              muted
                              loop
                              autoPlay
                              playsInline
                            />
                          ) : (
                            <img
                              src={campaign.assetUrl}
                              alt={campaign.assetAltText}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          )
                        ) : (
                          <div className="flex h-full items-center justify-center bg-slate-900 p-4 text-center text-sm font-bold text-slate-200">
                            {campaign.businessName}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between p-4">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-neon">
                            {campaign.businessCategory}
                          </p>
                          <h3 className="mt-1 font-playfair text-lg font-bold">
                            {campaign.businessName}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-foreground/70">
                            {campaign.offerDescription ?? campaign.assetAltText}
                          </p>
                        </div>
                        <span className="mt-3 inline-flex text-xs font-bold text-neon group-hover:underline">
                          Visitar parceiro
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section
          className="mt-8 rounded-2xl border border-orange/30 bg-orange/5 p-6 md:p-8"
          aria-label="Estado do mural de parceiros"
        >
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange">
            Inventário disponível · Plano mensal a partir de {formatAdPrice(pricing.monthlyPriceCents)}/mês
          </p>
          <h2 className="mt-2 font-playfair text-2xl font-bold">
            Nenhum anúncio está ativo no momento
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/75">
            O Portal NKL exibe neste mural apenas campanhas reais aprovadas pela revisão editorial.
            Não exibimos marcas fictícias nem espaços simulados como vendidos. Assim que você publicar
            sua marca, a sua área aparece aqui automaticamente.
          </p>
          <div className="mt-5">
            <Link
              href="/programas/anuncie"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-neon px-5 py-3 text-sm font-bold text-black hover:opacity-90"
            >
              Anunciar no mural mensal ({formatAdPrice(pricing.monthlyPriceCents)}/mês)
            </Link>
          </div>
        </section>
      )}

      <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl border border-border bg-income-surface/80 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div>
          <h2 className="font-playfair text-2xl font-bold">Quer aparecer por área neste mural?</h2>
          <p className="mt-1 text-sm leading-relaxed text-foreground/70">
            Assinatura mensal transparente com revisão editorial e cancelamento simples direto pelo Stripe.
          </p>
        </div>
        <Link
          href="/programas/anuncie"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-neon px-5 py-3 text-center text-sm font-bold text-black hover:opacity-90"
        >
          Conhecer planos para anunciar
        </Link>
      </div>
    </div>
  );
}
