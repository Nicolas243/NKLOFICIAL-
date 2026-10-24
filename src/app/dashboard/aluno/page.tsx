import Link from 'next/link';
import { redirect } from 'next/navigation';
import { and, eq, gte } from 'drizzle-orm';
import { db } from '@/db';
import { classBookings, users } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { BookingRoom } from '@/components/video/booking-room';

function isRoomOpen(scheduledAt: Date, now: number): boolean {
  return now >= scheduledAt.getTime() - 10 * 60 * 1000;
}

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect('/login');
  }

  const now = new Date();
  const bookings = await db
    .select({
      id: classBookings.id,
      scheduledAt: classBookings.scheduledAt,
      status: classBookings.status,
      meetingUrl: classBookings.meetingUrl,
      teacherName: users.name,
    })
    .from(classBookings)
    .innerJoin(users, eq(users.id, classBookings.teacherId))
    .where(and(eq(classBookings.studentId, user.id), gte(classBookings.scheduledAt, now)));
  // Capture one instant so every card uses the same room-opening boundary.
  // eslint-disable-next-line react-hooks/purity
  const currentTime = Date.now();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Área do aluno</p>
        <h1 className="mt-3 font-playfair text-4xl font-bold sm:text-5xl">Próximas aulas</h1>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <h2 className="font-playfair text-2xl font-bold">Sua agenda está livre</h2>
          <p className="mt-2 text-sm opacity-70">Encontre um professor e escolha um horário.</p>
          <Link href="/professores" className="mt-6 inline-flex rounded-md border border-neon px-5 py-3 font-bold text-neon">
            Encontrar professor
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => {
            const open = isRoomOpen(booking.scheduledAt, currentTime);
            return (
              <article key={booking.id} className="rounded-2xl border border-border bg-surface p-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Aula</p>
                <h2 className="mt-3 font-playfair text-2xl font-bold">{booking.teacherName}</h2>
                <p className="mt-2 text-sm opacity-70">
                  {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short' }).format(booking.scheduledAt)}
                </p>
                <p className="mt-3 text-xs uppercase tracking-wider opacity-60">Status: {booking.status}</p>
                {open ? (
                  <BookingRoom url={booking.meetingUrl} />
                ) : (
                  <span className="mt-6 block rounded-md border border-border px-4 py-3 text-center text-sm opacity-60">
                    Sala liberada 10 minutos antes
                  </span>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
