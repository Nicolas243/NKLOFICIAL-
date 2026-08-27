'use server';

import { db } from '@/db';
import { newsFeed } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { desc } from 'drizzle-orm';
import sharp from 'sharp';

export async function submitNews(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Acesso negado.');

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const tags = formData.get('tags') as string;
  const image = formData.get('image') as File;

  if (!image || image.size === 0) throw new Error('Imagem obrigatória.');

  const buffer = await image.arrayBuffer();
  const webpBuffer = await sharp(buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const fileName = `news_${Date.now()}.webp`;

  const { error: storageError } = await supabase.storage
    .from('news-images')
    .upload(fileName, webpBuffer, {
      contentType: 'image/webp',
      cacheControl: '3600',
      upsert: false
    });

  if (storageError) throw new Error(`Falha no Storage: ${storageError.message}`);

  const { data: publicUrlData } = supabase.storage
    .from('news-images')
    .getPublicUrl(fileName);

  await db.insert(newsFeed).values({
    title,
    content,
    tags,
    imageUrl: publicUrlData.publicUrl,
  });

  revalidatePath('/noticias');
}

export async function getNewsFeed() {
  return await db.select().from(newsFeed).orderBy(desc(newsFeed.createdAt));
}

export async function getRecentNewsFeed(limit: number = 3) {
  const rows = await db
    .select()
    .from(newsFeed)
    .orderBy(desc(newsFeed.createdAt))
    .limit(limit);
  return rows;
}