import type { Metadata } from 'next';
import { DiscountSimulator } from '@/components/sales/discount-simulator';
import { INCOME_PORTAL_ROUTES } from '@/lib/income-portal';

export const metadata: Metadata = {
  title: 'Guia Definitivo de Renda Extra | Portal NKL',
  description: 'Um guia prático do Portal NKL para filtrar oportunidades e começar com mais clareza.',
  alternates: {
    canonical: INCOME_PORTAL_ROUTES.guide,
  },
};

export default function IncomeGuidePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.14),transparent_35%)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-8 md:grid-cols-2 md:items-start md:pt-14">
        <section className="md:pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange">Guia NKL · produto digital</p>
          <h1 className="mt-4 max-w-xl font-playfair text-5xl font-bold leading-[0.98] md:text-7xl">O Mapa de Renda Extra NKL</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-foreground/75">Um material direto para sair da pesquisa infinita e decidir qual oportunidade faz sentido para o seu momento.</p>
          <div className="mt-8 rounded-2xl border border-orange/30 bg-surface p-5 shadow-sm">
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
          <DiscountSimulator />
          <p className="mt-4 text-center text-xs leading-relaxed text-foreground/55">Pagamento único de R$ 39,00 via Mercado Pago. O acesso é liberado após a confirmação.</p>
        </aside>
      </div>
    </div>
  );
}
