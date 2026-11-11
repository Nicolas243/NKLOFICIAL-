import type { Metadata } from 'next';
import { GuidePageOffer } from '@/components/sales/guide-page-offer';
import { OfferExitPopup } from '@/components/sales/offer-exit-popup';
import { INCOME_PORTAL_ROUTES } from '@/lib/income-portal';
import { env } from '@/env';
import { absoluteSiteUrl } from '@/lib/site';
import { parseGuidePageCtaVariant } from '@/lib/offer-experiment';

export const metadata: Metadata = {
  title: 'Guia Essencial Renda Extra 2027 | Portal NKL',
  description: 'O Guia Essencial Renda Extra 2027 do Portal NKL para filtrar oportunidades e começar com mais clareza.',
  alternates: {
    canonical: absoluteSiteUrl(INCOME_PORTAL_ROUTES.guide),
  },
};

type IncomeGuidePageProps = {
  searchParams?: Promise<{ ad_variant?: string; cta_variant?: string }>;
};

export default async function IncomeGuidePage({ searchParams }: IncomeGuidePageProps) {
  const params = searchParams ? await searchParams : {};
  const ctaVariant = parseGuidePageCtaVariant(params.cta_variant);
  const adVariant = typeof params.ad_variant === 'string' && /^[0-9]+$/u.test(params.ad_variant)
    ? `native-card:${params.ad_variant}`
    : 'sales-page';
  const purchaseOfferVariant = ctaVariant ? `guide-page-cta:${ctaVariant}` : adVariant;
  const subscriptionOfferVariant = ctaVariant ? `guide-page-cta:${ctaVariant}` : 'sales-page:subscription';

  return (
    <div className="min-h-screen bg-income-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-8 md:grid-cols-2 md:items-start md:pt-14">
        <section className="md:pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange">Guia NKL · produto digital</p>
          <h1 className="mt-4 max-w-xl font-playfair text-5xl font-bold leading-[0.98] md:text-7xl">Guia Essencial Renda Extra 2027</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-foreground/75">Um pacote de novembro para estudar oportunidades de renda extra com mais clareza, sem promessa de renda ou resultado financeiro.</p>
          <div className="mt-8 rounded-2xl border border-orange/30 bg-income-surface p-5 shadow-sm">
            <div className="mx-auto flex aspect-[3/4] max-w-xs flex-col justify-between rounded-xl border border-orange/40 bg-[linear-gradient(145deg,#172554,#07152d)] p-6 text-white shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-orange px-3 py-1 text-xs font-black uppercase text-white">PDF</span>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-orange-200">Portal NKL</span>
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/60">Edição prática</p>
                <p className="mt-3 font-playfair text-4xl font-bold leading-tight">Pacote de novembro</p>
              </div>
              <div className="space-y-2 text-xs text-white/65">
                <p>5 materiais em um pacote</p>
                <p>Orientações práticas</p>
                <p>Links e escolhas mais claras</p>
              </div>
            </div>
          </div>
          <p className="mt-8 text-sm leading-relaxed text-foreground/75">
            A compra única entrega este pacote uma vez. A assinatura mensal mantém acesso ao pacote atual e inclui novos PDFs e guias a partir de 15 de dezembro.
          </p>
          <ul className="mt-5 space-y-3 text-sm font-medium">
            {[
              'Guia Essencial Renda Extra 2027',
              'O Código de Novembro',
              'Dinheiro Para Ontem',
              'Escudo de Black Friday',
              'Raio-X Financeiro (computador e mobile)',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
        <GuidePageOffer
          initialVariant={ctaVariant}
          purchaseOfferVariant={purchaseOfferVariant}
          subscriptionOfferVariant={subscriptionOfferVariant}
          hotmartCheckoutUrl={env.HOTMART_GUIDE_CHECKOUT_URL}
          subscriptionHotmartCheckoutUrl={env.HOTMART_SUBSCRIPTION_CHECKOUT_URL}
        />
      </div>
      <OfferExitPopup />
    </div>
  );
}
