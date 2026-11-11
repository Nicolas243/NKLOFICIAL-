'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '@/env';
import { createCheckoutSession } from '@/lib/stripe/checkout';
import { buildPremiumCheckoutParams } from '@/lib/stripe/premium-booking';

export type CheckoutResult = {
  ok: boolean;
  checkoutUrl: string;
  message: string;
};

/**
 * Gera a URL de checkout do plano Premium no Stripe.
 */
export async function startPremiumCheckout(): Promise<CheckoutResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error('Faça login para assinar o plano Premium.');
  }

  const [profile] = await db
    .select({ role: userProfiles.role })
    .from(userProfiles)
    .where(eq(userProfiles.id, user.id))
    .limit(1);

  if (!profile || profile.role !== 'luthier') {
    throw new Error('Apenas luthiers podem assinar o plano Premium.');
  }

  const session = await createCheckoutSession(buildPremiumCheckoutParams({
    userId: user.id,
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
    priceCents: 4990,
  }));
  if (!session.url) {
    throw new Error('O Stripe não retornou um endereço de checkout válido.');
  }

  return {
    ok: true,
    checkoutUrl: session.url,
    message: 'Você será encaminhado para o checkout seguro do Stripe.',
  };
}