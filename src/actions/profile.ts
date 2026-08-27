'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';

export async function upsertLuthierProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    throw new Error('Sessão inválida. Faça login novamente.');
  }

  const fullName = formData.get('fullName') as string;
  const businessName = formData.get('businessName') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;

  await db
    .insert(userProfiles)
    .values({
      id: user.id,
      email: user.email,
      role: 'luthier',
      fullName,
      businessName,
      city,
      state,
    })
    .onConflictDoUpdate({
      target: userProfiles.email,
      set: {
        fullName,
        businessName,
        city,
        state,
        role: 'luthier',
      },
    });

  revalidatePath('/perfil');
}