import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { guidePurchases } from '@/db/schema';
import { env } from '@/env';
import { GUIDE_PRICE_CENTS } from '@/lib/guide-offer';
import { parseValidatedOfferVariant } from '@/lib/offer-experiment';
import { createCheckoutSession } from '@/lib/stripe/checkout';
import { buildGuidePurchaseCheckoutParams } from '@/lib/stripe/guide';
const checkoutSchema = z.object({
  offerVariant: z.string().trim().max(64).regex(/^[a-z0-9:-]+$/i).optional(),
}).default({});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json().catch(() => ({}));
    const parsedBody = checkoutSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'invalid_checkout_request', message: 'Não foi possível preparar esta oferta.' }, { status: 400 });
    }
    const offerVariant = parsedBody.data.offerVariant
      ? parseValidatedOfferVariant(parsedBody.data.offerVariant)
      : undefined;
    if (parsedBody.data.offerVariant && !offerVariant) {
      return NextResponse.json({ error: 'invalid_checkout_request', message: 'Não foi possível preparar esta oferta.' }, { status: 400 });
    }

    const [purchase] = await db.insert(guidePurchases).values({
      amountCents: GUIDE_PRICE_CENTS,
      offerVariant: offerVariant ?? undefined,
    }).returning({ id: guidePurchases.id });

    if (!purchase) {
      return NextResponse.json({ error: 'purchase_creation_failed', message: 'Não foi possível registrar a intenção de compra.' }, { status: 502 });
    }

    const session = await createCheckoutSession(buildGuidePurchaseCheckoutParams({
      purchaseId: purchase.id,
      siteUrl: env.NEXT_PUBLIC_SITE_URL,
      offerVariant: offerVariant ?? undefined,
    }));

    if (!session.url) {
      return NextResponse.json({ error: 'checkout_url_missing', message: 'O Stripe não retornou um endereço de checkout válido.' }, { status: 502 });
    }

    return NextResponse.json({ checkoutUrl: session.url }, { status: 200 });
  } catch (error) {
    console.error('[GUIDE_CHECKOUT] Falha ao criar preferência:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json({ error: 'checkout_creation_failed', message: 'Não foi possível iniciar o checkout. Tente novamente.' }, { status: 502 });
  }
}
