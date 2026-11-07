import { readFile } from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { GUIDE_ASSET_BUCKET, GUIDE_ASSETS } from '../src/lib/guide-assets';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes do upload.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const assetsDirectory = path.join(process.cwd(), 'Conteudo de novembro');

async function uploadGuideAssets(): Promise<void> {
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) throw new Error(`Não foi possível listar buckets: ${bucketsError.message}`);

  if (!buckets.some((bucket) => bucket.name === GUIDE_ASSET_BUCKET)) {
    const { error } = await supabase.storage.createBucket(GUIDE_ASSET_BUCKET, { public: false });
    if (error) throw new Error(`Não foi possível criar o bucket privado: ${error.message}`);
  }

  for (const asset of GUIDE_ASSETS) {
    const content = await readFile(path.join(assetsDirectory, asset.filename));
    const { error } = await supabase.storage
      .from(GUIDE_ASSET_BUCKET)
      .upload(asset.storagePath, content, {
        contentType: asset.contentType,
        upsert: true,
      });
    if (error) throw new Error(`Não foi possível enviar ${asset.filename}: ${error.message}`);
    console.log(`Ativo enviado: ${asset.storagePath}`);
  }
}

void uploadGuideAssets().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Falha ao enviar ativos.');
  process.exitCode = 1;
});
