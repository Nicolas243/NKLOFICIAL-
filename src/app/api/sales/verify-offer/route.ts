import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
  GUIDE_COMPARE_AT_CENTS,
  GUIDE_OFFER_PROVIDER,
  GUIDE_PRICE_CENTS,
} from '@/lib/guide-offer';
import { env } from '@/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    await db.execute(sql`select 1`);
    const checkoutReady = Boolean(
      env.STRIPE_SECRET_KEY
      && env.STRIPE_WEBHOOK_SECRET
      && env.NEXT_PUBLIC_SITE_URL,
    );
    if (!checkoutReady) {
      return NextResponse.json({
        verified: false,
        message: 'A oferta está temporariamente indisponível.',
      }, { status: 503 });
    }

    return NextResponse.json({
      verified: true,
      priceCents: GUIDE_PRICE_CENTS,
      compareAtCents: GUIDE_COMPARE_AT_CENTS,
      provider: GUIDE_OFFER_PROVIDER,
    }, { status: 200 });
  } catch (error) {
    console.error('[VERIFY_OFFER] Falha ao verificar oferta:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json({
      verified: false,
      message: 'Não foi possível verificar a oferta agora.',
    }, { status: 503 });
  }
}
