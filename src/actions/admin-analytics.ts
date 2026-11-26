'use server';

import { count, eq, sum } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import {
  adCampaigns,
  aiAccessGrants,
  classBookings,
  guideOfferEvents,
  guidePurchases,
  guideSubscriptions,
  luthierLeads,
  studentPlanEnrollments,
  subscriptions,
  userProfiles,
} from '@/db/schema';

export type OfferExperimentVariantSummary = {
  variant: string;
  impressions: number;
  clicks: number;
  checkouts: number;
  conversions: number;
  ctrPercent: number;
  conversionPercent: number;
};

export type OfferExperimentSummary = {
  experiment: string;
  totalImpressions: number;
  totalConversions: number;
  winningVariant: string | null;
  variants: OfferExperimentVariantSummary[];
};

export type PlatformMetrics = {
  totalUsers: number;
  activePremiumLuthiers: number;
  totalLeadsGenerated: number;
  mrr: number;
  connectedTeachers: number;
  activePlans: number;
  marketplaceGmvCents: number;
  marketplaceFeesCents: number;
  approvedGuidePurchases: number;
  guideRevenueCents: number;
  activeGuideSubscriptions: number;
  activeAiGrants: number;
  activeAdCampaigns: number;
  totalDigitalRevenueCents: number;
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

  const [
    usersRow,
    premiumRow,
    leadsRow,
    connectedTeachersRow,
    activePlansRow,
    gmvRow,
    feesRow,
    approvedGuidesRow,
    activeGuideSubsRow,
    activeAiRow,
    activeAdsRow,
  ] = await Promise.all([
    db.select({ value: count() }).from(userProfiles),
    db.select({ value: count() }).from(subscriptions).where(eq(subscriptions.status, 'active')),
    db.select({ value: count() }).from(luthierLeads),
    db.select({ value: count() }).from(userProfiles).where(eq(userProfiles.role, 'professor')),
    db.select({ value: count() }).from(studentPlanEnrollments).where(eq(studentPlanEnrollments.status, 'active')),
    db.select({ value: sum(classBookings.priceCents) }).from(classBookings).where(eq(classBookings.paymentStatus, 'paid')),
    db.select({ value: sum(classBookings.platformFeeCents) }).from(classBookings).where(eq(classBookings.paymentStatus, 'paid')),
    db.select({ total: count(), revenue: sum(guidePurchases.amountCents) }).from(guidePurchases).where(eq(guidePurchases.status, 'approved')),
    db.select({ value: count() }).from(guideSubscriptions).where(eq(guideSubscriptions.status, 'active')),
    db.select({ value: count() }).from(aiAccessGrants).where(eq(aiAccessGrants.status, 'active')),
    db.select({ value: count() }).from(adCampaigns).where(eq(adCampaigns.status, 'active')),
  ]);

  const activePremiumLuthiers = premiumRow[0]?.value ?? 0;
  const approvedGuidePurchases = approvedGuidesRow[0]?.total ?? 0;
  const guideRevenueCents = Number(approvedGuidesRow[0]?.revenue ?? 0);
  const marketplaceFeesCents = Number(feesRow[0]?.value ?? 0);

  return {
    totalUsers: usersRow[0]?.value ?? 0,
    activePremiumLuthiers,
    totalLeadsGenerated: leadsRow[0]?.value ?? 0,
    mrr: Number((activePremiumLuthiers * PREMIUM_PRICE).toFixed(2)),
    connectedTeachers: connectedTeachersRow[0]?.value ?? 0,
    activePlans: activePlansRow[0]?.value ?? 0,
    marketplaceGmvCents: Number(gmvRow[0]?.value ?? 0),
    marketplaceFeesCents,
    approvedGuidePurchases,
    guideRevenueCents,
    activeGuideSubscriptions: activeGuideSubsRow[0]?.value ?? 0,
    activeAiGrants: activeAiRow[0]?.value ?? 0,
    activeAdCampaigns: activeAdsRow[0]?.value ?? 0,
    totalDigitalRevenueCents: guideRevenueCents + marketplaceFeesCents,
  };
}

export async function getOfferExperimentSummaries(): Promise<OfferExperimentSummary[]> {
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

  const rows = await db
    .select({
      experiment: guideOfferEvents.experiment,
      variant: guideOfferEvents.variant,
      eventType: guideOfferEvents.eventType,
      total: count(),
    })
    .from(guideOfferEvents)
    .groupBy(guideOfferEvents.experiment, guideOfferEvents.variant, guideOfferEvents.eventType);

  const byExperiment = new Map<string, Map<string, OfferExperimentVariantSummary>>();

  for (const row of rows) {
    let variantsMap = byExperiment.get(row.experiment);
    if (!variantsMap) {
      variantsMap = new Map<string, OfferExperimentVariantSummary>();
      byExperiment.set(row.experiment, variantsMap);
    }
    const existing = variantsMap.get(row.variant) ?? {
      variant: row.variant,
      impressions: 0,
      clicks: 0,
      checkouts: 0,
      conversions: 0,
      ctrPercent: 0,
      conversionPercent: 0,
    };
    const total = Number(row.total ?? 0);
    if (row.eventType === 'impression') existing.impressions += total;
    if (row.eventType === 'click') existing.clicks += total;
    if (row.eventType === 'checkout') existing.checkouts += total;
    if (row.eventType === 'conversion') existing.conversions += total;
    variantsMap.set(row.variant, existing);
  }

  return Array.from(byExperiment.entries())
    .map(([experiment, variantsMap]) => {
      const variants = Array.from(variantsMap.values())
        .map((item) => ({
          ...item,
          ctrPercent: item.impressions > 0 ? Number(((item.clicks / item.impressions) * 100).toFixed(1)) : 0,
          conversionPercent: item.impressions > 0 ? Number(((item.conversions / item.impressions) * 100).toFixed(1)) : 0,
        }))
        .sort((a, b) => b.conversionPercent - a.conversionPercent || b.ctrPercent - a.ctrPercent || a.variant.localeCompare(b.variant));

      const totalImpressions = variants.reduce((sumVal, item) => sumVal + item.impressions, 0);
      const totalConversions = variants.reduce((sumVal, item) => sumVal + item.conversions, 0);

      return {
        experiment,
        totalImpressions,
        totalConversions,
        winningVariant: variants[0]?.variant ?? null,
        variants,
      };
    })
    .sort((a, b) => b.totalImpressions - a.totalImpressions);
}
