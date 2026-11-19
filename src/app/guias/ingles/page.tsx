import type { Metadata } from 'next';
import Link from 'next/link';
import { AffiliateDisclaimer } from '@/components/affiliate-disclaimer';
import { GuideCheckoutButton } from '@/components/sales/guide-checkout-button';
import { absoluteSiteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Inglês para ganhar dinheiro | E-book Portal NKL',
  description: 'Conheça o e-book prático para estudar inglês no celular e transformar o aprendizado em mais possibilidades profissionais.',
  alternates: { canonical: absoluteSiteUrl('/guias/ingles') },
};

const chapters = [
  'Como começar mesmo achando que você não sabe nada',
  'Plano de 90 dias para celular, PC e rotina corrida',
  'Inglês simples para conversar, escrever e entender tarefas',
  'Como criar um portfólio sem inventar experiência',
  'Caminhos para procurar oportunidades com mais segurança',
  'Golpes, promessas exageradas e cuidados com seus dados',
];

export default function EnglishGuideSalesPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 md:pt-14">
      <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-start">
        <section>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange">E-book NKL · leitura no celular</p>
          <h1 className="mt-4 font-playfair text-5xl font-bold leading-[1.02] md:text-7xl">Inglês para ganhar dinheiro</h1>
          <p className="mt-6 text-lg leading-relaxed text-foreground/75">Um guia para entender como o inglês pode aumentar suas opções — mesmo se você está começando agora, tem pouco tempo ou não pode investir em curso.</p>
          <div className="mt-7 rounded-2xl border border-border bg-income-surface p-5">
            <p className="font-bold">Você vai encontrar:</p>
            <ul className="mt-4 space-y-3 text-sm">
              {chapters.map((chapter) => <li key={chapter} className="flex gap-3"><span className="text-orange">✓</span><span>{chapter}</span></li>)}
            </ul>
          </div>
          <p className="mt-6 text-sm leading-relaxed text-foreground/65">O material ensina possibilidades, não garante renda ou contratação. Após a confirmação do pagamento, você recebe o e-book digital personalizado com seus dados de compra como marca d’água de proteção.</p>
        </section>
        <aside id="checkout" className="rounded-2xl border border-orange/30 bg-income-surface p-6 shadow-[var(--card-shadow)] md:sticky md:top-24 md:p-8">
          <p className="text-sm font-bold text-orange">Oferta de lançamento</p>
          <p className="mt-3 font-playfair text-5xl font-bold">R$ 47</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/70">Pagamento único · 100 lições e 500 exemplos coloridos · PDF A5 personalizado por CPF</p>
          <GuideCheckoutButton label="Comprar e receber o e-book" offerVariant="english-ebook-sales-page" />
          <Link href="/guias/ingles/ebook" className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border px-5 py-3 text-sm font-bold hover:border-orange hover:text-orange">Ler amostra gratuita (5 lições)</Link>
          <p className="mt-3 text-center text-xs leading-relaxed text-foreground/55">Pagamento único de R$ 47 pelo Stripe. O acesso é liberado após a confirmação.</p>
        </aside>
      </div>
      <div className="mt-10"><AffiliateDisclaimer /></div>
    </main>
  );
}
