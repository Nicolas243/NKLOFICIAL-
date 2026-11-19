'use server';

import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { adCampaigns, adInventorySlots, userProfiles } from '@/db/schema';
import { AD_INVENTORY_LOCK_ID } from '@/lib/ad-inventory';
import { getStripeClient } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';

async function requireAdmin(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) throw new Error('Sessão inválida. Faça login novamente.');

  const [profile] = await db
    .select({ role: userProfiles.role })
    .from(userProfiles)
    .where(eq(userProfiles.id, user.id))
    .limit(1);
  if (profile?.role !== 'admin') throw new Error('Acesso restrito a administradores.');
}

function getCampaignId(formData: FormData): string {
  const campaignId = formData.get('campaignId');
  if (typeof campaignId !== 'string' || !campaignId) {
    throw new Error('Campanha inválida.');
  }
  return campaignId;
}

function refreshAdSurfaces(): void {
  revalidatePath('/admin');
  revalidatePath('/anuncie');
  revalidatePath('/programas/anuncie');
  revalidatePath('/mural-de-parceiros');
  revalidatePath('/');
  revalidatePath('/programas');
  revalidatePath('/catalogo');
}

export async function approveAdCampaign(formData: FormData): Promise<void> {
  await requireAdmin();
  const campaignId = getCampaignId(formData);

  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${AD_INVENTORY_LOCK_ID})`);
    const [campaign] = await tx
      .select({
        id: adCampaigns.id,
        slotCount: adCampaigns.slotCount,
        billingStatus: adCampaigns.billingStatus,
        status: adCampaigns.status,
        assetUrl: adCampaigns.assetUrl,
      })
      .from(adCampaigns)
      .where(eq(adCampaigns.id, campaignId))
      .limit(1);

    if (!campaign || campaign.status !== 'pending_review') {
      throw new Error('Esta campanha não está aguardando aprovação.');
    }
    if (campaign.billingStatus !== 'active') {
      throw new Error('A assinatura ainda não está ativa no Stripe.');
    }
    if (!campaign.assetUrl) {
      throw new Error('O criativo ainda não foi enviado pelo anunciante.');
    }

    const availableSlots = await tx
      .select({ slotNumber: adInventorySlots.slotNumber })
      .from(adInventorySlots)
      .where(isNull(adInventorySlots.campaignId))
      .orderBy(adInventorySlots.slotNumber)
      .limit(campaign.slotCount);

    if (availableSlots.length !== campaign.slotCount) {
      throw new Error('Não há cotas livres suficientes para publicar esta campanha.');
    }

    const slotNumbers = availableSlots.map((slot) => slot.slotNumber);
    await tx
      .update(adInventorySlots)
      .set({ campaignId, updatedAt: new Date() })
      .where(inArray(adInventorySlots.slotNumber, slotNumbers));
    await tx
      .update(adCampaigns)
      .set({
        status: 'active',
        adminApprovedAt: new Date(),
        reviewNotes: null,
        reservedUntil: null,
        updatedAt: new Date(),
      })
      .where(and(eq(adCampaigns.id, campaignId), eq(adCampaigns.status, 'pending_review')));
  });

  refreshAdSurfaces();
}

export async function rejectAdCampaign(formData: FormData): Promise<void> {
  await requireAdmin();
  const campaignId = getCampaignId(formData);
  const noteValue = formData.get('reviewNotes');
  const reviewNotes = typeof noteValue === 'string' && noteValue.trim()
    ? noteValue.trim().slice(0, 1000)
    : 'Criativo ou destino reprovado na revisão editorial.';

  const [campaign] = await db
    .select({
      id: adCampaigns.id,
      stripeSubscriptionId: adCampaigns.stripeSubscriptionId,
      status: adCampaigns.status,
    })
    .from(adCampaigns)
    .where(eq(adCampaigns.id, campaignId))
    .limit(1);

  if (!campaign || campaign.status !== 'pending_review') {
    throw new Error('Esta campanha não está aguardando aprovação.');
  }

  if (campaign.stripeSubscriptionId) {
    await getStripeClient().subscriptions.cancel(campaign.stripeSubscriptionId);
  }

  await db.transaction(async (tx) => {
    await tx
      .update(adInventorySlots)
      .set({ campaignId: null, updatedAt: new Date() })
      .where(eq(adInventorySlots.campaignId, campaignId));
    await tx
      .update(adCampaigns)
      .set({
        status: 'rejected',
        billingStatus: 'canceled',
        reviewNotes,
        reservedUntil: null,
        updatedAt: new Date(),
      })
      .where(and(eq(adCampaigns.id, campaignId), eq(adCampaigns.status, 'pending_review')));
  });

  refreshAdSurfaces();
}
