'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { AiLearningPath, AiLearningProfile } from '@/lib/ai-learning-diagnostic';

const RESULT_STORAGE_KEY = 'nkl-ai-learning-diagnostic-result';

export default function AiResultPage() {
  const [result, setResult] = useState<{ profile: AiLearningProfile; path: AiLearningPath } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RESULT_STORAGE_KEY);
      if (raw) {
        window.setTimeout(() => {
          setResult(JSON.parse(raw) as { profile: AiLearningProfile; path: AiLearningPath });
        }, 0);
      }
    } catch (error) {
      console.error('[AI_RESULT] Falha ao ler diagnóstico local:', error instanceof Error ? error.message : 'erro desconhecido');
    } finally {
      window.setTimeout(() => setLoaded(true), 0);
    }
  }, []);

  if (!loaded) return <main className="mx-auto max-w-3xl px-4 py-20 text-center">Carregando seu resultado...</main>;
  if (!result) return <main className="mx-auto max-w-2xl px-4 py-20 text-center"><h1 className="font-playfair text-4xl font-bold">Faça o diagnóstico primeiro.</h1><Link href="/ia#diagnostico" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-neon px-5 py-3 font-bold text-black">Começar diagnóstico</Link></main>;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-10 md:pt-16">
      <Link href="/ia#diagnostico" className="text-sm font-bold text-neon hover:underline">← Refazer diagnóstico</Link>
      <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-neon">Seu primeiro caminho</p>
      <h1 className="mt-3 font-playfair text-5xl font-bold md:text-7xl">{result.path.title}</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed opacity-75">{result.path.summary}</p>
      <section className="mt-10 rounded-2xl border border-border bg-surface p-6 md:p-8">
        <h2 className="font-playfair text-3xl font-bold">Comece por estas 3 lições</h2>
        <ol className="mt-5 grid gap-3 md:grid-cols-3">
          {result.path.lessonSlugs.map((slug, index) => <li key={slug} className="rounded-xl border border-border p-4"><span className="text-sm font-bold text-neon">0{index + 1}</span><p className="mt-2 font-semibold">{slug.replaceAll('-', ' ')}</p></li>)}
        </ol>
      </section>
      <div className="mt-8 flex flex-wrap gap-3"><Link href="/ia/oferta" className="inline-flex min-h-11 items-center rounded-lg bg-neon px-5 py-3 font-bold text-black">Ver curso completo</Link><Link href="/ia" className="inline-flex min-h-11 items-center rounded-lg border border-border px-5 py-3 font-bold">Voltar para IA na Prática</Link></div>
      <p className="mt-8 text-sm leading-relaxed opacity-60">Este resultado é uma recomendação editorial baseada nas suas respostas. Ele não é diagnóstico profissional nem promessa de resultado.</p>
    </main>
  );
}
