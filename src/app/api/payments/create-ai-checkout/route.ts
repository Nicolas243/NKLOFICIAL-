import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getAiOfferCheckoutMode,
  getAiOfferClientReferenceId,
  getAiOfferPriceCents,
  getAiOfferStripePriceId,
  getAiOfferTitle,
} from '@/lib/ai-product';
import { absoluteSiteUrl } from '@/lib/site';
import { getStripeApiKey } from '@/lib/stripe/config';
import { getStripeClient } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';

const checkoutRequestSchema = z.object({
  plan: z.enum(['one_time', 'subscription']),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'auth_required', message: 'Entre na sua conta para continuar.' },
        { status: 401 },
      );
    }

    const body: unknown = await request.json().catch(() => null);
    const parsed = checkoutRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'invalid_ai_checkout_request', message: 'Plano de checkout inválido.' },
        { status: 400 },
      );
    }

    const { plan } = parsed.data;
    const stripeApiKey = getStripeApiKey({
      STRIPE_API_KEY: process.env.STRIPE_API_KEY,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    });
    const priceId = getAiOfferStripePriceId(plan, process.env);

    if (!stripeApiKey || !priceId) {
      return NextResponse.json(
        {
          error: 'ai_checkout_not_configured',
          message: 'Checkout de IA na Prática aguardando configuração do Stripe.',
        },
        { status: 503 },
      );
    }

    const mode = getAiOfferCheckoutMode(plan);
    const clientReferenceId = getAiOfferClientReferenceId(plan, user.id);
    const priceCents = getAiOfferPriceCents(plan);
    const offerTitle = getAiOfferTitle(plan);
    const metadata = {
      product: 'ia-na-pratica',
      plan,
      userId: user.id,
      reference: clientReferenceId,
      expectedPriceCents: String(priceCents),
      title: offerTitle,
    };

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode,
      client_reference_id: clientReferenceId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata,
      ...(mode === 'subscription' ? { subscription_data: { metadata } } : {}),
      ...(user.email ? { customer_email: user.email } : {}),
      success_url: absoluteSiteUrl('/ia/curso?checkout=success'),
      cancel_url: absoluteSiteUrl('/ia/oferta?checkout=cancelled'),
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'checkout_url_missing', message: 'O Stripe não retornou uma URL válida de checkout.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    console.error(
      '[AI_CHECKOUT] Falha ao criar sessão de checkout:',
      error instanceof Error ? error.message : 'erro desconhecido',
    );
    return NextResponse.json(
      { error: 'ai_checkout_failed', message: 'Não foi possível iniciar o checkout no momento.' },
      { status: 502 },
    );
  }
}
