import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type Lesson = {
  id: string;
  professor: string;
  startsAt: Date;
  roomUrl: string;
};

type LessonCardProps = {
  lesson: Lesson;
  currentTime: number;
};

function formatLessonDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}

function LessonCard({ lesson, currentTime }: LessonCardProps) {
  const isRoomOpen =
    currentTime >= lesson.startsAt.getTime() - 5 * 60 * 1000 &&
    currentTime <= lesson.startsAt.getTime() + 60 * 60 * 1000;

  return (
    <article className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Próxima aula</p>
      <h2 className="mt-3 font-playfair text-2xl font-bold">{lesson.professor}</h2>
      <p className="mt-2 text-sm opacity-70">{formatLessonDate(lesson.startsAt)}</p>
      <div className="mt-6">
        {isRoomOpen ? (
          <Link
            href={lesson.roomUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full justify-center rounded-md bg-neon px-4 py-3 font-bold text-black transition-opacity hover:opacity-90"
          >
            Entrar na Sala
          </Link>
        ) : (
          <span className="block rounded-md border border-border px-4 py-3 text-center text-sm font-semibold opacity-60">
            A sala será liberada 5 minutos antes
          </span>
        )}
      </div>
    </article>
  );
}

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Server render captures one consistent instant for all lesson cards.
  // eslint-disable-next-line react-hooks/purity
  const currentTime = Date.now();
  const lessons: Lesson[] = [
    {
      id: 'demo-lesson',
      professor: 'Professor de demonstração',
      startsAt: new Date(currentTime + 10 * 60 * 1000),
      roomUrl: 'https://meet.jit.si/nkl-aula-demo',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Área do aluno</p>
        <h1 className="mt-3 font-playfair text-4xl font-bold sm:text-5xl">Minhas próximas aulas</h1>
        <p className="mt-4 text-base opacity-70">
          Acompanhe seus horários e entre na sala quando a aula estiver liberada.
        </p>
      </div>

      {lessons.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} currentTime={currentTime} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <h2 className="font-playfair text-2xl font-bold">Nenhuma aula agendada</h2>
          <p className="mt-2 text-sm opacity-70">
            Escolha um professor para encontrar um horário disponível.
          </p>
          <Link href="/professores" className="mt-6 inline-flex rounded-md border border-neon px-5 py-3 font-bold text-neon">
            Encontrar um professor
          </Link>
        </div>
      )}
    </div>
  );
}
