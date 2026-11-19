'use server';

import { revalidatePath } from 'next/cache';
import { and, asc, eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { partnerPrograms, savedPartnerPrograms } from '@/db/schema';
import { getPartnerPrograms, type PartnerProgramCard } from '@/actions/partner-programs';
import { upsertAuthenticatedProfile } from '@/lib/auth/profile';

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error('Faça login para sincronizar suas oportunidades salvas.');
  }

  return user;
}

export async function getSavedPartnerProgramSlugs(): Promise<string[]> {
  const user = await getAuthenticatedUser();

  const rows = await db
    .select({ slug: partnerPrograms.slug })
    .from(savedPartnerPrograms)
    .innerJoin(partnerPrograms, eq(partnerPrograms.id, savedPartnerPrograms.programId))
    .where(eq(savedPartnerPrograms.userId, user.id))
    .orderBy(asc(savedPartnerPrograms.createdAt));

  return rows.map((row) => row.slug);
}

export async function getSavedPartnerPrograms(programs?: PartnerProgramCard[]): Promise<PartnerProgramCard[]> {
  const user = await getAuthenticatedUser();
  const rows = await db
    .select({
      slug: partnerPrograms.slug,
      savedAt: savedPartnerPrograms.createdAt,
    })
    .from(savedPartnerPrograms)
    .innerJoin(partnerPrograms, eq(partnerPrograms.id, savedPartnerPrograms.programId))
    .where(and(
      eq(savedPartnerPrograms.userId, user.id),
      eq(partnerPrograms.status, 'published'),
    ))
    .orderBy(asc(savedPartnerPrograms.createdAt));

  if (rows.length === 0) return [];

  const catalog = programs ?? await getPartnerPrograms();
  const bySlug = new Map(catalog.map((program) => [program.slug, program]));

  return rows
    .map((row) => bySlug.get(row.slug))
    .filter((program): program is PartnerProgramCard => Boolean(program));
}

export async function toggleSavedPartnerProgram(slug: string): Promise<{ saved: boolean }> {
  const user = await getAuthenticatedUser();
  const normalizedSlug = slug.trim().toLowerCase();

  if (!/^[a-z0-9][a-z0-9-]{1,119}$/u.test(normalizedSlug)) {
    throw new Error('Oportunidade inválida.');
  }

  await upsertAuthenticatedProfile(user);

  const [program] = await db
    .select({ id: partnerPrograms.id })
    .from(partnerPrograms)
    .where(and(
      eq(partnerPrograms.slug, normalizedSlug),
      eq(partnerPrograms.status, 'published'),
    ))
    .limit(1);

  if (!program) {
    throw new Error('Essa oportunidade não está mais disponível.');
  }

  const [existing] = await db
    .select({ userId: savedPartnerPrograms.userId })
    .from(savedPartnerPrograms)
    .where(and(
      eq(savedPartnerPrograms.userId, user.id),
      eq(savedPartnerPrograms.programId, program.id),
    ))
    .limit(1);

  if (existing) {
    await db
      .delete(savedPartnerPrograms)
      .where(and(
        eq(savedPartnerPrograms.userId, user.id),
        eq(savedPartnerPrograms.programId, program.id),
      ));
  } else {
    await db
      .insert(savedPartnerPrograms)
      .values({ userId: user.id, programId: program.id })
      .onConflictDoNothing();
  }

  revalidatePath('/perfil');
  revalidatePath('/programas');
  revalidatePath(`/programas/${normalizedSlug}`);

  return { saved: !existing };
}
