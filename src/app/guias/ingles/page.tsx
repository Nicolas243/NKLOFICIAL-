import type { Metadata } from 'next';
import { AffiliateDisclaimer } from '@/components/affiliate-disclaimer';
import { LanguageAiAndPlanner } from '@/components/sales/language-ai-and-planner';
import { LanguageDecoyOffer } from '@/components/sales/language-decoy-offer';
import { absoluteSiteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Inglês para ganhar dinheiro — E-book',
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
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange">E-book NKL · leitura no celular</p>
        <h1 className="mt-4 font-playfair text-5xl font-bold leading-[1.02] md:text-7xl">Inglês para ganhar dinheiro</h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-foreground/75">Um guia para entender como o inglês pode aumentar suas opções — mesmo se você está começando agora, tem pouco tempo ou não pode investir em curso.</p>
        <div className="mt-7 rounded-2xl border border-border bg-income-surface p-5">
          <p className="font-bold">Você vai encontrar:</p>
          <ul className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {chapters.map((chapter) => <li key={chapter} className="flex gap-3"><span className="text-orange">✓</span><span>{chapter}</span></li>)}
          </ul>
        </div>
        <p className="mt-6 text-sm leading-relaxed text-foreground/65">O material ensina possibilidades, não garante renda ou contratação. Após a confirmação do pagamento, você recebe o e-book digital personalizado com seus dados de compra como marca d’água de proteção.</p>
      </section>

      <LanguageDecoyOffer
        language="Inglês"
        slug="ingles"
        offerVariant="english-ebook-sales-page"
        previewHref="/guias/ingles/ebook"
        previewLabel="Ler amostra gratuita (5 lições)"
      />

      <LanguageAiAndPlanner language="Inglês" slug="ingles" />
      <div className="mt-10"><AffiliateDisclaimer /></div>
    </main>
  );
}
