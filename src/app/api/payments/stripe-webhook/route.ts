import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { env } from '@/env';
import { processStripeEvent } from '@/lib/stripe/webhook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('[STRIPE_WEBHOOK] Assinatura inválida:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  try {
    await processStripeEvent(event);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[STRIPE_WEBHOOK] Falha ao processar evento:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json({ error: 'processing_failed' }, { status: 500 });
  }
}
