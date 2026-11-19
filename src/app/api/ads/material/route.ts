import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { adCampaigns } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import {
  AD_ASSET_MAX_BYTES,
  adAssetExtension,
  isAllowedAdAsset,
} from '@/lib/ad-inventory';

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ message: 'Entre na sua conta para enviar o material.' }, { status: 401 });
  }

  const formData = await request.formData();
  const campaignId = formData.get('campaignId');
  const rawAsset = formData.get('creative');
  const asset = rawAsset instanceof File ? rawAsset : null;
  if (typeof campaignId !== 'string' || !campaignId || !asset || !isAllowedAdAsset(asset) || asset.size > AD_ASSET_MAX_BYTES) {
    return NextResponse.json({ message: 'Envie um arquivo PNG, JPEG, GIF, WebP ou WebM de até 5MB.' }, { status: 400 });
  }

  const [campaign] = await db
    .select({
      id: adCampaigns.id,
      assetStoragePath: adCampaigns.assetStoragePath,
      status: adCampaigns.status,
      billingStatus: adCampaigns.billingStatus,
    })
    .from(adCampaigns)
    .where(and(eq(adCampaigns.id, campaignId), eq(adCampaigns.userId, user.id)))
    .limit(1);

  if (!campaign || campaign.billingStatus !== 'active' || !['pending_review', 'active'].includes(campaign.status)) {
    return NextResponse.json({ message: 'A assinatura ainda não foi confirmada ou esta campanha não está disponível para envio.' }, { status: 409 });
  }

  const storagePath = `ads/${user.id}/${campaignId}.${adAssetExtension(asset)}`;
  const { error: uploadError } = await supabase.storage
    .from('public-assets')
    .upload(storagePath, asset, { contentType: asset.type, upsert: true });
  if (uploadError) {
    console.error('[AD_MATERIAL] Falha no upload:', uploadError.message);
    return NextResponse.json({ message: 'Não foi possível armazenar o material.' }, { status: 502 });
  }

  if (campaign.assetStoragePath && campaign.assetStoragePath !== storagePath) {
    const { error: removeError } = await supabase.storage.from('public-assets').remove([campaign.assetStoragePath]);
    if (removeError) console.error('[AD_MATERIAL] Falha ao remover material anterior:', removeError.message);
  }

  const { data: publicUrlData } = supabase.storage.from('public-assets').getPublicUrl(storagePath);
  await db.update(adCampaigns).set({
    assetUrl: publicUrlData.publicUrl,
    assetStoragePath: storagePath,
    assetMimeType: asset.type,
    reviewNotes: null,
    updatedAt: new Date(),
  }).where(eq(adCampaigns.id, campaignId));

  return NextResponse.json({ ok: true });
}
