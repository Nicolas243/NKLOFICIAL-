import type { Metadata } from 'next';
import { DiscountSimulator } from '@/components/sales/discount-simulator';
import { GuideSubscriptionButton } from '@/components/sales/guide-subscription-button';
import { OfferExitPopup } from '@/components/sales/offer-exit-popup';
import { INCOME_PORTAL_ROUTES } from '@/lib/income-portal';

export const metadata: Metadata = {
  title: 'Guia Definitivo de Renda Extra | Portal NKL',
  description: 'Um guia prático do Portal NKL para filtrar oportunidades e começar com mais clareza.',
  alternates: {
    canonical: INCOME_PORTAL_ROUTES.guide,
  },
};

type IncomeGuidePageProps = {
  searchParams?: Promise<{ ad_variant?: string }>;
};

export default async function IncomeGuidePage({ searchParams }: IncomeGuidePageProps) {
  const params = searchParams ? await searchParams : {};
  const adVariant = typeof params.ad_variant === 'string' && /^[0-9]+$/u.test(params.ad_variant)
    ? `native-card:${params.ad_variant}`
    : 'sales-page';

  return (
    <div className="min-h-screen bg-income-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-8 md:grid-cols-2 md:items-start md:pt-14">
        <section className="md:pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange">Guia NKL · produto digital</p>
          <h1 className="mt-4 max-w-xl font-playfair text-5xl font-bold leading-[0.98] md:text-7xl">O Mapa de Renda Extra NKL</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-foreground/75">Um material direto para sair da pesquisa infinita e decidir qual oportunidade faz sentido para o seu momento.</p>
          <div className="mt-8 rounded-2xl border border-orange/30 bg-income-surface p-5 shadow-sm">
            <div className="mx-auto flex aspect-[3/4] max-w-xs flex-col justify-between rounded-xl border border-orange/40 bg-[linear-gradient(145deg,#172554,#07152d)] p-6 text-white shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-orange px-3 py-1 text-xs font-black uppercase text-white">PDF</span>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-orange-200">Portal NKL</span>
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/60">Edição prática</p>
                <p className="mt-3 font-playfair text-4xl font-bold leading-tight">Renda Extra sem ruído.</p>
              </div>
              <div className="space-y-2 text-xs text-white/65">
                <p>Filtros de decisão</p>
                <p>Roteiros de aprovação</p>
                <p>Links e critérios verificáveis</p>
              </div>
            </div>
          </div>
          <ul className="mt-8 space-y-3 text-sm font-medium">
            {['Roteiros de aprovação', 'Links diretos e critérios claros', 'Evite plataformas que não combinam com seu perfil', 'Organize seus próximos passos em um único mapa'].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
        <aside className="md:sticky md:top-20">
          <DiscountSimulator offerVariant={adVariant} />
          <div className="mt-5 rounded-2xl border border-border bg-income-surface p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500 dark:text-orange-400">Alternativa mensal</p>
            <h2 className="mt-2 font-playfair text-2xl font-bold">Guias para Liberdade Financeira</h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">Acesso mensal aos guias editoriais para comparar oportunidades e organizar seus próximos passos.</p>
            <p className="mt-4 font-playfair text-3xl font-bold text-orange-500">R$ 19/mês</p>
            <div className="mt-4">
              <GuideSubscriptionButton offerVariant="sales-page:subscription" />
            </div>
          </div>
          <p className="mt-4 text-center text-xs leading-relaxed text-foreground/55">Pagamento processado pelo Mercado Pago. O acesso é liberado após a confirmação.</p>
        </aside>
      </div>
      <OfferExitPopup />
    </div>
  );
}
