import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAiLearningAccess } from '@/actions/ai-learning';
import { getAiCourseModules } from '@/lib/ai-course';

export const metadata = { title: 'Curso de IA | Portal NKL' };

export default async function AiCoursePage() {
  const access = await getAiLearningAccess();
  if (!access.hasAccess) redirect('/ia/oferta');

  const modules = getAiCourseModules();
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-neon">IA na Prática</p>
          <h1 className="mt-2 font-playfair text-4xl font-bold">Seu curso, passo a passo</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed opacity-75">
            Aprenda com exemplos aplicáveis e avance no seu ritmo. Seu progresso fica salvo na conta.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-neon" href="/ia/progresso">
            Ver progresso: {access.progress.percentage}%
          </Link>
          <Link className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-neon" href="/ia/prompts">
            Biblioteca de prompts
          </Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {modules.map((module, index) => {
          const completed = module.lessons.filter((lesson) => access.completedLessonIds.includes(lesson.id)).length;
          return (
            <Link
              key={module.slug}
              href={`/ia/curso/${module.slug}`}
              className="rounded-2xl border border-border bg-surface/70 p-5 transition hover:-translate-y-0.5 hover:border-neon"
            >
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-neon">Módulo {index + 1}</p>
              <h2 className="mt-2 text-xl font-bold">{module.title}</h2>
              <p className="mt-2 text-sm opacity-75">{module.summary}</p>
              <p className="mt-4 text-xs font-semibold opacity-60">{completed}/{module.lessons.length} lições concluídas</p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
