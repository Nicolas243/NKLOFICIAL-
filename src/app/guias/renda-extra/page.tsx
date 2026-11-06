import type { Metadata } from 'next';
import { GuideCheckoutButton } from '@/components/blog/guide-checkout-button';

export const metadata: Metadata = {
  title: 'Guia Definitivo de Renda Extra',
  description: 'Um guia prático do Portal NKL para filtrar oportunidades e começar com mais clareza.',
};

const INCLUDED_ITEMS = [
  ['PDF direto ao ponto', 'Um mapa para comparar oportunidades sem perder horas em promessas genéricas.'],
  ['Templates de organização', 'Modelos simples para registrar cadastros, tarefas, prazos e resultados.'],
  ['Contatos e referências', 'Links úteis e critérios para conferir informações antes de tomar uma decisão.'],
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
            <p className="text-sm font-bold uppercase tracking-wide text-foreground/60">Preço alvo</p>
            <p className="mt-2 text-5xl font-bold text-orange">R$ 39,00</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/65">Checkout em preparação. Nenhuma cobrança é feita nesta versão.</p>
            <div className="mt-5">
              <GuideCheckoutButton />
            </div>
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
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange">Como usar</p>
        <h2 className="mt-3 font-playfair text-3xl font-bold">Uma rota de decisão, não uma promessa de dinheiro fácil.</h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/75">Você vai comparar esforço, idioma, dispositivo, remuneração e riscos com uma rotina simples. As plataformas mudam, então o guia ensina também como verificar as condições oficiais antes de se cadastrar.</p>
      </section>
    </div>
  );
}
