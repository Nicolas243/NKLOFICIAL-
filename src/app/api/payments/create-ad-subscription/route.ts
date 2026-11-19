import { and, eq, gt, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { adCampaigns, userProfiles } from '@/db/schema';
import { env } from '@/env';
import {
  getAdMonthlyPriceCents,
  safeAdDestinationUrl,
} from '@/lib/ad-inventory';
import { AD_CONTRACT_VERSION as CONTRACT_VERSION } from '@/lib/ad-contract';
import { createClient } from '@/lib/supabase/server';
import { createCheckoutSession } from '@/lib/stripe/checkout';

const requestSchema = z.object({
  businessName: z.string().trim().min(2).max(180),
  responsibleName: z.string().trim().min(2).max(180),
  whatsapp: z.string().trim().min(8).max(30),
  businessCategory: z.string().trim().min(2).max(80),
  offerDescription: z.string().trim().min(10).max(500),
  campaignObjective: z.string().trim().min(2).max(80),
  targetAudience: z.string().trim().max(300),
  socialUrl: z.string().trim().max(2048),
  destinationUrl: z.string().trim().max(2048),
  assetAltText: z.string().trim().min(2).max(180),
  slotCount: z.coerce.number().int().min(1).max(10),
  contractAccepted: z.literal('true'),
});

export async function POST(request: Request): Promise<NextResponse> {
  let campaignId: string | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id || !user.email) {
      return NextResponse.json(
        { error: 'auth_required', message: 'Entre na sua conta para reservar um anúncio.' },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const parsed = requestSchema.safeParse({
      businessName: formData.get('businessName'),
      responsibleName: formData.get('responsibleName'),
      whatsapp: formData.get('whatsapp'),
      businessCategory: formData.get('businessCategory'),
      offerDescription: formData.get('offerDescription'),
      campaignObjective: formData.get('campaignObjective'),
      targetAudience: formData.get('targetAudience') ?? '',
      socialUrl: formData.get('socialUrl') ?? '',
      destinationUrl: formData.get('destinationUrl'),
      assetAltText: formData.get('assetAltText'),
      slotCount: formData.get('slotCount'),
      contractAccepted: formData.get('contractAccepted'),
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'invalid_ad_request', message: 'Confira os dados do anúncio e aceite o contrato.' },
        { status: 400 },
      );
    }

    const destinationUrl = safeAdDestinationUrl(parsed.data.destinationUrl);
    if (!destinationUrl) {
      return NextResponse.json(
        { error: 'invalid_destination', message: 'Use um link http:// ou https:// válido.' },
        { status: 400 },
      );
    }

    if (parsed.data.socialUrl && !safeAdDestinationUrl(parsed.data.socialUrl)) {
      return NextResponse.json(
        { error: 'invalid_social_url', message: 'Use um perfil institucional com link http:// ou https:// válido.' },
        { status: 400 },
      );
    }

    const [profile] = await db
      .select({ email: userProfiles.email })
      .from(userProfiles)
      .where(eq(userProfiles.id, user.id))
      .limit(1);
    const contactEmail = profile?.email ?? user.email;
    const monthlyAmountCents = getAdMonthlyPriceCents();
    const reservedUntil = new Date(Date.now() + 30 * 60 * 1000);
    const reservedCampaigns = await db
      .select({ slotCount: adCampaigns.slotCount })
      .from(adCampaigns)
      .where(or(
        eq(adCampaigns.status, 'pending_review'),
        eq(adCampaigns.status, 'approved'),
        eq(adCampaigns.status, 'active'),
        and(eq(adCampaigns.status, 'pending_payment'), gt(adCampaigns.reservedUntil, new Date())),
      ));
    const reservedSlots = reservedCampaigns.reduce((sum, item) => sum + item.slotCount, 0);
    if (reservedSlots + parsed.data.slotCount > 10) {
      return NextResponse.json(
        { error: 'inventory_unavailable', message: 'Não há cotas suficientes disponíveis neste momento.' },
        { status: 409 },
      );
    }

    const [campaign] = await db.insert(adCampaigns).values({
      userId: user.id,
      businessName: parsed.data.businessName,
      contactEmail,
      responsibleName: parsed.data.responsibleName,
      whatsapp: parsed.data.whatsapp,
      businessCategory: parsed.data.businessCategory,
      offerDescription: parsed.data.offerDescription,
      campaignObjective: parsed.data.campaignObjective,
      targetAudience: parsed.data.targetAudience || null,
      socialUrl: parsed.data.socialUrl || null,
      destinationUrl,
      assetAltText: parsed.data.assetAltText,
      slotCount: parsed.data.slotCount,
      monthlyAmountCents: monthlyAmountCents * parsed.data.slotCount,
      status: 'pending_payment',
      billingStatus: 'pending',
      contractVersion: CONTRACT_VERSION,
      advertiserAcceptedAt: new Date(),
      reservedUntil,
    }).returning({ id: adCampaigns.id });
    campaignId = campaign?.id ?? null;
    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaign_creation_failed', message: 'Não foi possível registrar a campanha.' },
        { status: 502 },
      );
    }

    const session = await createCheckoutSession({
      mode: 'subscription',
      lineItems: [{
        price_data: {
          currency: 'brl',
          product_data: { name: `Anúncio Portal NKL · ${parsed.data.businessName}` },
          unit_amount: monthlyAmountCents,
          recurring: { interval: 'month' },
        },
        quantity: parsed.data.slotCount,
      }],
      metadata: {
        reference: `ad_campaign:${campaignId}`,
        contract_version: CONTRACT_VERSION,
        slot_count: String(parsed.data.slotCount),
      },
      successUrl: `${env.NEXT_PUBLIC_SITE_URL}/programas/anuncie/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${env.NEXT_PUBLIC_SITE_URL}/programas/anuncie?checkout=cancelled`,
      customerEmail: contactEmail,
      integrationIdentifier: `portal_nkl_ads_${campaignId.slice(0, 8)}`,
    });
    if (!session.url) {
      throw new Error('checkout_url_missing');
    }

    await db.update(adCampaigns).set({
      stripeCheckoutSessionId: session.id,
      updatedAt: new Date(),
    }).where(eq(adCampaigns.id, campaignId));

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    if (campaignId) {
      await db.update(adCampaigns).set({
        status: 'cancelled',
        reviewNotes: 'Checkout não concluído.',
        updatedAt: new Date(),
      }).where(eq(adCampaigns.id, campaignId)).catch((cleanupError) => {
        console.error('[AD_SUBSCRIPTION] Falha ao cancelar campanha incompleta:', cleanupError);
      });
    }
    console.error('[AD_SUBSCRIPTION] Falha ao criar checkout:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json(
      { error: 'ad_checkout_failed', message: 'Não foi possível iniciar a assinatura. Tente novamente.' },
      { status: 502 },
    );
  }
}
