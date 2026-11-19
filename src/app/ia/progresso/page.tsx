import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAiLearningAccess } from '@/actions/ai-learning';
import { getAiCourseLessons } from '@/lib/ai-course';

export const metadata = { title: 'Meu progresso | IA na Prática NKL' };

export default async function AiProgressPage() {
  const access = await getAiLearningAccess();
  if (!access.hasAccess) redirect('/ia/oferta');
  const completed = new Set(access.completedLessonIds);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/ia/curso" className="text-sm font-semibold text-neon hover:underline">← Voltar ao curso</Link>
      <h1 className="mt-8 font-playfair text-4xl font-bold">Seu progresso</h1>
      <div className="mt-6 rounded-2xl border border-border bg-surface/70 p-6">
        <p className="text-4xl font-bold text-neon">{access.progress.percentage}%</p>
        <p className="mt-2 text-sm opacity-75">{access.progress.completed} de {access.progress.total} lições concluídas.</p>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-neon transition-all" style={{ width: `${access.progress.percentage}%` }} />
        </div>
      </div>
      <ul className="mt-6 space-y-2">
        {getAiCourseLessons().map((lesson) => (
          <li key={lesson.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm">
            <span>{lesson.title}</span>
            <span className={completed.has(lesson.id) ? 'text-emerald-300' : 'opacity-50'}>
              {completed.has(lesson.id) ? 'Concluída' : 'Pendente'}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
