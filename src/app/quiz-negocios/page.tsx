import type { Metadata } from 'next';
import Link from 'next/link';
import { BusinessMatchmaker } from '@/components/quiz/business-matchmaker';
import { requireProductAccess } from '@/lib/entitlements';
import { absoluteSiteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Bússola de Negócios',
  description:
    'Descubra quais caminhos de negócio combinam com seu tempo, capital, tecnologia e tolerância a risco.',
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
          Bússola de Negócios
        </p>
        <h1 className="mt-3 font-playfair text-4xl font-bold leading-tight md:text-6xl">
          Encontre um caminho compatível com sua realidade.
        </h1>
        <p className="mt-5 text-base leading-relaxed opacity-75 md:text-lg">
          Responda 50 perguntas rápidas sobre capital, tempo, tecnologia, risco e interação. Não é promessa de renda: é um ponto de partida mais organizado.
        </p>
      </header>
      <BusinessMatchmaker />
    </div>
  );
}
