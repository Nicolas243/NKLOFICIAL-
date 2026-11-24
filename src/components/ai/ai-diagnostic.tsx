'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AI_DIAGNOSTIC_QUESTIONS } from '@/config/ai-learning-questions';
import { calculateAiLearningProfile, recommendAiLearningPath, type AiDiagnosticAnswerMap } from '@/lib/ai-learning-diagnostic';

const RESULT_STORAGE_KEY = 'nkl-ai-learning-diagnostic-result';

export function AiDiagnostic() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AiDiagnosticAnswerMap>({});
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const question = AI_DIAGNOSTIC_QUESTIONS[index];
  const progress = Math.round(((index + 1) / AI_DIAGNOSTIC_QUESTIONS.length) * 100);

  const profile = useMemo(() => calculateAiLearningProfile(answers), [answers]);

  function choose(value: number): void {
    const nextAnswers = { ...answers, [question.id]: value };
    setAnswers(nextAnswers);
    setError(null);
    if (index < AI_DIAGNOSTIC_QUESTIONS.length - 1) {
      setIndex((current) => current + 1);
      return;
    }
    try {
      const path = recommendAiLearningPath(calculateAiLearningProfile(nextAnswers));
      window.localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify({ profile: calculateAiLearningProfile(nextAnswers), path }));
      router.push('/ia/resultado');
    } catch (caught) {
      console.error('[AI_DIAGNOSTIC] Falha ao salvar resultado:', caught instanceof Error ? caught.message : 'erro desconhecido');
      setError('Não foi possível salvar seu resultado local. Tente novamente.');
    }
  }

  return (
    <section className="rounded-3xl border border-neon/25 bg-surface p-5 shadow-sm md:p-8" aria-labelledby="ai-diagnostic-title">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon">Roteiro inicial gratuito</p>
        <span className="text-sm font-semibold opacity-70">{progress}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-border" aria-hidden="true">
        <div className="h-full rounded-full bg-neon transition-all" style={{ width: `${progress}%` }} />
      </div>
      <h2 id="ai-diagnostic-title" className="mt-7 font-playfair text-3xl font-bold md:text-4xl">{question.prompt}</h2>
      <div className="mt-6 grid gap-3">
        {question.options.map((option) => (
          <button
            key={option.label}
            type="button"
            className="min-h-12 rounded-xl border border-border px-4 py-3 text-left font-semibold transition hover:border-neon hover:bg-neon/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neon"
            onClick={() => choose(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {error ? <p className="mt-4 text-sm font-semibold text-red-600" role="alert">{error}</p> : null}
      <div className="mt-6 flex items-center justify-between gap-3 text-sm opacity-70">
        <button type="button" className="underline disabled:opacity-40" disabled={index === 0} onClick={() => setIndex((current) => Math.max(0, current - 1))}>Voltar</button>
        <span>{Object.keys(answers).length} respostas salvas neste dispositivo</span>
      </div>
      <Link href="/ia/oferta" className="mt-6 inline-block text-sm font-bold text-neon hover:underline">Ver o curso completo</Link>
      <span className="sr-only">Perfil parcial: {profile.goal + profile.level + profile.time + profile.confidence}</span>
    </section>
  );
}
