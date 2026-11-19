'use server';

import { revalidatePath } from 'next/cache';
import { eq, or } from 'drizzle-orm';
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

  const fullName = String(formData.get('fullName') ?? '').trim();
  const businessName = String(formData.get('businessName') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();
  const state = String(formData.get('state') ?? '').trim().toUpperCase();
  const bio = String(formData.get('bio') ?? '').trim();
  const [existingProfile] = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(or(eq(userProfiles.id, user.id), eq(userProfiles.email, user.email)))
    .limit(1);

  const values = {
    email: user.email,
    fullName,
    businessName: businessName || null,
    city: city || null,
    state: state || null,
    bio: bio || null,
  };

  if (existingProfile) {
    await db.update(userProfiles).set(values).where(eq(userProfiles.id, existingProfile.id));
  } else {
    await db.insert(userProfiles).values({
      id: user.id,
      ...values,
      role: formData.get('profileRole') === 'luthier' ? 'luthier' : 'user',
    });
  }

  revalidatePath('/perfil');
}