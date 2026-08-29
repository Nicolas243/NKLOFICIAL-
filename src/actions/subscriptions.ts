'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export type CheckoutResult = {
  ok: boolean;
  checkoutUrl: string;
  message: string;
};

/**
 * Gera a URL de checkout do plano Premium.
 *
 * NOTA DE IMPLEMENTAÇÃO (mock): Sem integração com gateway (Mercado Pago/Stripe)
 * aprovada, esta action retorna uma URL de checkout simulada. Em produção, o
 * gateway real deve ser acionado aqui — o webhook (FASE 68) é o receptor dos
 * eventos de confirmação de pagamento. Nenhuma dependência externa é injetada.
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

  return {
    ok: true,
    checkoutUrl: `/dashboard/luthier/planos?checkout=inserido&usuario=${user.id}`,
    message:
      'Checkout simulado. Em produção este link acionará o gateway de pagamento e o webhook confirmará a assinatura.',
  };
}