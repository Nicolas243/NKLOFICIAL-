'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';

/**
 * [UTILITÁRIO TEMPORÁRIO DE BOOTSTRAP]
 * Promove o usuário logado ao papel 'admin'. Não há fluxo de UI para isso;
 * esta action existe apenas para que um operador inicial possa conceder o papel.
 * Após o bootstrap inicial, remover/expor via variável de ambiente é recomendável.
 */
export async function promoteToAdmin(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error('Sessão inválida. Faça login novamente.');
  }

  await db
    .update(userProfiles)
    .set({ role: 'admin' })
    .where(eq(userProfiles.id, user.id));

  // Força a linha existir caso o perfil ainda não tenha sido criado, com role admin.
  await db
    .insert(userProfiles)
    .values({ id: user.id, email: user.email ?? '', role: 'admin' })
    .onConflictDoUpdate({ target: userProfiles.id, set: { role: 'admin' } });

  revalidatePath('/');
  revalidatePath('/admin');
}