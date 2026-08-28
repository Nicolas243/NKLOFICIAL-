'use server';

import { revalidatePath } from 'next/cache';
import { and, desc, eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import {
  stringReviews,
  luthierReviews,
  stringsCatalog,
  userProfiles,
  businessDirectory,
} from '@/db/schema';

export type UserActivityItem = {
  id: string;
  type: 'string' | 'luthier';
  targetName: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
};

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error('Sessão inválida. Faça login para gerenciar suas avaliações.');
  }

  return user.id;
}

export async function getUserReviews(): Promise<UserActivityItem[]> {
  const userId = await requireUserId();

  const [stringRows, luthierRows] = await Promise.all([
    db
      .select({
        id: stringReviews.id,
        rating: stringReviews.rating,
        comment: stringReviews.comment,
        createdAt: stringReviews.createdAt,
        stringName: stringsCatalog.name,
      })
      .from(stringReviews)
      .leftJoin(stringsCatalog, eq(stringsCatalog.id, stringReviews.stringId))
      .where(eq(stringReviews.userId, userId))
      .orderBy(desc(stringReviews.createdAt)),
    db
      .select({
        id: luthierReviews.id,
        rating: luthierReviews.rating,
        comment: luthierReviews.comment,
        createdAt: luthierReviews.createdAt,
        fullName: userProfiles.fullName,
        businessName: businessDirectory.businessName,
      })
      .from(luthierReviews)
      .leftJoin(userProfiles, eq(userProfiles.id, luthierReviews.luthierId))
      .leftJoin(
        businessDirectory,
        eq(businessDirectory.userId, luthierReviews.luthierId)
      )
      .where(eq(luthierReviews.userId, userId))
      .orderBy(desc(luthierReviews.createdAt)),
  ]);

  const stringItems: UserActivityItem[] = stringRows.map((row) => ({
    id: row.id,
    type: 'string',
    targetName: row.stringName ?? 'Corda removida',
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt,
  }));

  const luthierItems: UserActivityItem[] = luthierRows.map((row) => ({
    id: row.id,
    type: 'luthier',
    targetName: row.businessName ?? row.fullName ?? 'Profissional',
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt,
  }));

  // Ordena a união pelo mais recente.
  return [...stringItems, ...luthierItems].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

export async function deleteReview(formData: FormData): Promise<void> {
  const userId = await requireUserId();

  const rawId = formData.get('reviewId');
  const rawType = formData.get('type');
  const reviewId = typeof rawId === 'string' ? rawId : '';
  const type = rawType === 'luthier' ? 'luthier' : 'string';

  // Garantia de propriedade: o userId da sessão precisa bater com o autor
  // da avaliação antes de qualquer deleção (anti-escalação/anti-manipulação).
  if (type === 'string') {
    await db
      .delete(stringReviews)
      .where(
        and(eq(stringReviews.id, reviewId), eq(stringReviews.userId, userId))
      );
    revalidatePath('/perfil/avaliacoes');
    revalidatePath('/catalogo');
  } else if (type === 'luthier') {
    await db
      .delete(luthierReviews)
      .where(
        and(eq(luthierReviews.id, reviewId), eq(luthierReviews.userId, userId))
      );
    revalidatePath('/perfil/avaliacoes');
    revalidatePath('/luthiers');
  }
}