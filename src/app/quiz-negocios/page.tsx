import type { Metadata } from 'next';
import Link from 'next/link';
import { BusinessMatchmaker } from '@/components/quiz/business-matchmaker';
import { requireProductAccess } from '@/lib/entitlements';
import { absoluteSiteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Bússola de Negócios IA',
  description:
    'Descubra quais caminhos de negócio combinam com seu tempo, capital, tecnologia e tolerância a risco com diagnóstico gerado por IA.',
  alternates: { canonical: absoluteSiteUrl('/quiz-negocios') },
};

export default async function BusinessQuizPage() {
  await requireProductAccess('bussola-negocios');

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 md:pt-12">
      <Link href="/minha-conta" className="text-sm font-bold text-neon hover:underline">
        ← Voltar para Minha Conta
      </Link>
      <header className="mx-auto mb-8 mt-6 max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">
          Bússola de Negócios IA
        </p>
        <h1 className="mt-3 font-playfair text-4xl font-bold leading-tight md:text-6xl">
          Descubra o negócio dos seus sonhos a partir de quem você realmente é.
        </h1>
        <p className="mt-5 text-base leading-relaxed opacity-75 md:text-lg">
          Responda 50 perguntas sobre criatividade, autonomia, relacionamento, tecnologia, tempo e investimento. Ao final, nossa inteligência analisa suas respostas e entrega seu diagnóstico personalizado com os 3 caminhos de maior aderência e um roteiro inicial de 7 dias — sem promessas irreais.
        </p>
      </header>
      <BusinessMatchmaker />
    </div>
  );
}
