import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { GUIDE_ASSET_BUCKET, GUIDE_SIGNED_URL_TTL_SECONDS, type GuideAsset } from '@/lib/guide-assets';

export function getGuideStorageAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function createGuideAssetSignedUrl(asset: GuideAsset): Promise<string | null> {
  const storage = getGuideStorageAdmin();
  if (!storage) return null;

  const { data, error } = await storage.storage
    .from(GUIDE_ASSET_BUCKET)
    .createSignedUrl(asset.storagePath, GUIDE_SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) {
    console.error('[GUIDE_STORAGE] Não foi possível criar URL assinada:', error?.message ?? 'URL ausente');
    return null;
  }
  return data.signedUrl;
}

export async function downloadGuideAsset(asset: GuideAsset): Promise<Buffer | null> {
  const storage = getGuideStorageAdmin();
  if (!storage) return null;

  const { data, error } = await storage.storage
    .from(GUIDE_ASSET_BUCKET)
    .download(asset.storagePath);
  if (error || !data) {
    console.error('[GUIDE_STORAGE] Não foi possível ler o ativo:', error?.message ?? 'arquivo ausente');
    return null;
  }
  return Buffer.from(await data.arrayBuffer());
}
