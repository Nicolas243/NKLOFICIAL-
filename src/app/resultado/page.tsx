'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Compass, Sparkles, Target } from 'lucide-react';
import type { CalculatedQuizProfile } from '@/db/schema';
import type { QuizResult } from '@/lib/quiz-result';

const RESULT_STORAGE_KEY = 'nkl-business-quiz-result';
const PROFILE_AXES: ReadonlyArray<{
  key: keyof CalculatedQuizProfile;
  label: string;
  hint: string;
}> = [
  { key: 'capital', label: 'Capital', hint: 'Margem inicial' },
  { key: 'time', label: 'Tempo', hint: 'Ritmo semanal' },
  { key: 'tech', label: 'Tecnologia', hint: 'Autonomia digital' },
  { key: 'risk', label: 'Risco', hint: 'Tolerância inicial' },
  { key: 'social', label: 'Perfil Social', hint: 'Bastidores vs público' },
];

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

  if (!isLoaded) return <div className="mx-auto max-w-3xl px-4 py-20 text-center">Carregando seu diagnóstico...</div>;

  if (!result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-playfair text-4xl font-bold">Seu diagnóstico ainda não está disponível.</h1>
        <p className="mt-4 opacity-75">Responda à Bússola de Negócios IA para gerar uma análise personalizada neste navegador.</p>
        <Link href="/quiz-negocios" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-neon px-5 py-3 font-bold text-black">
          Fazer a Bússola de Negócios IA
        </Link>
      </div>
    );
  }

  const isAiGenerated = result.diagnosticSource === '9router' || result.diagnosticSource === 'openai';
  const strengths = result.strengths && result.strengths.length > 0 ? result.strengths : [];
  const watchouts = result.watchouts && result.watchouts.length > 0 ? result.watchouts : [];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 md:pt-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/quiz-negocios" className="text-sm font-bold text-neon hover:underline">
          ← Refazer a Bússola de Negócios IA
        </Link>
        <Link href="/app/bussola-negocios" className="text-xs font-semibold text-foreground/70 hover:text-neon hover:underline">
          Voltar para o App Bússola
        </Link>
      </div>

      <header className="mt-6 rounded-3xl border border-neon/35 bg-surface/90 p-6 shadow-sm sm:p-10">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-neon">
            <Sparkles size={13} aria-hidden="true" />
            <span>{isAiGenerated ? 'Diagnóstico Personalizado com IA' : 'Diagnóstico Estruturado · Bússola IA'}</span>
          </span>
          <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground/75">
            50 critérios analisados
          </span>
        </div>

        <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-foreground/60">
          {result.diagnosticTitle ?? 'Bússola de Negócios IA'}
        </p>
        <h1 className="mt-2 font-playfair text-4xl font-bold leading-tight md:text-6xl">
          {result.archetype}
        </h1>
        {result.diagnosticHeadline && (
          <p className="mt-3 text-lg font-semibold text-neon">{result.diagnosticHeadline}</p>
        )}
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/85 sm:text-lg">
          {result.analysis}
        </p>
        <p className="mt-3 text-xs text-foreground/55">
          Diagnóstico salvo localmente neste navegador para consulta imediata.
        </p>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-5" aria-label="Pontuação por eixo">
        {PROFILE_AXES.map((axis) => {
          const score = Number(result.profile[axis.key] ?? 0);
          const pct = Math.min(100, Math.max(0, (score / 5) * 100));
          return (
            <div key={axis.key} className="rounded-2xl border border-border bg-surface/85 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-foreground/70">{axis.label}</p>
              <p className="mt-1 text-[11px] text-foreground/55">{axis.hint}</p>
              <p className="mt-2 text-3xl font-bold text-neon">
                {score.toFixed(1)}
                <span className="ml-1 text-xs font-normal text-foreground/60">/5</span>
              </p>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-border" aria-hidden="true">
                <div className="h-full rounded-full bg-neon" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </section>

      {(strengths.length > 0 || watchouts.length > 0 || result.firstWeekFocus) && (
        <section className="mt-8 grid gap-5 md:grid-cols-2" aria-label="Leitura estratégica da IA">
          {strengths.length > 0 && (
            <article className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 sm:p-6">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 size={18} aria-hidden="true" />
                <h2 className="font-playfair text-xl font-bold">Pontos fortes do seu perfil</h2>
              </div>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-foreground/85">
                {strengths.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          )}

          <div className="space-y-5">
            {watchouts.length > 0 && (
              <article className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 sm:p-6">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <AlertTriangle size={18} aria-hidden="true" />
                  <h2 className="font-playfair text-xl font-bold">Cuidados antes de acelerar</h2>
                </div>
                <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-foreground/85">
                  {watchouts.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            )}

            {result.firstWeekFocus && (
              <article className="rounded-2xl border border-neon/35 bg-surface/90 p-5 sm:p-6">
                <div className="flex items-center gap-2 text-neon">
                  <Target size={18} aria-hidden="true" />
                  <h2 className="font-playfair text-xl font-bold text-foreground">Foco para os próximos 7 dias</h2>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-foreground/85">{result.firstWeekFocus}</p>
              </article>
            )}
          </div>
        </section>
      )}

      <section className="mt-10" aria-labelledby="recommendations-title">
        <div className="flex items-center gap-2">
          <Compass size={20} className="text-neon" aria-hidden="true" />
          <h2 id="recommendations-title" className="font-playfair text-3xl font-bold">
            3 negócios e planos recomendados para você
          </h2>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {result.top3Businesses.map((business, index) => (
            <article
              key={business.name}
              className={`flex flex-col rounded-2xl border p-5 ${
                index === 0
                  ? 'border-neon/60 bg-neon/5'
                  : 'border-border bg-surface/85'
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-neon">
                {index === 0 ? '1º Melhor encaixe' : `${index + 1}º Caminho compatível`}
              </span>
              <h3 className="mt-1.5 text-xl font-bold">{business.name}</h3>
              {business.whyItFits && (
                <p className="mt-2 text-xs leading-relaxed text-foreground/75">
                  {business.whyItFits}
                </p>
              )}
              <ol className="mt-4 list-decimal space-y-3 border-t border-border pt-4 pl-5 text-sm leading-relaxed text-foreground/85">
                {business.actionPlan3Steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <p className="mt-10 rounded-xl border border-orange/30 bg-orange/5 p-4 text-sm leading-relaxed opacity-80">
        Este diagnóstico é educativo e não garante renda ou aprovação em nenhuma plataforma. Confirme regras, custos, disponibilidade e segurança diretamente com cada serviço.
      </p>
    </div>
  );
}
