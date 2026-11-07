import { MercadoPagoConfig, Preference } from 'mercadopago';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { guidePurchases } from '@/db/schema';
import { env } from '@/env';
import { GUIDE_PRICE_CENTS, GUIDE_TITLE } from '@/lib/guide-offer';
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

    const [purchase] = await db.insert(guidePurchases).values({
      amountCents: GUIDE_PRICE_CENTS,
      offerVariant: parsedBody.data.offerVariant,
    }).returning({ id: guidePurchases.id });

    if (!purchase) {
      return NextResponse.json({ error: 'purchase_creation_failed', message: 'Não foi possível registrar a intenção de compra.' }, { status: 502 });
    }

    const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
    const checkoutUrl = `${siteUrl}/guias/renda-extra/sucesso`;
    const externalReference = `guide_purchase:${purchase.id}`;
    const client = new MercadoPagoConfig({
      accessToken: env.MERCADOPAGO_ACCESS_TOKEN,
    });
    const preference = await new Preference(client).create({
      body: {
        items: [{
          id: 'guia-renda-extra-nkl',
          title: GUIDE_TITLE,
          unit_price: GUIDE_PRICE_CENTS / 100,
          quantity: 1,
          currency_id: 'BRL',
        }],
        external_reference: externalReference,
        back_urls: {
          success: checkoutUrl,
          failure: checkoutUrl,
          pending: checkoutUrl,
        },
        notification_url: `${siteUrl}/api/payments/webhook`,
        auto_return: 'approved',
      },
    });

    if (!preference.id) {
      return NextResponse.json({ error: 'preference_creation_failed', message: 'O Mercado Pago não retornou uma preferência válida.' }, { status: 502 });
    }

    if (!preference.init_point || typeof preference.init_point !== 'string') {
      return NextResponse.json({ error: 'checkout_url_missing', message: 'O Mercado Pago não retornou um endereço de checkout válido.' }, { status: 502 });
    }

    return NextResponse.json({ initPoint: preference.init_point }, { status: 200 });
  } catch (error) {
    console.error('[GUIDE_CHECKOUT] Falha ao criar preferência:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json({ error: 'checkout_creation_failed', message: 'Não foi possível iniciar o checkout. Tente novamente.' }, { status: 502 });
  }
}
