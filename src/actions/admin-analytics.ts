'use server';

import { count, eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userProfiles, subscriptions, luthierLeads } from '@/db/schema';

export type PlatformMetrics = {
  totalUsers: number;
  activePremiumLuthiers: number;
  totalLeadsGenerated: number;
  mrr: number;
};

/** Preço base da assinatura Premium (espelha o portal de planos). */
const PREMIUM_PRICE = 49.9;

/**
 * Métricas agregadas da plataforma. Fronteira de segurança: apenas a role
 * 'admin' pode consumir estes indicadores financeiros e de crescimento.
 */
export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error('Sessão inválida. Faça login novamente.');
  }

  const [profile] = await db
    .select({ role: userProfiles.role })
    .from(userProfiles)
    .where(eq(userProfiles.id, user.id))
    .limit(1);

  if (profile?.role !== 'admin') {
    throw new Error('Acesso restrito a administradores.');
  }

  const [usersRow, premiumRow, leadsRow] = await Promise.all([
    db.select({ value: count() }).from(userProfiles),
    db.select({ value: count() }).from(subscriptions).where(eq(subscriptions.status, 'active')),
    db.select({ value: count() }).from(luthierLeads),
  ]);

  const activePremiumLuthiers = premiumRow[0]?.value ?? 0;

  return {
    totalUsers: usersRow[0]?.value ?? 0,
    activePremiumLuthiers,
    totalLeadsGenerated: leadsRow[0]?.value ?? 0,
    mrr: Number((activePremiumLuthiers * PREMIUM_PRICE).toFixed(2)),
  };
}