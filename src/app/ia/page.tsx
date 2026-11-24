import type { Metadata } from 'next';
import Link from 'next/link';
import { AiDiagnostic } from '@/components/ai/ai-diagnostic';
import { AiPromptLab } from '@/components/ai/ai-prompt-lab';
import { getAiCourseModules } from '@/lib/ai-course';
import { absoluteSiteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'IA na Prática | Aprenda a usar inteligência artificial',
  description: 'Um caminho prático para aprender prompting, pesquisa, conteúdo, produtividade, programação e segurança com IA.',
  alternates: { canonical: absoluteSiteUrl('/ia') },
};

export default function AiLandingPage() {
  const modules = getAiCourseModules();
  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:pt-14">
      <header className="grid gap-8 rounded-[2rem] border border-neon/25 bg-income-surface p-6 md:grid-cols-[1.1fr_0.9fr] md:p-12">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-neon">IA na Prática NKL</p>
          <h1 className="mt-4 max-w-3xl font-playfair text-5xl font-bold leading-[0.98] md:text-7xl">Pare de só perguntar. Aprenda a usar IA.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed opacity-80">Um caminho prático para estudar, trabalhar, criar, vender e programar com mais clareza — sem confiar cegamente em respostas automáticas.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#diagnostico" className="inline-flex min-h-11 items-center rounded-lg bg-neon px-5 py-3 font-bold text-black">Montar roteiro inicial grátis</a>
            <Link href="/ia/oferta" className="inline-flex min-h-11 items-center rounded-lg border border-border px-5 py-3 font-bold">Conhecer o curso</Link>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface/80 p-5 md:p-7">
          <p className="text-sm font-bold opacity-60">Você vai praticar</p>
          <ul className="mt-4 space-y-3 text-sm font-semibold">
            {['Escrever prompts claros', 'Verificar respostas e fontes', 'Criar textos, imagens e briefs', 'Organizar tarefas e decisões', 'Usar agentes com limites'].map((item) => <li key={item} className="flex gap-3"><span className="text-neon">✓</span>{item}</li>)}
          </ul>
          <p className="mt-6 text-xs leading-relaxed opacity-60">Orientação educacional. Nenhuma aula promete renda, emprego ou resultado garantido.</p>
        </div>
      </header>

      <div className="mt-12">
        <AiPromptLab />
      </div>

      <section id="diagnostico" className="mt-10 grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-start">
        <div className="md:sticky md:top-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Comece pelo seu objetivo</p>
          <h2 className="mt-3 font-playfair text-4xl font-bold">Descubra por onde começar.</h2>
          <p className="mt-4 leading-relaxed opacity-75">Responda oito perguntas. O resultado fica salvo apenas neste dispositivo e recomenda um primeiro caminho de estudo.</p>
        </div>
        <AiDiagnostic />
      </section>

      <section className="mt-16" aria-labelledby="ai-modules-title">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">O caminho completo</p>
        <h2 id="ai-modules-title" className="mt-3 font-playfair text-4xl font-bold md:text-5xl">Do primeiro prompt ao processo confiável.</h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module, index) => (
            <article key={module.slug} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-neon">0{index + 1}</span>
                <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold text-foreground/70">
                  {module.unlockAfterDays === 0 ? 'Dia 1' : `Semana ${Math.ceil(module.unlockAfterDays / 7) + 1}`}
                </span>
              </div>
              <h3 className="mt-3 text-xl font-bold">{module.title}</h3>
              <p className="mt-2 text-sm leading-relaxed opacity-70">{module.summary}</p>
              <p className="mt-3 text-[11px] font-semibold text-orange/90">{module.notebookLmFormat}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
