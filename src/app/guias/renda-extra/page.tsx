import type { Metadata } from 'next';
import { GuidePackagePreview } from '@/components/sales/guide-package-preview';
import { GuidePageOffer } from '@/components/sales/guide-page-offer';
import { OfferExitPopup } from '@/components/sales/offer-exit-popup';
import { INCOME_PORTAL_ROUTES } from '@/lib/income-portal';
import { absoluteSiteUrl } from '@/lib/site';
import { parseGuidePageCtaVariant } from '@/lib/offer-experiment';
import { parseGuideResumeIntent } from '@/lib/auth/return-intent';

export const metadata: Metadata = {
  title: 'Guia Essencial Renda Extra 2027',
  description: 'O Guia Essencial Renda Extra 2027 do Portal NKL para filtrar oportunidades e começar com mais clareza.',
  alternates: {
    canonical: absoluteSiteUrl(INCOME_PORTAL_ROUTES.guide),
  },
};

type IncomeGuidePageProps = {
  searchParams?: Promise<{ ad_variant?: string; cta_variant?: string; resume?: string }>;
};

export default async function IncomeGuidePage({ searchParams }: IncomeGuidePageProps) {
  const params = searchParams ? await searchParams : {};
  const ctaVariant = parseGuidePageCtaVariant(params.cta_variant);
  const forceFallback = typeof params.cta_variant === 'string' && ctaVariant === null;
  const resumeIntent = parseGuideResumeIntent(params.resume ?? null);
  const adVariant = typeof params.ad_variant === 'string' && /^[0-9]+$/u.test(params.ad_variant)
    ? `native-card:${params.ad_variant}`
    : 'sales-page';
  const purchaseOfferVariant = ctaVariant ? `guide-page-cta:${ctaVariant}` : adVariant;
  const subscriptionOfferVariant = ctaVariant ? `guide-page-cta:${ctaVariant}` : 'sales-page:subscription';

  return (
    <div className="min-h-screen bg-income-background">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-16 pt-6 md:grid-cols-2 md:items-start md:gap-10 md:pt-14">
        <GuidePageOffer
          id="guide-offer"
          initialVariant={ctaVariant}
          purchaseOfferVariant={purchaseOfferVariant}
          subscriptionOfferVariant={subscriptionOfferVariant}
          resumeIntent={resumeIntent}
          forceFallback={forceFallback}
        />
        <section className="order-last md:order-none md:pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange">Guia NKL · produto digital</p>
          <h1 className="mt-4 max-w-xl font-playfair text-5xl font-bold leading-[0.98] md:text-7xl">Pare de abrir oportunidade no escuro.</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-foreground/75">Você recebe cinco arquivos práticos para comparar opções, entender os critérios e escolher um próximo passo realista.</p>
          <div className="mt-8 rounded-2xl border border-orange/30 bg-income-surface p-5 shadow-sm">
            <GuidePackagePreview />
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
      </div>
      <OfferExitPopup />
    </div>
  );
}
