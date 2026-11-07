import crypto from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { guidePurchases, guideSubscriptions } from '@/db/schema';
import { env } from '@/env';
import {
  GUIDE_PRICE_CENTS,
  GUIDE_SUBSCRIPTION_PRICE_CENTS,
} from '@/lib/guide-offer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HOTMART_PAYMENT_PREFIX = 'hotmart:';
const HOTMART_SUBSCRIPTION_PREFIX = 'hotmart_subscription:';

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getRecord(value: unknown, key: string): JsonRecord | null {
  if (!isRecord(value)) return null;
  const nested = value[key];
  return isRecord(nested) ? nested : null;
}

function getIdentifier(value: unknown, key: string): string | null {
  if (!isRecord(value)) return null;
  const result = value[key];
  if (typeof result === 'number' && Number.isFinite(result)) return String(result);
  return typeof result === 'string' && result.trim() ? result.trim() : null;
}

function getPathString(value: unknown, path: readonly string[]): string | null {
  let current = value;
  for (let index = 0; index < path.length; index += 1) {
    const key = path[index];
    if (index === path.length - 1) return getIdentifier(current, key);
    current = getRecord(current, key);
    if (!current) return null;
  }
  return null;
}

function getEvent(body: JsonRecord, data: JsonRecord): string {
  return (getIdentifier(body, 'event') ?? getIdentifier(data, 'event') ?? '').toUpperCase();
}

function hasValidToken(request: NextRequest): boolean {
  const expectedToken = env.HOTMART_WEBHOOK_TOKEN;
  const receivedToken = request.headers.get('x-hotmart-hottok') ?? request.headers.get('hottok');
  if (!expectedToken || !receivedToken) return false;
  const expected = Buffer.from(expectedToken);
  const received = Buffer.from(receivedToken);
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

function isProductConfiguredForHotmart(productId: string | null, subscription: boolean): boolean {
  const expectedProductId = subscription
    ? env.HOTMART_SUBSCRIPTION_PRODUCT_ID
    : env.HOTMART_GUIDE_PRODUCT_ID;
  return Boolean(expectedProductId && productId === expectedProductId);
}

function isApprovedEvent(event: string): boolean {
  return ['PURCHASE_APPROVED', 'PURCHASE_COMPLETE', 'PURCHASE_COMPLETED', 'SUBSCRIPTION_ACTIVE'].includes(event);
}

function isRejectedEvent(event: string): boolean {
  return [
    'PURCHASE_REFUNDED',
    'PURCHASE_CHARGEBACK',
    'PURCHASE_CANCELED',
    'PURCHASE_CANCELLED',
    'PURCHASE_EXPIRED',
    'SUBSCRIPTION_CANCELED',
    'SUBSCRIPTION_CANCELLED',
    'SUBSCRIPTION_CANCELLATION',
    'SUBSCRIPTION_DEACTIVATED',
  ].includes(event);
}

async function processPurchase(data: JsonRecord, event: string): Promise<void> {
  const transaction = getPathString(data, ['purchase', 'transaction']);
  if (!transaction) return;
  const paymentId = `${HOTMART_PAYMENT_PREFIX}${transaction}`;
  const [existing] = await db.select({ id: guidePurchases.id })
    .from(guidePurchases)
    .where(eq(guidePurchases.paymentId, paymentId))
    .limit(1);

  if (isRejectedEvent(event)) {
    if (existing) {
      await db.update(guidePurchases).set({
        status: 'rejected',
        updatedAt: new Date(),
      }).where(eq(guidePurchases.id, existing.id));
    }
    return;
  }
  if (!isApprovedEvent(event)) return;

  const email = getPathString(data, ['buyer', 'email']);
  if (existing) {
    await db.update(guidePurchases).set({
      status: 'approved',
      email,
      updatedAt: new Date(),
    }).where(eq(guidePurchases.id, existing.id));
    return;
  }

  await db.insert(guidePurchases).values({
    paymentId,
    email,
    amountCents: GUIDE_PRICE_CENTS,
    status: 'approved',
  });
}

async function processSubscription(data: JsonRecord, event: string): Promise<void> {
  const subscriberCode = getPathString(data, ['subscription', 'subscriber', 'code'])
    ?? getPathString(data, ['subscription', 'subscriber_code']);
  if (!subscriberCode) return;

  const gatewaySubscriptionId = `${HOTMART_SUBSCRIPTION_PREFIX}${subscriberCode}`;
  const externalReference = gatewaySubscriptionId;
  const email = getPathString(data, ['buyer', 'email']);
  const status = isRejectedEvent(event) ? 'canceled' : isApprovedEvent(event) ? 'active' : 'pending';
  const [existing] = await db.select({ id: guideSubscriptions.id })
    .from(guideSubscriptions)
    .where(and(
      eq(guideSubscriptions.externalReference, externalReference),
      eq(guideSubscriptions.gatewaySubscriptionId, gatewaySubscriptionId),
    ))
    .limit(1);

  if (existing) {
    await db.update(guideSubscriptions).set({
      status,
      email,
      updatedAt: new Date(),
    }).where(eq(guideSubscriptions.id, existing.id));
    return;
  }

  await db.insert(guideSubscriptions).values({
    externalReference,
    gatewaySubscriptionId,
    email,
    amountCents: GUIDE_SUBSCRIPTION_PRICE_CENTS,
    status,
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!hasValidToken(request)) {
    return NextResponse.json({ error: 'invalid_webhook_token' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const data = getRecord(body, 'data') ?? body;
  const event = getEvent(body, data);
  const productId = getPathString(data, ['product', 'id']);
  const isSubscription = Boolean(
    getRecord(data, 'subscription')
    || event.startsWith('SUBSCRIPTION_'),
  );

  if (!isProductConfiguredForHotmart(productId, isSubscription)) {
    return NextResponse.json({ received: true, processed: false }, { status: 202 });
  }

  try {
    if (isSubscription) {
      await processSubscription(data, event);
    } else {
      await processPurchase(data, event);
    }
    return NextResponse.json({ received: true, processed: true }, { status: 200 });
  } catch (error) {
    console.error('[HOTMART_WEBHOOK] Falha ao processar evento:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json({ error: 'processing_failed' }, { status: 500 });
  }
}
