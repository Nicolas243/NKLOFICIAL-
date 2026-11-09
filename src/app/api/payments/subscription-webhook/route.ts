import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { guideOfferEvents, guideSubscriptions } from '@/db/schema';
import { env } from '@/env';
import { verifyMercadoPagoWebhookSignature } from '@/lib/mercadopago/webhook-signature';
import { getOfferExperimentFromVariant, parseValidatedOfferVariant } from '@/lib/offer-experiment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUBSCRIPTION_REFERENCE_PREFIX = 'guide_subscription:';

type SubscriptionNotification = {
  data?: { id?: unknown };
  type?: unknown;
};

function getSubscriptionReference(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith(SUBSCRIPTION_REFERENCE_PREFIX)) return null;
  return value;
}

function parsePeriodEnd(value: unknown): Date | null {
  if (typeof value === 'number' && Number.isFinite(value)) return new Date(value * 1000);
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

async function processSubscription(notification: SubscriptionNotification): Promise<void> {
  const subscriptionId = notification.data?.id;
  if (typeof subscriptionId !== 'string' || !subscriptionId) return;

  const client = new MercadoPagoConfig({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN });
  const preapproval = await new PreApproval(client).get({ id: subscriptionId });
  const externalReference = getSubscriptionReference(preapproval.external_reference);
  if (!externalReference) return;

  const status = typeof preapproval.status === 'string' ? preapproval.status.toLowerCase() : 'pending';
  const normalizedStatus = ['authorized', 'active'].includes(status)
    ? 'active'
    : ['cancelled', 'canceled'].includes(status)
      ? 'canceled'
      : status;
  const [subscription] = await db.select({
    id: guideSubscriptions.id,
    offerVariant: guideSubscriptions.offerVariant,
  }).from(guideSubscriptions)
    .where(eq(guideSubscriptions.externalReference, externalReference))
    .limit(1);
  if (!subscription) return;

  await db.update(guideSubscriptions).set({
    gatewaySubscriptionId: subscriptionId,
    email: typeof preapproval.payer_email === 'string' ? preapproval.payer_email : null,
    status: normalizedStatus,
    currentPeriodEnd: parsePeriodEnd(preapproval.next_payment_date),
    updatedAt: new Date(),
  }).where(eq(guideSubscriptions.id, subscription.id));

  if (normalizedStatus === 'active' && subscription.offerVariant) {
    const attribution = getOfferExperimentFromVariant(parseValidatedOfferVariant(subscription.offerVariant));
    if (attribution) {
      const [existingConversion] = await db.select({ id: guideOfferEvents.id })
        .from(guideOfferEvents)
        .where(and(
          eq(guideOfferEvents.subscriptionId, subscription.id),
          eq(guideOfferEvents.eventType, 'conversion'),
        ))
        .limit(1);
      if (!existingConversion) {
        await db.insert(guideOfferEvents).values({
          experiment: attribution.experiment,
          variant: attribution.variant,
          eventType: 'conversion',
          subscriptionId: subscription.id,
        });
      }
    }
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let notification: SubscriptionNotification;
  try {
    notification = await request.json() as SubscriptionNotification;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const dataId = notification.data?.id;
  const xSignature = request.headers.get('x-signature');
  const xRequestId = request.headers.get('x-request-id');
  if (
    !env.MERCADOPAGO_WEBHOOK_SECRET
    || !xSignature
    || !xRequestId
    || typeof dataId !== 'string'
    || !verifyMercadoPagoWebhookSignature({
      xSignature,
      xRequestId,
      dataId,
      secret: env.MERCADOPAGO_WEBHOOK_SECRET,
    })
  ) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  try {
    await processSubscription(notification);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[GUIDE_SUBSCRIPTION_WEBHOOK] Falha ao processar evento:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json({ error: 'processing_failed' }, { status: 500 });
  }
}
