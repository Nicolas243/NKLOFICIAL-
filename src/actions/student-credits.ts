'use server';

import { and, eq, gte, lt, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { classBookings, studentPlanEnrollments } from '@/db/schema';
import { env } from '@/env';
import { createClient } from '@/lib/supabase/server';
import { createBookingNotification } from '@/lib/notifications/booking-alerts';

const CLASS_ROOM_TTL_SECONDS = 7200;

export async function createDailyRoomServerSide(_bookingId: string, _scheduledAt: Date): Promise<string | null> {
  void _bookingId;
  void _scheduledAt;
  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.DAILY_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ privacy: 'private', properties: { exp: Math.floor(Date.now() / 1000) + CLASS_ROOM_TTL_SECONDS } }),
  });
  if (!response.ok) return null;
  const payload: unknown = await response.json();
  return typeof payload === 'object' && payload !== null && 'url' in payload && typeof payload.url === 'string' ? payload.url : null;
}

export async function bookClassWithCreditAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const enrollmentId = String(formData.get('enrollmentId') ?? '');
  const teacherId = String(formData.get('teacherId') ?? '');
  const scheduledAt = new Date(String(formData.get('scheduledAtIso') ?? ''));
  if (!user?.id || !enrollmentId || !teacherId || Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
    return { success: false, message: 'Dados de agendamento inválidos.' };
  }
  const [enrollment] = await db.select().from(studentPlanEnrollments).where(and(
    eq(studentPlanEnrollments.id, enrollmentId),
    eq(studentPlanEnrollments.studentId, user.id),
    eq(studentPlanEnrollments.teacherId, teacherId),
    eq(studentPlanEnrollments.status, 'active'),
    gte(studentPlanEnrollments.expiresAt, new Date()),
    sql`${studentPlanEnrollments.usedCredits} < ${studentPlanEnrollments.totalCredits}`,
  )).limit(1);
  if (!enrollment) return { success: false, message: 'Crédito indisponível.' };
  const [collision] = await db.select({ id: classBookings.id }).from(classBookings).where(and(
    eq(classBookings.teacherId, teacherId),
    eq(classBookings.scheduledAt, scheduledAt),
    lt(classBookings.scheduledAt, new Date(scheduledAt.getTime() + 60 * 60 * 1000)),
  )).limit(1);
  if (collision) return { success: false, message: 'Este horário já foi reservado.' };
  const roomUrl = await createDailyRoomServerSide(enrollmentId, scheduledAt);
  if (!roomUrl) return { success: false, message: 'Não foi possível preparar a sala.' };
  const [booking] = await db.insert(classBookings).values({
    studentId: user.id,
    teacherId,
    scheduledAt,
    status: 'confirmed',
    paymentStatus: 'paid',
    meetingUrl: roomUrl,
    priceCents: 0,
    platformFeeCents: 0,
    teacherNetCents: 0,
    planModality: enrollment.modality,
    enrollmentId: enrollment.id,
  }).returning({ id: classBookings.id });
  await db.update(studentPlanEnrollments).set({
    usedCredits: enrollment.usedCredits + 1,
    status: enrollment.usedCredits + 1 >= enrollment.totalCredits ? 'exhausted' : 'active',
  }).where(eq(studentPlanEnrollments.id, enrollment.id));
  await Promise.all([
    createBookingNotification({ userId: user.id, title: 'Aula agendada', message: 'Sua aula com crédito foi confirmada.', link: booking?.id }),
    createBookingNotification({ userId: teacherId, title: 'Aula agendada por crédito', message: 'Uma aula foi agendada a partir de um plano ativo.', link: booking?.id }),
  ]);
  revalidatePath('/dashboard/aluno');
  revalidatePath('/dashboard/professor');
  return { success: true, message: 'Aula confirmada.' };
}
