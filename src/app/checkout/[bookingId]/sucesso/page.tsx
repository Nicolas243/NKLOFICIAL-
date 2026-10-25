import Link from 'next/link';
import { and, eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/db';
import { classBookings, studentPlanEnrollments, users } from '@/db/schema';
import { getModalityMetadata, type ClassPlanModality } from '@/lib/pricing';
import { createClient } from '@/lib/supabase/server';

type Params = Promise<{ bookingId: string }>;

export default async function BookingSuccessPage(props: { params: Params }) {
  const { bookingId } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) redirect('/login');
  const [booking] = await db.select({
    id: classBookings.id,
    status: classBookings.status,
    paymentStatus: classBookings.paymentStatus,
    scheduledAt: classBookings.scheduledAt,
    planModality: classBookings.planModality,
    enrollmentId: classBookings.enrollmentId,
    teacherName: users.name,
  }).from(classBookings).innerJoin(users, eq(users.id, classBookings.teacherId))
    .where(and(eq(classBookings.id, bookingId), eq(classBookings.studentId, user.id))).limit(1);
  if (!booking) notFound();
  const [enrollment] = await db.select({
    totalCredits: studentPlanEnrollments.totalCredits,
    usedCredits: studentPlanEnrollments.usedCredits,
  }).from(studentPlanEnrollments).where(eq(studentPlanEnrollments.id, booking.enrollmentId ?? '')).limit(1);
  const modality = getModalityMetadata(booking.planModality as ClassPlanModality);
  const confirmed = booking.paymentStatus === 'paid' && booking.status === 'confirmed';
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Checkout</p>
      <h1 className="mt-3 font-playfair text-4xl font-bold">{confirmed ? 'Pagamento confirmado' : 'Pagamento em processamento'}</h1>
      <p className="mt-4 text-sm opacity-75">
        {confirmed ? 'Sua reserva está confirmada.' : 'O Mercado Pago ainda está processando a transação. Atualize esta página em alguns instantes.'}
      </p>
      <dl className="mt-8 space-y-3 rounded-2xl border border-border bg-surface p-6 text-sm">
        <div className="flex justify-between"><dt>Professor</dt><dd>{booking.teacherName}</dd></div>
        <div className="flex justify-between"><dt>Modalidade</dt><dd>{modality.label}</dd></div>
        <div className="flex justify-between"><dt>Data</dt><dd>{booking.scheduledAt.toLocaleString('pt-BR')}</dd></div>
        <div className="flex justify-between"><dt>Créditos liberados</dt><dd>{enrollment?.totalCredits ?? modality.includedClasses}</dd></div>
      </dl>
      <p className="mt-6 text-sm opacity-75">A sala Daily.co será liberada 10 minutos antes do horário agendado, dentro do dashboard.</p>
      <div className="mt-8 flex gap-3">
        <Link href={`/checkout/${bookingId}/sucesso`} className="rounded-md border border-neon px-4 py-3 font-bold text-neon">Atualizar status</Link>
        <Link href="/dashboard/aluno" className="rounded-md bg-neon px-4 py-3 font-bold text-black">Ir para o dashboard</Link>
      </div>
    </main>
  );
}
