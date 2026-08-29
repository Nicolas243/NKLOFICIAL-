'use server';

import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import {
  userProfiles,
  businessDirectory,
  favoriteStrings,
  favoriteLuthiers,
  stringReviews,
  luthierReviews,
  notifications,
} from '@/db/schema';

/**
 * Portabilidade de dados (LGPD/GDPR — Art. 18): retorna um snapshot JSON de
 * todos os dados vinculados ao usuário autenticado.
 */
export async function exportUserData(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error('Sessão inválida. Faça login novamente.');
  }

  const [profileRows, favStrings, favLuthiers, sReviews, lReviews, notifs] = await Promise.all([
    db.select().from(userProfiles).where(eq(userProfiles.id, user.id)),
    db.select().from(favoriteStrings).where(eq(favoriteStrings.userId, user.id)),
    db.select().from(favoriteLuthiers).where(eq(favoriteLuthiers.userId, user.id)),
    db.select().from(stringReviews).where(eq(stringReviews.userId, user.id)),
    db.select().from(luthierReviews).where(eq(luthierReviews.userId, user.id)),
    db.select().from(notifications).where(eq(notifications.userId, user.id)),
  ]);

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      profile: profileRows[0] ?? null,
      favoriteStrings: favStrings,
      favoriteLuthiers: favLuthiers,
      stringReviews: sReviews,
      luthierReviews: lReviews,
      notifications: notifs,
    },
    null,
    2
  );
}

/**
 * Direito ao esquecimento (LGPD/GDPR — Art. 16). Sem service role disponível,
 * aplicamos anonimização lógica: o registro é preservado para não violar as
 * FKs do histórico de avaliações/leads, mas todos os campos identificáveis
 * são higienados — tanto no perfil quanto na vitrine comercial pública.
 */
export async function deleteUserAccount(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect('/login');
  }

  // 1. Anonimização do perfil (email permanece único via token do próprio id).
  await db
    .update(userProfiles)
    .set({
      email: `anon_${user.id}@anonimizado.local`,
      fullName: 'Usuário Anonimizado',
      businessName: null,
      city: null,
      state: null,
      bio: null,
    })
    .where(eq(userProfiles.id, user.id));

  // 2. Inversão: a vitrine pública (business_directory) também carrega PII —
  // anonimizar apenas o perfil deixaria nome comercial/cidade/WhatsApp órfãos.
  await db
    .update(businessDirectory)
    .set({
      businessName: 'Estabelecimento Anonimizado',
      city: 'Anonimizado',
      state: 'NA',
      whatsapp: null,
    })
    .where(eq(businessDirectory.userId, user.id));

  // 3. Favoritos de uma conta anonimizada não têm valor semântico — e a
  // exclusão de linhas filhas é segura (não há histórico a preservar aqui).
  await db.delete(favoriteStrings).where(eq(favoriteStrings.userId, user.id));
  await db.delete(favoriteLuthiers).where(eq(favoriteLuthiers.userId, user.id));

  // 4. Encerra a sessão e expulsa o usuário da plataforma.
  await supabase.auth.signOut();

  revalidatePath('/');
  redirect('/login');
}