'use server';

import { revalidatePath } from 'next/cache';
import { eq, or } from 'drizzle-orm';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';

const ALLOWED_MUSIC_ROLES = new Set(['Músico', 'Luthier', 'Professor', 'Lojista', 'Aluno']);

const profileSchema = z.object({
  fullName: z.string().trim().max(255),
  businessName: z.string().trim().max(255),
  city: z.string().trim().max(150),
  state: z.string().trim().max(2),
  bio: z.string().trim().max(2000),
  birthDate: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: 'Data de nascimento inválida.',
    }),
  musicProfileEnabled: z.boolean(),
  incomeProfileEnabled: z.boolean(),
  instrumento: z.string().trim().max(100),
  anosExperiencia: z.number().int().min(0).max(80).nullable(),
});

function readCheckbox(formData: FormData, name: string): boolean {
  return formData.getAll(name).some((value) => value === 'on' || value === 'true');
}

function readMusicRoles(formData: FormData): string[] {
  return formData
    .getAll('papel')
    .filter((value): value is string => typeof value === 'string')
    .map((value) => (value.trim() === 'Musico' ? 'Músico' : value.trim()))
    .filter((value, index, list) => ALLOWED_MUSIC_ROLES.has(value) && list.indexOf(value) === index);
}

export async function upsertLuthierProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    throw new Error('Sessão inválida. Faça login novamente.');
  }

  const rawAnos = String(formData.get('anosExperiencia') ?? '').trim();
  const parsedAnos = rawAnos === '' ? null : Number(rawAnos);
  if (parsedAnos !== null && !Number.isInteger(parsedAnos)) {
    throw new Error('Anos de experiência deve ser um número inteiro.');
  }

  const parsed = profileSchema.parse({
    fullName: String(formData.get('fullName') ?? ''),
    businessName: String(formData.get('businessName') ?? ''),
    city: String(formData.get('city') ?? ''),
    state: String(formData.get('state') ?? '').toUpperCase(),
    bio: String(formData.get('bio') ?? ''),
    birthDate: String(formData.get('birthDate') ?? ''),
    musicProfileEnabled: readCheckbox(formData, 'musicProfileEnabled'),
    incomeProfileEnabled: readCheckbox(formData, 'incomeProfileEnabled'),
    instrumento: String(formData.get('instrumento') ?? ''),
    anosExperiencia: parsedAnos,
  });

  const [existingProfile] = await db
    .select({
      id: userProfiles.id,
      role: userProfiles.role,
      papel: userProfiles.papel,
      instrumento: userProfiles.instrumento,
      anosExperiencia: userProfiles.anosExperiencia,
      businessName: userProfiles.businessName,
    })
    .from(userProfiles)
    .where(or(eq(userProfiles.id, user.id), eq(userProfiles.email, user.email)))
    .limit(1);

  const roles = readMusicRoles(formData);
  const hasSubmittedMusicFields =
    formData.has('instrumento') || formData.has('anosExperiencia') || formData.has('papel');

  const nextPapel =
    parsed.musicProfileEnabled && hasSubmittedMusicFields
      ? roles.join(', ') || null
      : existingProfile?.papel ?? null;

  const nextRole =
    existingProfile?.role === 'admin'
      ? 'admin'
      : parsed.musicProfileEnabled && roles.includes('Luthier')
        ? 'luthier'
        : existingProfile?.role ?? (formData.get('profileRole') === 'luthier' ? 'luthier' : 'user');

  const values = {
    email: user.email,
    fullName: parsed.fullName || null,
    birthDate: parsed.birthDate || null,
    musicProfileEnabled: parsed.musicProfileEnabled,
    incomeProfileEnabled: parsed.incomeProfileEnabled,
    businessName: parsed.musicProfileEnabled
      ? (parsed.businessName || (formData.has('businessName') ? null : existingProfile?.businessName ?? null))
      : existingProfile?.businessName ?? null,
    city: parsed.city || null,
    state: parsed.state || null,
    bio: parsed.bio || null,
    ...(parsed.musicProfileEnabled && hasSubmittedMusicFields
      ? {
          papel: nextPapel,
          instrumento: parsed.instrumento || null,
          anosExperiencia: parsed.anosExperiencia ?? 0,
        }
      : {}),
  };

  if (existingProfile) {
    await db
      .update(userProfiles)
      .set({ ...values, role: nextRole })
      .where(eq(userProfiles.id, existingProfile.id));
  } else {
    await db.insert(userProfiles).values({
      id: user.id,
      ...values,
      role: nextRole,
    });
  }

  const nextContext =
    parsed.musicProfileEnabled && parsed.incomeProfileEnabled
      ? 'both'
      : parsed.musicProfileEnabled
        ? 'music'
        : 'income';

  try {
    await supabase.auth.updateUser({
      data: {
        nkl_context: nextContext,
      },
    });
  } catch (error) {
    console.error('[PROFILE] Falha ao sincronizar contexto do perfil:', error);
  }

  revalidatePath('/perfil');
  revalidatePath('/meu-setup');
  revalidatePath('/minha-conta');
}