'use server';

import { db } from '@/db';
import { newsFeed, newsComments, newsLikes, userProfiles } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { and, asc, count, desc, eq } from 'drizzle-orm';
import { isUuid } from '@/lib/uuid';
import sharp from 'sharp';

function sanitize(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&(?!amp;|lt;|gt;|quot;|apos;|#39;)/g, '&amp;');
}

export async function submitNews(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Acesso negado.');

  const title = (formData.get('title') as string)?.trim() || '';
  const content = (formData.get('content') as string)?.trim() || '';
  const tags = (formData.get('tags') as string)?.trim() || '';
  const image = formData.get('image') as File;
  const author = (formData.get('author') as string)?.trim() || 'Admin-flame';

  if (!title || !content) throw new Error('Título e conteúdo são obrigatórios.');

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
    title: sanitize(title),
    content: sanitize(content),
    tags: sanitize(tags),
    imageUrl: publicUrlData.publicUrl,
    author: sanitize(author),
  });

  revalidatePath('/noticias');
}

export async function getNewsFeed() {
  // Tarefa 9 — traz o total de likes de cada notícia numa única query.
  const rows = await db
    .select({
      id: newsFeed.id,
      title: newsFeed.title,
      content: newsFeed.content,
      tags: newsFeed.tags,
      imageUrl: newsFeed.imageUrl,
      author: newsFeed.author,
      createdAt: newsFeed.createdAt,
      likesCount: count(newsLikes.userId),
    })
    .from(newsFeed)
    .leftJoin(newsLikes, eq(newsLikes.newsId, newsFeed.id))
    .groupBy(newsFeed.id)
    .orderBy(desc(newsFeed.createdAt));

  return rows.map((row) => ({
    ...row,
    likesCount: Number(row.likesCount ?? 0),
  }));
}

export async function getRecentNewsFeed(limit: number = 3) {
  const rows = await db
    .select({
      id: newsFeed.id,
      title: newsFeed.title,
      content: newsFeed.content,
      tags: newsFeed.tags,
      imageUrl: newsFeed.imageUrl,
      author: newsFeed.author,
      createdAt: newsFeed.createdAt,
      likesCount: count(newsLikes.userId),
    })
    .from(newsFeed)
    .leftJoin(newsLikes, eq(newsLikes.newsId, newsFeed.id))
    .groupBy(newsFeed.id)
    .orderBy(desc(newsFeed.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    likesCount: Number(row.likesCount ?? 0),
  }));
}

export async function getNewsComments(newsId: string): Promise<
  { id: string; authorName: string; comment: string; createdAt: Date }[]
> {
  if (!isUuid(newsId)) return [];
  return db
    .select({
      id: newsComments.id,
      authorName: newsComments.authorName,
      comment: newsComments.comment,
      createdAt: newsComments.createdAt,
    })
    .from(newsComments)
    .where(eq(newsComments.newsId, newsId))
    .orderBy(asc(newsComments.createdAt));
}

export async function submitNewsComment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error('Faça login para comentar.');

  const newsId = (formData.get('newsId') as string)?.trim() || '';
  const comment = (formData.get('comment') as string)?.trim() || '';

  if (!isUuid(newsId)) throw new Error('Notícia inválida.');
  if (comment.length < 2) throw new Error('Comentário muito curto.');
  if (comment.length > 600) throw new Error('Comentário muito longo (máx. 600 caracteres).');

  const [profile] = await db
    .select({ fullName: userProfiles.fullName })
    .from(userProfiles)
    .where(eq(userProfiles.id, user.id))
    .limit(1);

  const authorName = profile?.fullName?.trim() || user.email;

  await db.insert(newsComments).values({
    newsId,
    userId: user.id,
    authorName: sanitize(authorName),
    comment: sanitize(comment),
  });

  revalidatePath('/noticias');
}

export async function toggleNewsLike(newsId: string): Promise<void> {
  if (!isUuid(newsId)) throw new Error('Notícia inválida.');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) throw new Error('Faça login para curtir.');

  const [existing] = await db
    .select({ newsId: newsLikes.newsId })
    .from(newsLikes)
    .where(and(eq(newsLikes.newsId, newsId), eq(newsLikes.userId, user.id)))
    .limit(1);

  if (existing) {
    await db
      .delete(newsLikes)
      .where(and(eq(newsLikes.newsId, newsId), eq(newsLikes.userId, user.id)));
  } else {
    // Garante o perfil (FK user_profiles) antes do like.
    await db
      .insert(userProfiles)
      .values({ id: user.id, email: user.email ?? '', role: 'user' })
      .onConflictDoNothing();
    await db
      .insert(newsLikes)
      .values({ newsId, userId: user.id })
      .onConflictDoNothing();
  }

  revalidatePath('/noticias');
}

export async function isNewsLiked(newsId: string, userId: string): Promise<boolean> {
  if (!isUuid(newsId) || !isUuid(userId)) return false;
  const [row] = await db
    .select({ newsId: newsLikes.newsId })
    .from(newsLikes)
    .where(and(eq(newsLikes.newsId, newsId), eq(newsLikes.userId, userId)))
    .limit(1);
  return row !== undefined;
}
