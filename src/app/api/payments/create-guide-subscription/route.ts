import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { guideSubscriptions } from '@/db/schema';
import { env } from '@/env';
import {
  GUIDE_SUBSCRIPTION_PRICE_CENTS,
} from '@/lib/guide-offer';
import { parseValidatedOfferVariant } from '@/lib/offer-experiment';
import { createCheckoutSession } from '@/lib/stripe/checkout';
import { buildGuideSubscriptionCheckoutParams } from '@/lib/stripe/guide';
const SUBSCRIPTION_REFERENCE_PREFIX = 'guide_subscription:';

const requestSchema = z.object({
  offerVariant: z.string().trim().max(64).regex(/^[a-z0-9:-]+$/i).optional(),
  payerEmail: z.string().trim().email(),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json().catch(() => ({}));
    const parsedBody = requestSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'invalid_subscription_request', message: 'Não foi possível preparar a assinatura.' }, { status: 400 });
    }
    const offerVariant = parsedBody.data.offerVariant
      ? parseValidatedOfferVariant(parsedBody.data.offerVariant)
      : undefined;
    if (parsedBody.data.offerVariant && !offerVariant) {
      return NextResponse.json({ error: 'invalid_subscription_request', message: 'Não foi possível preparar a assinatura.' }, { status: 400 });
    }

    const subscriptionId = crypto.randomUUID();
    const externalReference = `${SUBSCRIPTION_REFERENCE_PREFIX}${subscriptionId}`;
    const [subscription] = await db.insert(guideSubscriptions).values({
      id: subscriptionId,
      externalReference,
      amountCents: GUIDE_SUBSCRIPTION_PRICE_CENTS,
      offerVariant: offerVariant ?? undefined,
      email: parsedBody.data.payerEmail,
    }).returning({ id: guideSubscriptions.id });

    if (!subscription) {
      return NextResponse.json({ error: 'subscription_creation_failed', message: 'Não foi possível registrar a assinatura.' }, { status: 502 });
    }

    const session = await createCheckoutSession(buildGuideSubscriptionCheckoutParams({
      subscriptionId: subscription.id,
      siteUrl: env.NEXT_PUBLIC_SITE_URL,
      payerEmail: parsedBody.data.payerEmail,
      offerVariant: offerVariant ?? undefined,
    }));

    if (!session.url) {
      return NextResponse.json({ error: 'subscription_checkout_failed', message: 'O Stripe não retornou um checkout válido.' }, { status: 502 });
    }

    return NextResponse.json({ checkoutUrl: session.url }, { status: 200 });
  } catch (error) {
    console.error('[GUIDE_SUBSCRIPTION] Falha ao criar assinatura:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json({ error: 'subscription_checkout_failed', message: 'Não foi possível iniciar a assinatura. Tente novamente.' }, { status: 502 });
  }
}
