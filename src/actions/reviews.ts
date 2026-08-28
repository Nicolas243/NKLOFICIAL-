'use server';

import { revalidatePath } from 'next/cache';
import { desc, eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { stringReviews, userProfiles } from '@/db/schema';
import { isUuid } from '@/lib/uuid';

const RATING_MIN = 1;
const RATING_MAX = 10;

export async function submitReview(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error('Sessão inválida. Faça login para avaliar.');
  }

  const rawStringId = formData.get('stringId');
  const stringId = typeof rawStringId === 'string' ? rawStringId : '';
  const rawComment = formData.get('comment');
  const comment = typeof rawComment === 'string' ? rawComment.trim() : '';
  const rating = Number(formData.get('rating'));

  if (!isUuid(stringId)) {
    throw new Error('Corda inválida.');
  }

  if (!Number.isInteger(rating) || rating < RATING_MIN || rating > RATING_MAX) {
    throw new Error(`A nota deve ser um inteiro entre ${RATING_MIN} e ${RATING_MAX}.`);
  }

  await db
    .insert(stringReviews)
    .values({
      stringId,
      userId: user.id,
      rating,
      comment: comment || null,
    })
    .onConflictDoUpdate({
      // Mira a constraint composta: reavaliação atualiza em vez de falhar.
      target: [stringReviews.stringId, stringReviews.userId],
      set: {
        rating,
        comment: comment || null,
      },
    });

  revalidatePath(`/catalogo/${stringId}`);
}

export type StringReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  reviewerName: string;
};

export async function getReviewsByStringId(stringId: string): Promise<StringReviewItem[]> {
  // Fronteira de injeção: UUID malformado nunca deve atingir o Postgres.
  if (!isUuid(stringId)) return [];

  const rows = await db
    .select({
      id: stringReviews.id,
      rating: stringReviews.rating,
      comment: stringReviews.comment,
      createdAt: stringReviews.createdAt,
      fullName: userProfiles.fullName,
      email: userProfiles.email,
    })
    .from(stringReviews)
    .leftJoin(userProfiles, eq(userProfiles.id, stringReviews.userId))
    .where(eq(stringReviews.stringId, stringId))
    .orderBy(desc(stringReviews.createdAt));

  return rows.map((row) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt,
    reviewerName: row.fullName ?? row.email ?? 'Usuário',
  }));
}