'use server';

import { and, eq, gt } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { classBookings, studentPlanEnrollments } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { createBookingNotification } from '@/lib/notifications/booking-alerts';

const MIN_RESCHEDULE_ADVANCE_HOURS = 24;

export async function cancelClassBookingAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  const bookingId = String(formData.get('bookingId') ?? '');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id || !bookingId) return { success: false, message: 'Reserva inválida.' };
  const [booking] = await db.select().from(classBookings).where(and(eq(classBookings.id, bookingId), gt(classBookings.scheduledAt, new Date()))).limit(1);
  if (!booking || (booking.studentId !== user.id && booking.teacherId !== user.id)) return { success: false, message: 'Ação não autorizada.' };
  const hours = (booking.scheduledAt.getTime() - Date.now()) / 3600000;
  if (booking.studentId === user.id && hours < MIN_RESCHEDULE_ADVANCE_HOURS) return { success: false, message: 'O cancelamento exige 24 horas de antecedência.' };
  await db.update(classBookings).set({ status: 'cancelled', cancelledAt: new Date() }).where(eq(classBookings.id, bookingId));
  if (booking.enrollmentId) {
    const [enrollment] = await db.select().from(studentPlanEnrollments).where(eq(studentPlanEnrollments.id, booking.enrollmentId)).limit(1);
    if (enrollment) await db.update(studentPlanEnrollments).set({ usedCredits: Math.max(0, enrollment.usedCredits - 1), status: 'active' }).where(eq(studentPlanEnrollments.id, enrollment.id));
  }
  await createBookingNotification({ userId: booking.studentId === user.id ? booking.teacherId : booking.studentId, title: 'Aula cancelada', message: 'Uma aula foi cancelada.', link: bookingId });
  revalidatePath('/dashboard/aluno');
  revalidatePath('/dashboard/professor');
  return { success: true, message: 'Aula cancelada.' };
}

export async function rescheduleClassBookingAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  const bookingId = String(formData.get('bookingId') ?? '');
  const scheduledAt = new Date(String(formData.get('scheduledAt') ?? ''));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id || !bookingId || Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) return { success: false, message: 'Novo horário inválido.' };
  const [booking] = await db.select().from(classBookings).where(and(eq(classBookings.id, bookingId), eq(classBookings.studentId, user.id))).limit(1);
  if (!booking) return { success: false, message: 'Reserva não encontrada.' };
  if ((booking.scheduledAt.getTime() - Date.now()) / 3600000 < MIN_RESCHEDULE_ADVANCE_HOURS) return { success: false, message: 'O reagendamento exige 24 horas de antecedência.' };
  await db.update(classBookings).set({ scheduledAt }).where(eq(classBookings.id, bookingId));
  await createBookingNotification({ userId: booking.teacherId, title: 'Aula reagendada', message: 'O aluno alterou o horário da aula.', link: bookingId });
  revalidatePath('/dashboard/aluno');
  revalidatePath('/dashboard/professor');
  return { success: true, message: 'Aula reagendada.' };
}
