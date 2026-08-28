'use server';

import { revalidatePath } from 'next/cache';
import { and, desc, eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import {
  favoriteStrings,
  favoriteLuthiers,
  stringsCatalog,
  userProfiles,
  businessDirectory,
} from '@/db/schema';
import { isUuid } from '@/lib/uuid';

/**
 * Inversão: um usuário autenticado pode ainda não ter linha em `user_profiles`
 * (ela só nasce ao salvar o perfil de luthier). Sem este guard, o insert de
 * favorito violaria a FK e derrubaria a ação com erro de banco.
 */
async function ensureProfile(userId: string, email: string | undefined): Promise<void> {
  const [profile] = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(eq(userProfiles.id, userId))
    .limit(1);

  if (profile) return;

  if (!email) {
    throw new Error('Perfil de usuário ausente. Complete seu cadastro primeiro.');
  }

  await db
    .insert(userProfiles)
    .values({ id: userId, email, role: 'user' })
    .onConflictDoNothing();
}

async function requireSession(): Promise<{ userId: string; email: string | undefined }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error('Sessão inválida. Faça login para gerenciar favoritos.');
  }

  return { userId: user.id, email: user.email };
}

export async function toggleFavoriteString(stringId: string): Promise<void> {
  const { userId, email } = await requireSession();

  if (!isUuid(stringId)) {
    throw new Error('Corda inválida.');
  }

  const [existing] = await db
    .select({ userId: favoriteStrings.userId })
    .from(favoriteStrings)
    .where(
      and(eq(favoriteStrings.userId, userId), eq(favoriteStrings.stringId, stringId))
    )
    .limit(1);

  if (existing) {
    await db
      .delete(favoriteStrings)
      .where(
        and(eq(favoriteStrings.userId, userId), eq(favoriteStrings.stringId, stringId))
      );
  } else {
    await ensureProfile(userId, email);
    await db
      .insert(favoriteStrings)
      .values({ userId, stringId })
      .onConflictDoNothing();
  }

  revalidatePath(`/catalogo/${stringId}`);
  revalidatePath('/meu-setup');
}

export async function toggleFavoriteLuthier(luthierId: string): Promise<void> {
  const { userId, email } = await requireSession();

  if (!isUuid(luthierId)) {
    throw new Error('Luthier inválido.');
  }

  const [existing] = await db
    .select({ userId: favoriteLuthiers.userId })
    .from(favoriteLuthiers)
    .where(
      and(eq(favoriteLuthiers.userId, userId), eq(favoriteLuthiers.luthierId, luthierId))
    )
    .limit(1);

  if (existing) {
    await db
      .delete(favoriteLuthiers)
      .where(
        and(eq(favoriteLuthiers.userId, userId), eq(favoriteLuthiers.luthierId, luthierId))
      );
  } else {
    await ensureProfile(userId, email);
    await db
      .insert(favoriteLuthiers)
      .values({ userId, luthierId })
      .onConflictDoNothing();
  }

  revalidatePath(`/luthiers/${luthierId}`);
  revalidatePath('/meu-setup');
}

export async function isStringFavorite(
  userId: string,
  stringId: string
): Promise<boolean> {
  if (!isUuid(userId) || !isUuid(stringId)) return false;

  const [row] = await db
    .select({ userId: favoriteStrings.userId })
    .from(favoriteStrings)
    .where(
      and(eq(favoriteStrings.userId, userId), eq(favoriteStrings.stringId, stringId))
    )
    .limit(1);

  return row !== undefined;
}

export async function isLuthierFavorite(
  userId: string,
  luthierId: string
): Promise<boolean> {
  if (!isUuid(userId) || !isUuid(luthierId)) return false;

  const [row] = await db
    .select({ userId: favoriteLuthiers.userId })
    .from(favoriteLuthiers)
    .where(
      and(eq(favoriteLuthiers.userId, userId), eq(favoriteLuthiers.luthierId, luthierId))
    )
    .limit(1);

  return row !== undefined;
}

export type FavoriteStringItem = {
  id: string;
  name: string;
  qualityLevel: string | null;
  realPrice: string | null;
  communityScore: string | null;
  savedAt: Date;
};

export async function getFavoriteStrings(userId: string): Promise<FavoriteStringItem[]> {
  if (!isUuid(userId)) return [];

  const rows = await db
    .select({
      id: stringsCatalog.id,
      name: stringsCatalog.name,
      qualityLevel: stringsCatalog.qualityLevel,
      realPrice: stringsCatalog.realPrice,
      communityScore: stringsCatalog.communityScore,
      savedAt: favoriteStrings.createdAt,
    })
    .from(favoriteStrings)
    .leftJoin(stringsCatalog, eq(stringsCatalog.id, favoriteStrings.stringId))
    .where(eq(favoriteStrings.userId, userId))
    .orderBy(desc(favoriteStrings.createdAt));

  return rows.map((row) => ({
    id: row.id ?? '',
    name: row.name ?? 'Corda indisponível',
    qualityLevel: row.qualityLevel,
    realPrice: row.realPrice,
    communityScore: row.communityScore,
    savedAt: row.savedAt,
  }));
}

export type FavoriteLuthierItem = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  planType: string | null;
  whatsapp: string | null;
  savedAt: Date;
};

export async function getFavoriteLuthiers(userId: string): Promise<FavoriteLuthierItem[]> {
  if (!isUuid(userId)) return [];

  const rows = await db
    .select({
      id: userProfiles.id,
      fullName: userProfiles.fullName,
      profileBusinessName: userProfiles.businessName,
      profileCity: userProfiles.city,
      profileState: userProfiles.state,
      businessName: businessDirectory.businessName,
      businessCity: businessDirectory.city,
      businessState: businessDirectory.state,
      planType: businessDirectory.planType,
      whatsapp: businessDirectory.whatsapp,
      savedAt: favoriteLuthiers.createdAt,
    })
    .from(favoriteLuthiers)
    .leftJoin(userProfiles, eq(userProfiles.id, favoriteLuthiers.luthierId))
    .leftJoin(businessDirectory, eq(businessDirectory.userId, favoriteLuthiers.luthierId))
    .where(eq(favoriteLuthiers.userId, userId))
    .orderBy(desc(favoriteLuthiers.createdAt));

  return rows.map((row) => ({
    id: row.id ?? '',
    name: row.businessName ?? row.profileBusinessName ?? row.fullName ?? 'Profissional',
    city: row.businessCity ?? row.profileCity,
    state: row.businessState ?? row.profileState,
    planType: row.planType,
    whatsapp: row.whatsapp,
    savedAt: row.savedAt,
  }));
}