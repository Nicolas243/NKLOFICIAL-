import { MercadoPagoConfig, Preference } from 'mercadopago';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { guidePurchases } from '@/db/schema';
import { env } from '@/env';

const GUIDE_PRICE_CENTS = 3900;
const GUIDE_PRICE_REAIS = GUIDE_PRICE_CENTS / 100;
const GUIDE_TITLE = 'Guia Definitivo de Renda Extra NKL';
const emailSchema = z.object({
  email: z.string().trim().email(),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsedBody = emailSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'invalid_email', message: 'Informe um e-mail válido para continuar.' }, { status: 400 });
    }

    const [purchase] = await db.insert(guidePurchases).values({
      email: parsedBody.data.email,
      amountCents: GUIDE_PRICE_CENTS,
    }).returning({ id: guidePurchases.id });

    if (!purchase) {
      return NextResponse.json({ error: 'purchase_creation_failed', message: 'Não foi possível registrar a intenção de compra.' }, { status: 502 });
    }

    const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
    const checkoutUrl = `${siteUrl}/guias/renda-extra/sucesso`;
    const preference = await new Preference(new MercadoPagoConfig({
      accessToken: env.MERCADOPAGO_ACCESS_TOKEN,
    })).create({
      body: {
        items: [{
          id: 'guia-renda-extra-nkl',
          title: GUIDE_TITLE,
          unit_price: GUIDE_PRICE_REAIS,
          quantity: 1,
          currency_id: 'BRL',
        }],
        payer: { email: parsedBody.data.email },
        external_reference: purchase.id,
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

    return NextResponse.json({ preferenceId: preference.id }, { status: 200 });
  } catch (error) {
    console.error('[GUIDE_CHECKOUT] Falha ao criar preferência:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json({ error: 'checkout_creation_failed', message: 'Não foi possível iniciar o checkout. Tente novamente.' }, { status: 502 });
  }
}
