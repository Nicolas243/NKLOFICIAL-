'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CalculatedQuizProfile } from '@/db/schema';
import type { QuizResult } from '@/lib/quiz-result';

const RESULT_STORAGE_KEY = 'nkl-business-quiz-result';
const PROFILE_AXES: ReadonlyArray<keyof CalculatedQuizProfile> = ['capital', 'time', 'tech', 'risk', 'social'];

export default function QuizResultPage() {
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(RESULT_STORAGE_KEY);
        if (saved) setResult(JSON.parse(saved) as QuizResult);
      } catch (error) {
        console.error('[BUSINESS_QUIZ_RESULT] Não foi possível ler o resultado local:', error);
      } finally {
        setIsLoaded(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!isLoaded) return <div className="mx-auto max-w-3xl px-4 py-20 text-center">Carregando seu resultado...</div>;

  if (!result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-playfair text-4xl font-bold">Seu resultado ainda não está disponível.</h1>
        <p className="mt-4 opacity-75">Responda o quiz para gerar uma análise personalizada neste navegador.</p>
        <Link href="/quiz-negocios" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-neon px-5 py-3 font-bold text-black">Fazer o quiz</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 md:pt-14">
      <Link href="/quiz-negocios" className="text-sm font-bold text-neon hover:underline">← Refazer o diagnóstico</Link>
      <header className="mt-6 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Seu diagnóstico</p>
        <h1 className="mt-3 font-playfair text-4xl font-bold md:text-6xl">{result.archetype}</h1>
        <p className="mt-5 text-lg leading-relaxed opacity-80">{result.analysis}</p>
        <p className="mt-3 text-xs opacity-60">Diagnóstico salvo localmente neste navegador para consulta imediata.</p>
      </header>
      <section className="mt-8 grid gap-3 sm:grid-cols-5" aria-label="Pontuação por eixo">
        {PROFILE_AXES.map((axis) => {
          const score = Number(result.profile[axis] ?? 0);
          return (
            <div key={axis} className="rounded-xl border border-border bg-surface/80 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wide opacity-60">{axis}</p>
              <p className="mt-2 text-3xl font-bold text-neon">{score.toFixed(1)}</p>
              <p className="text-xs opacity-60">de 5</p>
            </div>
          );
        })}
      </section>
      <section className="mt-10" aria-labelledby="recommendations-title">
        <h2 id="recommendations-title" className="font-playfair text-3xl font-bold">3 caminhos para investigar</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {result.top3Businesses.map((business) => (
            <article key={business.name} className="rounded-2xl border border-border bg-surface/80 p-5">
              <h3 className="text-xl font-bold">{business.name}</h3>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed opacity-80">
                {business.actionPlan3Steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </article>
          ))}
        </div>
      </section>
      <p className="mt-10 rounded-xl border border-orange/30 bg-orange/5 p-4 text-sm leading-relaxed opacity-80">Este diagnóstico é editorial e não garante renda ou aprovação em nenhuma plataforma. Confirme regras, custos, disponibilidade e segurança diretamente com cada serviço.</p>
    </div>
  );
}
