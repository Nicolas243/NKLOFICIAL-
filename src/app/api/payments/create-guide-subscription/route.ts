import crypto from 'node:crypto';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { guideSubscriptions } from '@/db/schema';
import { env } from '@/env';
import {
  GUIDE_SUBSCRIPTION_PRICE_CENTS,
  GUIDE_SUBSCRIPTION_TITLE,
} from '@/lib/guide-offer';
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

    const subscriptionId = crypto.randomUUID();
    const externalReference = `${SUBSCRIPTION_REFERENCE_PREFIX}${subscriptionId}`;
    const [subscription] = await db.insert(guideSubscriptions).values({
      id: subscriptionId,
      externalReference,
      amountCents: GUIDE_SUBSCRIPTION_PRICE_CENTS,
      offerVariant: parsedBody.data.offerVariant,
      email: parsedBody.data.payerEmail,
    }).returning({ id: guideSubscriptions.id });

    if (!subscription) {
      return NextResponse.json({ error: 'subscription_creation_failed', message: 'Não foi possível registrar a assinatura.' }, { status: 502 });
    }

    const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
    const client = new MercadoPagoConfig({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN });
    const preapproval = await new PreApproval(client).create({
      body: {
        reason: GUIDE_SUBSCRIPTION_TITLE,
        payer_email: parsedBody.data.payerEmail,
        external_reference: externalReference,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: GUIDE_SUBSCRIPTION_PRICE_CENTS / 100,
          currency_id: 'BRL',
        },
        back_url: `${siteUrl}/guias/renda-extra/sucesso?plan=subscription&external_reference=${encodeURIComponent(externalReference)}`,
        status: 'pending',
      },
    });

    if (!preapproval.init_point || typeof preapproval.init_point !== 'string') {
      return NextResponse.json({ error: 'subscription_checkout_failed', message: 'O Mercado Pago não retornou um checkout válido.' }, { status: 502 });
    }

    await db.update(guideSubscriptions)
      .set({
        gatewaySubscriptionId: typeof preapproval.id === 'string' ? preapproval.id : null,
        updatedAt: new Date(),
      })
      .where(eq(guideSubscriptions.id, subscription.id));

    return NextResponse.json({ initPoint: preapproval.init_point }, { status: 200 });
  } catch (error) {
    console.error('[GUIDE_SUBSCRIPTION] Falha ao criar assinatura:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json({ error: 'subscription_checkout_failed', message: 'Não foi possível iniciar a assinatura. Tente novamente.' }, { status: 502 });
  }
}
