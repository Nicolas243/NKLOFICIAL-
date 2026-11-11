import type { Metadata } from 'next';
import { DiscountSimulator } from '@/components/sales/discount-simulator';
import { GuideSubscriptionButton } from '@/components/sales/guide-subscription-button';
import { OfferExitPopup } from '@/components/sales/offer-exit-popup';
import { INCOME_PORTAL_ROUTES } from '@/lib/income-portal';
import { env } from '@/env';
import { absoluteSiteUrl } from '@/lib/site';
import { parseProgramSecondaryCtaVariant } from '@/lib/offer-experiment';

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
  const ctaVariant = parseProgramSecondaryCtaVariant(params.cta_variant);
  const secondaryOfferVariant = ctaVariant ? `program-secondary-cta:${ctaVariant}` : null;
  const adVariant = typeof params.ad_variant === 'string' && /^[0-9]+$/u.test(params.ad_variant)
    ? `native-card:${params.ad_variant}`
    : 'sales-page';
  const purchaseOfferVariant = secondaryOfferVariant ?? adVariant;
  const subscriptionOfferVariant = secondaryOfferVariant ?? 'sales-page:subscription';

  return (
    <div className="min-h-screen bg-income-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-8 md:grid-cols-2 md:items-start md:pt-14">
        <section className="md:pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange">Guia NKL · produto digital</p>
          <h1 className="mt-4 max-w-xl font-playfair text-5xl font-bold leading-[0.98] md:text-7xl">Guia Essencial Renda Extra 2027</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-foreground/75">Encontre oportunidades de renda extra com mais facilidade. Receba um novo PDF toda semana com ideias, passos simples, links diretos e informações para você escolher por onde começar.</p>
          <div className="mt-8 rounded-2xl border border-orange/30 bg-income-surface p-5 shadow-sm">
            <div className="mx-auto flex aspect-[3/4] max-w-xs flex-col justify-between rounded-xl border border-orange/40 bg-[linear-gradient(145deg,#172554,#07152d)] p-6 text-white shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-orange px-3 py-1 text-xs font-black uppercase text-white">PDF</span>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-orange-200">Portal NKL</span>
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/60">Edição prática</p>
                <p className="mt-3 font-playfair text-4xl font-bold leading-tight">Renda extra mais simples</p>
              </div>
              <div className="space-y-2 text-xs text-white/65">
                <p>Ideias de renda extra</p>
                <p>Passo a passo simples</p>
                <p>Links diretos para começar</p>
              </div>
            </div>
          </div>
          <ul className="mt-8 space-y-3 text-sm font-medium">
            {['Um PDF novo toda semana', 'Ideias de renda extra', 'Passo a passo simples', 'Links diretos para começar'].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
        <aside className="md:sticky md:top-20">
          <DiscountSimulator offerVariant={purchaseOfferVariant} hotmartCheckoutUrl={env.HOTMART_GUIDE_CHECKOUT_URL} />
          <div className="mt-5 rounded-2xl border border-border bg-income-surface p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500 dark:text-orange-400">Alternativa mensal</p>
            <h2 className="mt-2 font-playfair text-2xl font-bold">Guias para Liberdade Financeira</h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">Acesso mensal a novos PDFs com ideias de renda extra, passos simples e links diretos para começar.</p>
            <p className="mt-4 font-playfair text-3xl font-bold text-orange-500">R$ 19/mês</p>
            <div className="mt-4">
              <GuideSubscriptionButton
                offerVariant={subscriptionOfferVariant}
                hotmartCheckoutUrl={env.HOTMART_SUBSCRIPTION_CHECKOUT_URL}
              />
            </div>
          </div>
          <p className="mt-4 text-center text-xs leading-relaxed text-foreground/55">Escolha Mercado Pago ou Hotmart. O acesso é liberado após a confirmação.</p>
        </aside>
      </div>
      <OfferExitPopup />
    </div>
  );
}
