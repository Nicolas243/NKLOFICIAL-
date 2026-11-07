import crypto from 'node:crypto';
import { after, NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { classBookings, guidePurchases, studentPlanEnrollments } from '@/db/schema';
import { env } from '@/env';
import { getModalityMetadata, type ClassPlanModality } from '@/lib/pricing';
import { createBookingNotification } from '@/lib/notifications/booking-alerts';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CLASS_ROOM_TTL_SECONDS = 7200;
const HEX_SIGNATURE = /^[a-f0-9]{64}$/i;

type MercadoPagoNotification = {
  action?: unknown;
  data?: { id?: unknown };
  id?: unknown;
  type?: unknown;
};

type SignatureParts = {
  timestamp: string;
  signature: string;
};

function getBookingId(payment: { external_reference?: string; metadata?: unknown }): string | null {
  if (payment.external_reference) return payment.external_reference;
  if (
    typeof payment.metadata === 'object'
    && payment.metadata !== null
    && 'booking_id' in payment.metadata
    && typeof payment.metadata.booking_id === 'string'
  ) {
    return payment.metadata.booking_id;
  }
  return null;
}

function parseSignature(value: string): SignatureParts | null {
  const parts = new Map(value.split(',').map((part) => {
    const [key, ...rest] = part.trim().split('=');
    return [key, rest.join('=')];
  }));
  const timestamp = parts.get('ts');
  const signature = parts.get('v1');
  if (!timestamp || !signature || !/^\d+$/.test(timestamp) || !HEX_SIGNATURE.test(signature)) return null;
  return { timestamp, signature };
}

export function verifyMercadoPagoWebhookSignature(input: { xSignature: string; xRequestId: string; dataId: string; secret: string }): boolean {
  const parts = parseSignature(input.xSignature);
  if (!parts) return false;
  const manifest = `id:${input.dataId};request-id:${input.xRequestId};ts:${parts.timestamp};`;
  const expected = crypto.createHmac('sha256', input.secret).update(manifest).digest('hex');
  const received = Buffer.from(parts.signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  return received.length === expectedBuffer.length && crypto.timingSafeEqual(received, expectedBuffer);
}

function hasValidSignature(request: NextRequest, notification: MercadoPagoNotification): boolean {
  const xSignature = request.headers.get('x-signature');
  const xRequestId = request.headers.get('x-request-id');
  const dataId = notification.data?.id;
  if (!env.MERCADOPAGO_WEBHOOK_SECRET || !xSignature || !xRequestId || typeof dataId !== 'string') return false;
  return verifyMercadoPagoWebhookSignature({ xSignature, xRequestId, dataId, secret: env.MERCADOPAGO_WEBHOOK_SECRET });
}

async function processNotification(notification: MercadoPagoNotification, client: MercadoPagoConfig): Promise<void> {
  const paymentId = notification.data?.id;
  if (typeof paymentId !== 'string' || !paymentId) return;

  try {
    const payment = await new Payment(client).get({ id: paymentId });
    if (payment.status !== 'approved') return;

    const purchaseId = typeof payment.external_reference === 'string'
      ? z.string().uuid().safeParse(payment.external_reference)
      : { success: false as const };
    if (purchaseId.success) {
      const [guidePurchase] = await db.select({ id: guidePurchases.id })
        .from(guidePurchases)
        .where(eq(guidePurchases.id, purchaseId.data))
        .limit(1);
      if (guidePurchase) {
        await db.update(guidePurchases).set({
          status: 'approved',
          paymentId: String(payment.id),
          updatedAt: new Date(),
        }).where(eq(guidePurchases.id, guidePurchase.id));
        return;
      }
    }

    const bookingId = getBookingId(payment);
    if (!bookingId) return;

    const [booking] = await db.select({
      id: classBookings.id,
      studentId: classBookings.studentId,
      teacherId: classBookings.teacherId,
      planModality: classBookings.planModality,
      priceCents: classBookings.priceCents,
      platformFeeCents: classBookings.platformFeeCents,
      paymentStatus: classBookings.paymentStatus,
    }).from(classBookings).where(and(eq(classBookings.id, bookingId), eq(classBookings.paymentStatus, 'pending'))).limit(1);
    if (!booking) return;
    const modality = getModalityMetadata(booking.planModality as ClassPlanModality);

    const dailyResponse = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        privacy: 'private',
        properties: { exp: Math.floor(Date.now() / 1000) + CLASS_ROOM_TTL_SECONDS },
      }),
    });

    if (!dailyResponse.ok) {
      console.error('[WEBHOOK] Daily recusou a criação da sala:', dailyResponse.status);
      return;
    }

    const dailyPayload: unknown = await dailyResponse.json();
    if (
      typeof dailyPayload !== 'object'
      || dailyPayload === null
      || !('url' in dailyPayload)
      || typeof dailyPayload.url !== 'string'
    ) {
      console.error('[WEBHOOK] Daily retornou uma sala sem URL válida.');
      return;
    }

    let enrollmentId: string | undefined;
    if (modality.includedClasses > 1) {
      const [enrollment] = await db.insert(studentPlanEnrollments).values({
        studentId: booking.studentId,
        teacherId: booking.teacherId,
        modality: booking.planModality,
        totalCredits: modality.includedClasses,
        usedCredits: 1,
        pricePaidCents: booking.priceCents,
        platformFeeCents: booking.platformFeeCents,
        mpPaymentId: String(payment.id),
        expiresAt: new Date(Date.now() + modality.validityDays * 24 * 60 * 60 * 1000),
      }).returning({ id: studentPlanEnrollments.id });
      enrollmentId = enrollment?.id;
    }

    await db.update(classBookings).set({
      paymentStatus: 'paid',
      status: 'confirmed',
      meetingUrl: dailyPayload.url,
      enrollmentId,
    }).where(and(eq(classBookings.id, bookingId), eq(classBookings.paymentStatus, 'pending')));
    await Promise.all([
      createBookingNotification({ userId: booking.studentId, title: 'Aula confirmada', message: 'Seu pagamento foi aprovado e a sala está pronta.', link: bookingId }),
      createBookingNotification({ userId: booking.teacherId, title: 'Pagamento aprovado', message: 'A aula foi confirmada e a sala Daily está disponível.', link: bookingId }),
    ]);
  } catch (error) {
    console.error('[WEBHOOK] Falha ao processar pagamento:', error instanceof Error ? error.message : 'erro desconhecido');
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let notification: MercadoPagoNotification;
  try {
    notification = await request.json() as MercadoPagoNotification;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (!hasValidSignature(request, notification)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  const client = new MercadoPagoConfig({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN });
  after(() => processNotification(notification, client));
  return NextResponse.json({ received: true }, { status: 200 });
}
