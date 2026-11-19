import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getAiLearningAccess } from '@/actions/ai-learning';
import { getAiCourseModules } from '@/lib/ai-course';
import { AiLessonCompletion } from '@/components/ai/ai-lesson-completion';

export const metadata = { title: 'Lição | IA na Prática NKL' };

export default async function AiModulePage({ params }: { params: Promise<{ moduleSlug: string }> }) {
  const { moduleSlug } = await params;
  const access = await getAiLearningAccess();
  if (!access.hasAccess) redirect('/ia/oferta');

  const courseModule = getAiCourseModules().find((item) => item.slug === moduleSlug);
  if (!courseModule) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/ia/curso" className="text-sm font-semibold text-neon hover:underline">← Voltar ao curso</Link>
      <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-neon">Módulo</p>
      <h1 className="mt-2 font-playfair text-4xl font-bold">{courseModule.title}</h1>
      <p className="mt-3 text-sm leading-relaxed opacity-75">{courseModule.summary}</p>
      <div className="mt-8 space-y-6">
        {courseModule.lessons.map((lesson) => (
          <article key={lesson.id} className="rounded-2xl border border-border bg-surface/70 p-5 sm:p-7">
            <h2 className="text-2xl font-bold">{lesson.title}</h2>
            <p className="mt-2 text-sm font-semibold text-neon">{lesson.objective}</p>
            <p className="mt-5 leading-relaxed opacity-85">{lesson.explanation}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-red-300">Evite</p>
                <p className="mt-2 text-sm">{lesson.exampleBad}</p>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-300">Melhor</p>
                <p className="mt-2 text-sm">{lesson.exampleBetter}</p>
              </div>
            </div>
            <p className="mt-5 text-sm"><strong>Exercício:</strong> {lesson.exercise}</p>
            <ul className="mt-4 space-y-2 text-sm opacity-80">
              {lesson.checklist.map((item) => <li key={item}>□ {item}</li>)}
            </ul>
            <AiLessonCompletion lessonId={lesson.id} completed={access.completedLessonIds.includes(lesson.id)} />
          </article>
        ))}
      </div>
    </main>
  );
}
