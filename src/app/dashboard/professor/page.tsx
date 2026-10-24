import { redirect } from 'next/navigation';
import { and, eq, gte } from 'drizzle-orm';
import { AvailabilityManager } from '@/components/dashboard/availability-manager';
import { db } from '@/db';
import { classBookings, users } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { BookingRoom } from '@/components/video/booking-room';

export const metadata = {
  title: 'Dashboard do Professor | Portal NKL',
};

export default async function ProfessorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect('/login');
  }

  const [profile] = await db.select({ name: users.name, role: users.role }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!profile || profile.role !== 'professor') {
    redirect('/');
  }
  const bookings = await db
    .select({
      id: classBookings.id,
      scheduledAt: classBookings.scheduledAt,
      meetingUrl: classBookings.meetingUrl,
      studentName: users.name,
    })
    .from(classBookings)
    .innerJoin(users, eq(users.id, classBookings.studentId))
    .where(and(eq(classBookings.teacherId, user.id), gte(classBookings.scheduledAt, new Date())));
  // Use one instant for consistent room availability across all cards.
  // eslint-disable-next-line react-hooks/purity
  const currentTime = Date.now();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Teacher Hub</p>
        <h1 className="mt-3 font-playfair text-4xl font-bold sm:text-5xl">Sua agenda, no seu ritmo</h1>
        <p className="mt-4 text-base opacity-70">
          Olá, {profile.name}. Defina os intervalos em que você pode receber alunos.
        </p>
      </div>
      <AvailabilityManager />
      <section className="mt-8 space-y-4">
        <h2 className="font-playfair text-2xl font-bold">Próximas aulas</h2>
        {bookings.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-sm opacity-70">Nenhuma aula confirmada no momento.</p>
        ) : bookings.map((booking) => {
          const isOpen = currentTime >= booking.scheduledAt.getTime() - 10 * 60 * 1000;
          return (
            <article key={booking.id} className="rounded-xl border border-border bg-surface p-6">
              <h3 className="font-playfair text-xl font-bold">{booking.studentName}</h3>
              <p className="mt-2 text-sm opacity-70">
                {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short' }).format(booking.scheduledAt)}
              </p>
              {isOpen ? (
                <BookingRoom url={booking.meetingUrl} />
              ) : (
                <p className="mt-2 text-xs opacity-60">A sala será liberada 10 minutos antes do horário.</p>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
