import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { and, eq, gte, isNull, isNotNull, lt, lte } from 'drizzle-orm';
import { db } from '@/db';
import {
  businessDirectory,
  classBookings,
  guideSubscriptions,
  studentPlanEnrollments,
  subscriptions,
  userProfiles,
} from '@/db/schema';
import { env } from '@/env';
import { createBookingNotification } from '@/lib/notifications/booking-alerts';
import { getValidTeacherMpAccessToken } from '@/lib/mercadopago/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REMINDER_WINDOW_MIN_MINUTES = 5;
const REMINDER_WINDOW_MAX_MINUTES = 75;
const CLASS_ROOM_TTL_SECONDS = 7200;
const CLASS_COMPLETION_GRACE_MINUTES = 60;

function normalizeGuideSubscriptionStatus(status: unknown): string {
  if (typeof status !== 'string') return 'pending';
  const normalized = status.toLowerCase();
  if (['authorized', 'active'].includes(normalized)) return 'active';
  if (['cancelled', 'canceled'].includes(normalized)) return 'canceled';
  return normalized;
}

function parsePeriodEnd(value: unknown): Date | null {
  if (typeof value === 'number' && Number.isFinite(value)) return new Date(value * 1000);
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

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
    const guideSubscriptionRows = await db.select({
      id: guideSubscriptions.id,
      gatewaySubscriptionId: guideSubscriptions.gatewaySubscriptionId,
    }).from(guideSubscriptions).where(and(
      isNotNull(guideSubscriptions.gatewaySubscriptionId),
    ));
    const mercadoPago = new MercadoPagoConfig({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN });
    let guideSubscriptionsSyncedCount = 0;
    let guideSubscriptionSyncErrors = 0;
    for (const subscription of guideSubscriptionRows) {
      if (!subscription.gatewaySubscriptionId) continue;
      try {
        const preapproval = await new PreApproval(mercadoPago).get({ id: subscription.gatewaySubscriptionId });
        await db.update(guideSubscriptions).set({
          status: normalizeGuideSubscriptionStatus(preapproval.status),
          email: typeof preapproval.payer_email === 'string' ? preapproval.payer_email : null,
          currentPeriodEnd: parsePeriodEnd(preapproval.next_payment_date),
          updatedAt: new Date(),
        }).where(eq(guideSubscriptions.id, subscription.id));
        guideSubscriptionsSyncedCount += 1;
      } catch (error) {
        guideSubscriptionSyncErrors += 1;
        console.error('[CRON] Falha ao sincronizar assinatura de guias:', error instanceof Error ? error.message : 'erro desconhecido');
      }
    }

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
      guideSubscriptionsSyncedCount,
      guideSubscriptionSyncErrors,
      expiredEnrollmentsCount: expired.length,
      autoCompletedClasses: autoCompleted.length,
      remindersDispatchedCount,
    }, { status: 200 });
  } catch (error) {
    console.error('[CRON] Falha ao sincronizar assinaturas e lembretes:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
