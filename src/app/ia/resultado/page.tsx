'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  resolveAiLearningPathDetails,
  type AiLearningPath,
  type AiLearningProfile,
} from '@/lib/ai-learning-diagnostic';

const RESULT_STORAGE_KEY = 'nkl-ai-learning-diagnostic-result';

export default function AiResultPage() {
  const [result, setResult] = useState<{ profile: AiLearningProfile; path: AiLearningPath } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RESULT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { profile: AiLearningProfile; path: AiLearningPath };
        const hydratedPath = resolveAiLearningPathDetails(parsed.path, parsed.profile);
        window.setTimeout(() => {
          setResult({ profile: parsed.profile, path: hydratedPath });
        }, 0);
      }
    } catch (error) {
      console.error('[AI_RESULT] Falha ao ler roteiro local:', error instanceof Error ? error.message : 'erro desconhecido');
    } finally {
      window.setTimeout(() => setLoaded(true), 0);
    }
  }, []);

  if (!loaded) {
    return <main className="mx-auto max-w-3xl px-4 py-20 text-center">Carregando seu resultado...</main>;
  }

  if (!result) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-playfair text-4xl font-bold">Monte seu roteiro inicial primeiro.</h1>
        <Link href="/ia#diagnostico" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-neon px-5 py-3 font-bold text-black">
          Montar roteiro inicial
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-10 md:pt-16">
      <Link href="/ia#diagnostico" className="text-sm font-bold text-neon hover:underline">← Refazer roteiro inicial</Link>
      <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-neon">Seu primeiro caminho</p>
      <h1 className="mt-3 font-playfair text-5xl font-bold md:text-7xl">{result.path.title}</h1>
      <p className="mt-5 max-w-3xl text-lg leading-relaxed opacity-80">{result.path.summary}</p>
      <p className="mt-4 max-w-2xl rounded-xl border border-neon/25 bg-neon/5 p-4 text-sm font-semibold text-neon">
        {result.path.pacingAdvice}
      </p>

      <section className="mt-10 rounded-2xl border border-border bg-surface p-6 md:p-8" aria-labelledby="recommended-lessons-heading">
        <h2 id="recommended-lessons-heading" className="font-playfair text-3xl font-bold">Comece por estas 3 lições</h2>
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          {result.path.recommendedLessons.map((lesson, index) => (
            <li key={lesson.lessonId} className="flex flex-col justify-between rounded-xl border border-border bg-background/50 p-5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-neon">0{index + 1}</span>
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-60">{lesson.moduleTitle}</span>
                </div>
                <h3 className="mt-3 text-lg font-bold leading-snug">{lesson.lessonTitle}</h3>
                <p className="mt-2 text-sm leading-relaxed opacity-75">{lesson.objective}</p>
              </div>
              <Link
                href={lesson.href}
                className="mt-5 inline-flex items-center text-sm font-bold text-neon hover:underline"
              >
                Abrir módulo {lesson.moduleTitle} →
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 rounded-2xl border border-border bg-surface p-6 md:p-8" aria-labelledby="recommended-prompts-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="recommended-prompts-heading" className="font-playfair text-3xl font-bold">5 prompts recomendados para o seu perfil</h2>
            <p className="mt-2 text-sm opacity-75">Modelos selecionados para você praticar imediatamente com segurança e critério.</p>
          </div>
          <Link href="/ia/prompts" className="text-sm font-bold text-neon hover:underline">
            Abrir biblioteca de prompts →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {result.path.recommendedPrompts.map((prompt) => (
            <article key={prompt.id} className="rounded-xl border border-border bg-background/50 p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neon">{prompt.category}</span>
                <span className="text-xs font-semibold opacity-60">{prompt.level}</span>
              </div>
              <h3 className="mt-2 text-lg font-bold">{prompt.title}</h3>
              <p className="mt-3 line-clamp-3 rounded-lg border border-border bg-surface/80 p-3 font-mono text-xs leading-relaxed opacity-85">
                {prompt.template}
              </p>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/ia/oferta" className="inline-flex min-h-11 items-center rounded-lg bg-neon px-5 py-3 font-bold text-black">
          Ver curso completo
        </Link>
        <Link href="/ia/prompts" className="inline-flex min-h-11 items-center rounded-lg border border-border px-5 py-3 font-bold hover:border-neon">
          Explorar prompts
        </Link>
        <Link href="/ia" className="inline-flex min-h-11 items-center rounded-lg border border-border px-5 py-3 font-bold">
          Voltar para IA na Prática
        </Link>
      </div>
      <p className="mt-8 text-sm leading-relaxed opacity-60">
        Este resultado é uma recomendação informativa baseada nas suas respostas. Ele não substitui orientação profissional nem promete resultado.
      </p>
    </main>
  );
}
