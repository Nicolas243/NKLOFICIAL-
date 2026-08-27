'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userProfiles, businessDirectory } from '@/db/schema';

export async function upsertBusinessData(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error('Sessão inválida. Faça login novamente.');
  }

  // Fronteira de autorização: apenas luthiers podem editar dados comerciais.
  const [profile] = await db
    .select({ role: userProfiles.role })
    .from(userProfiles)
    .where(eq(userProfiles.id, user.id))
    .limit(1);

  if (!profile || profile.role !== 'luthier') {
    throw new Error('Acesso restrito. Habilite o perfil de luthier primeiro.');
  }

  // Mitigação de nulos: campos comerciais são opcionais no cadastro.
  const businessName = trimValue(formData.get('businessName'));
  const city = trimValue(formData.get('city'));
  const state = trimValue(formData.get('state'));
  const whatsapp = trimValue(formData.get('whatsapp'));

  if (!businessName || !city || !state) {
    throw new Error('Nome do ateliê, cidade e estado são obrigatórios.');
  }

  await db
    .insert(businessDirectory)
    .values({
      userId: user.id,
      businessName,
      city,
      state,
      whatsapp: whatsapp || null,
      planType: 'free',
    })
    .onConflictDoUpdate({
      target: businessDirectory.userId,
      set: {
        businessName,
        city,
        state,
        whatsapp: whatsapp || null,
      },
    });

  revalidatePath('/dashboard/luthier');
}

function trimValue(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}