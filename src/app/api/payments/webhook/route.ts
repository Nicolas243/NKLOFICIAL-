import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { classBookings, guideOfferEvents, guidePurchases, studentPlanEnrollments } from '@/db/schema';
import { env } from '@/env';
import { getModalityMetadata, type ClassPlanModality } from '@/lib/pricing';
import { createBookingNotification } from '@/lib/notifications/booking-alerts';
import { verifyMercadoPagoWebhookSignature } from '@/lib/mercadopago/webhook-signature';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CLASS_ROOM_TTL_SECONDS = 7200;
const GUIDE_PURCHASE_REFERENCE_PREFIX = 'guide_purchase:';

type MercadoPagoNotification = {
  action?: unknown;
  data?: { id?: unknown };
  id?: unknown;
  type?: unknown;
};

function getBookingId(payment: { external_reference?: string; metadata?: unknown }): string | null {
  if (payment.external_reference && !payment.external_reference.startsWith(GUIDE_PURCHASE_REFERENCE_PREFIX)) {
    return payment.external_reference;
  }
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

function getGuidePurchaseId(externalReference: unknown): string | null {
  if (typeof externalReference !== 'string' || !externalReference.startsWith(GUIDE_PURCHASE_REFERENCE_PREFIX)) {
    return null;
  }
  const parsed = z.string().uuid().safeParse(externalReference.slice(GUIDE_PURCHASE_REFERENCE_PREFIX.length));
  return parsed.success ? parsed.data : null;
}

function getOfferExperiment(offerVariant: string | null): { experiment: string; variant: string } | null {
  if (!offerVariant) return null;
  const [experiment, variant] = offerVariant.split(':');
  return experiment && variant ? { experiment, variant } : null;
}

export { verifyMercadoPagoWebhookSignature } from '@/lib/mercadopago/webhook-signature';

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

    const purchaseId = getGuidePurchaseId(payment.external_reference);
    if (purchaseId) {
      const [guidePurchase] = await db.select({ id: guidePurchases.id })
        .from(guidePurchases)
        .where(eq(guidePurchases.id, purchaseId))
        .limit(1);
      if (guidePurchase) {
        const payerEmail = typeof payment.payer?.email === 'string' ? payment.payer.email : null;
        await db.update(guidePurchases).set({
          status: 'approved',
          paymentId: String(payment.id),
          email: payerEmail,
          updatedAt: new Date(),
        }).where(eq(guidePurchases.id, guidePurchase.id));
        const [purchaseDetails] = await db.select({ offerVariant: guidePurchases.offerVariant })
          .from(guidePurchases)
          .where(eq(guidePurchases.id, guidePurchase.id))
          .limit(1);
        const experiment = getOfferExperiment(purchaseDetails?.offerVariant ?? null);
        if (experiment) {
          const [existingConversion] = await db.select({ id: guideOfferEvents.id })
            .from(guideOfferEvents)
            .where(and(
              eq(guideOfferEvents.purchaseId, guidePurchase.id),
              eq(guideOfferEvents.eventType, 'conversion'),
            ))
            .limit(1);
          if (!existingConversion) {
            await db.insert(guideOfferEvents).values({
              experiment: experiment.experiment,
              variant: experiment.variant,
              eventType: 'conversion',
              purchaseId: guidePurchase.id,
            });
          }
        }
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
    throw error;
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
  try {
    await processNotification(notification, client);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'processing_failed' }, { status: 500 });
  }
}
