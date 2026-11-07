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

const INCLUDED_ITEMS = [
  ['PDF direto ao ponto', 'Um mapa para comparar oportunidades sem perder horas em promessas genéricas.'],
  ['Templates de organização', 'Modelos simples para registrar cadastros, tarefas, prazos e resultados.'],
  ['Contatos e referências', 'Links úteis e critérios para conferir informações antes de tomar uma decisão.'],
];

const USE_CASES = [
  ['Filtrar melhor', 'Compare idioma, esforço, remuneração de referência e risco antes de abrir mais um cadastro.'],
  ['Organizar a rotina', 'Use templates para acompanhar tarefas, prazos, links e aprendizados sem depender da memória.'],
  ['Começar com contexto', 'Tenha um roteiro de pesquisa para validar as condições oficiais e evitar promessas fáceis.'],
];

export default function IncomeGuidePage() {
  return (
    <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-6 md:pb-24 md:pt-12">
      <section className="overflow-hidden rounded-[2rem] border border-orange/25 bg-[linear-gradient(135deg,rgba(249,115,22,0.12),rgba(11,94,215,0.12),rgba(255,255,255,0.02))] p-6 md:p-12">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange">Guia NKL · renda extra</p>
        <div className="mt-5 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <h1 className="max-w-3xl font-playfair text-4xl font-bold leading-tight md:text-7xl">Menos tentativa e erro. Mais clareza para começar.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/75">O Guia Definitivo de Renda Extra NKL ajuda você a economizar dezenas de horas filtrando lixo da internet e transformar pesquisa em próximos passos possíveis.</p>
          </div>
          <div className="rounded-2xl border border-border bg-background/70 p-6 backdrop-blur">
            <p className="text-sm font-bold uppercase tracking-wide text-foreground/60">Condição de lançamento</p>
            <p className="mt-2 text-4xl font-bold text-foreground line-through decoration-orange">R$ 97,00</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/65">Pagamento único de R$ 39,00 via Mercado Pago após a confirmação da condição promocional. A assinatura mensal de R$ 19,00 será oferecida em um fluxo separado.</p>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-5 md:grid-cols-3">
        {INCLUDED_ITEMS.map(([title, description]) => (
          <article key={title} className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon">Inclui</p>
            <h2 className="mt-3 font-playfair text-2xl font-bold">{title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground/70">{description}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 rounded-2xl border border-border bg-surface p-6 md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange">Dores resolvidas</p>
        <h2 className="mt-3 font-playfair text-3xl font-bold">Troque excesso de abas por um próximo passo claro.</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {USE_CASES.map(([title, description]) => (
            <article key={title} className="rounded-xl border border-border bg-background/50 p-5">
              <h3 className="font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-orange/25 bg-orange/5 p-6 md:p-8">
        <DiscountSimulator />
      </section>

      <section className="mt-10 rounded-2xl border border-border bg-surface p-6 md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange">Experiências esperadas</p>
        <h2 className="mt-3 font-playfair text-3xl font-bold">Um material para testar, revisar e adaptar.</h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/75">O resultado depende do seu tempo, região, habilidades e das regras de cada plataforma. Por isso, esta página não usa depoimentos inventados: apresenta cenários de uso e critérios verificáveis para você avaliar se o material serve ao seu momento.</p>
        <div className="mt-6 rounded-xl border border-border bg-background/50 p-5">
          <p className="font-bold">Garantia de clareza</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/70">Você verá o que está incluído, o status real do checkout e os limites da proposta antes de qualquer pagamento.</p>
        </div>
      </section>
    </div>
  );
}
