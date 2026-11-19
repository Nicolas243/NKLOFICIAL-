import type { Metadata } from 'next';
import Link from 'next/link';
import { BusinessMatchmaker } from '@/components/quiz/business-matchmaker';
import { absoluteSiteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Quiz de perfil para renda extra',
  description: 'Descubra quais caminhos de negócio combinam com seu tempo, capital, tecnologia e tolerância a risco.',
  alternates: { canonical: absoluteSiteUrl('/quiz-negocios') },
};

export default function BusinessQuizPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 md:pt-12">
      <Link href="/programas" className="text-sm font-bold text-neon hover:underline">← Voltar ao catálogo</Link>
      <header className="mx-auto mb-8 mt-6 max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Engine de triagem de negócios</p>
        <h1 className="mt-3 font-playfair text-4xl font-bold leading-tight md:text-6xl">Encontre um caminho compatível com sua realidade.</h1>
        <p className="mt-5 text-base leading-relaxed opacity-75 md:text-lg">Responda 50 perguntas rápidas sobre capital, tempo, tecnologia, risco e interação. Não é promessa de renda: é um ponto de partida mais organizado.</p>
      </header>
      <BusinessMatchmaker />
    </div>
  );
}
