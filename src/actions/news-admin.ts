'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { newsFeed, userProfiles } from '@/db/schema';
import { isUuid } from '@/lib/uuid';

const BUCKET = 'public-assets';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

async function requireAdminId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const [profile] = await db
    .select({ role: userProfiles.role })
    .from(userProfiles)
    .where(eq(userProfiles.id, user.id))
    .limit(1);

  if (!profile || profile.role !== 'admin') {
    throw new Error('Acesso negado. Apenas administradores podem executar esta ação.');
  }

  return user.id;
}

export async function publishNews(formData: FormData): Promise<void> {
  await requireAdminId();

  const title = typeof formData.get('title') === 'string' ? (formData.get('title') as string).trim() : '';
  const content = typeof formData.get('content') === 'string' ? (formData.get('content') as string).trim() : '';
  const tags = typeof formData.get('tags') === 'string' ? (formData.get('tags') as string).trim() : '';
  
  const rawImage = formData.get('image');
  const file = rawImage instanceof File ? rawImage : null;

  if (!title || !content) {
    throw new Error('Título e conteúdo são obrigatórios.');
  }

  if (!file || file.size === 0) {
    throw new Error('A imagem de capa é obrigatória.');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('O arquivo de capa deve ser uma imagem válida.');
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('A imagem de capa não pode exceder 5MB.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const safeExt = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext) ? ext : 'png';
  const objectKey = `news/${crypto.randomUUID()}.${safeExt}`;

  const supabase = await createClient();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectKey, file, { contentType: file.type });

  if (uploadError) {
    console.error('Erro no upload de notícia:', uploadError.message);
    throw new Error('Falha ao enviar a imagem para o storage.');
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(objectKey);

  const imageUrl = publicUrlData.publicUrl;

  await db.insert(newsFeed).values({
    title,
    content,
    tags: tags || null,
    imageUrl,
  });

  revalidatePath('/');
  revalidatePath('/noticias');
  revalidatePath('/admin');
}

export async function deleteNews(formData: FormData): Promise<void> {
  await requireAdminId();

  const rawNewsId = formData.get('newsId');
  const newsId = typeof rawNewsId === 'string' ? rawNewsId : '';

  if (!isUuid(newsId)) {
    throw new Error('ID de notícia inválido.');
  }

  await db.delete(newsFeed).where(eq(newsFeed.id, newsId));

  revalidatePath('/');
  revalidatePath('/noticias');
  revalidatePath('/admin');
}
