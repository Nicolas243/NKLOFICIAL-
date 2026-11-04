import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { and, eq, gte, isNull, lt, lte } from 'drizzle-orm';
import { db } from '@/db';
import { businessDirectory, classBookings, studentPlanEnrollments, subscriptions, userProfiles } from '@/db/schema';
import { env } from '@/env';
import { createBookingNotification } from '@/lib/notifications/booking-alerts';
import { getValidTeacherMpAccessToken } from '@/lib/mercadopago/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REMINDER_WINDOW_MIN_MINUTES = 5;
const REMINDER_WINDOW_MAX_MINUTES = 75;
const CLASS_ROOM_TTL_SECONDS = 7200;
const CLASS_COMPLETION_GRACE_MINUTES = 60;

function hasValidAuthorization(request: NextRequest): boolean {
  const value = request.headers.get('authorization') ?? '';
  const prefix = 'Bearer ';
  if (!value.startsWith(prefix)) return false;
  const received = Buffer.from(value.slice(prefix.length));
  const expected = Buffer.from(env.CRON_SECRET);
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

async function provisionRoom(): Promise<string | null> {
  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.DAILY_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ privacy: 'private', properties: { exp: Math.floor(Date.now() / 1000) + CLASS_ROOM_TTL_SECONDS } }),
  });
  if (!response.ok) return null;
  const payload: unknown = await response.json();
  return typeof payload === 'object' && payload !== null && 'url' in payload && typeof payload.url === 'string' ? payload.url : null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!hasValidAuthorization(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const now = new Date();
    const expired = await db.update(studentPlanEnrollments)
      .set({ status: 'expired' })
      .where(and(eq(studentPlanEnrollments.status, 'active'), lt(studentPlanEnrollments.expiresAt, now)))
      .returning({ id: studentPlanEnrollments.id });
    const completionCutoff = new Date(now.getTime() - CLASS_COMPLETION_GRACE_MINUTES * 60 * 1000);
    const autoCompleted = await db.update(classBookings).set({ completedAt: now }).where(and(
      eq(classBookings.status, 'confirmed'),
      eq(classBookings.paymentStatus, 'paid'),
      isNull(classBookings.completedAt),
      lt(classBookings.scheduledAt, completionCutoff),
    )).returning({ id: classBookings.id });

    const from = new Date(now.getTime() + REMINDER_WINDOW_MIN_MINUTES * 60 * 1000);
    const to = new Date(now.getTime() + REMINDER_WINDOW_MAX_MINUTES * 60 * 1000);
    const bookings = await db.select({
      id: classBookings.id,
      studentId: classBookings.studentId,
      teacherId: classBookings.teacherId,
      scheduledAt: classBookings.scheduledAt,
      meetingUrl: classBookings.meetingUrl,
    }).from(classBookings).where(and(
      eq(classBookings.status, 'confirmed'),
      eq(classBookings.paymentStatus, 'paid'),
      isNull(classBookings.reminderSentAt),
      gte(classBookings.scheduledAt, from),
      lte(classBookings.scheduledAt, to),
    ));
    const teacherIds = [...new Set(bookings.map((booking) => booking.teacherId))];
    await Promise.all(teacherIds.map(async (teacherId) => {
      try {
        await getValidTeacherMpAccessToken(teacherId);
      } catch (error) {
        console.error('[CRON] Falha ao renovar credencial Mercado Pago:', error instanceof Error ? error.message : 'erro desconhecido');
      }
    }));

    let remindersDispatchedCount = 0;
    for (const booking of bookings) {
      let meetingUrl = booking.meetingUrl;
      if (!meetingUrl) meetingUrl = await provisionRoom();
      if (!meetingUrl) continue;
      await db.update(classBookings).set({ meetingUrl, reminderSentAt: new Date() }).where(and(eq(classBookings.id, booking.id), isNull(classBookings.reminderSentAt)));
      const time = booking.scheduledAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      await Promise.all([
        createBookingNotification({ userId: booking.studentId, title: 'Aula em aproximadamente 1 hora', message: `Sua aula começa às ${time}. Acesse o dashboard para entrar na sala.`, link: booking.id }),
        createBookingNotification({ userId: booking.teacherId, title: 'Aula em aproximadamente 1 hora', message: `Sua aula começa às ${time}. Acesse o dashboard para entrar na sala.`, link: booking.id }),
      ]);
      remindersDispatchedCount += 1;
    }

    const legacyExpired = await db.select({ id: subscriptions.id, userId: subscriptions.userId }).from(subscriptions).where(and(eq(subscriptions.status, 'active'), lt(subscriptions.currentPeriodEnd, now)));
    for (const subscription of legacyExpired) {
      await db.update(subscriptions).set({ status: 'past_due' }).where(eq(subscriptions.id, subscription.id));
      await db.update(userProfiles).set({ planType: 'free' }).where(eq(userProfiles.id, subscription.userId));
      await db.update(businessDirectory).set({ planType: 'free' }).where(eq(businessDirectory.userId, subscription.userId));
    }

    return NextResponse.json({
      expiredEnrollmentsCount: expired.length,
      autoCompletedClasses: autoCompleted.length,
      remindersDispatchedCount,
    }, { status: 200 });
  } catch (error) {
    console.error('[CRON] Falha ao sincronizar assinaturas e lembretes:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
