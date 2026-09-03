'use server';

import { revalidatePath } from 'next/cache';
import { count, eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';

/**
 * [BOOTSTRAP SEGURO DE ADMIN]
 * Concede o papel 'admin' apenas em condições controladas:
 * 1. Se AINDA NÃO EXISTE nenhum admin na plataforma (primeiro operador), o
 *    usuário logado pode se promover — bootstrap inicial do sistema.
 * 2. Se já existe pelo menos um admin, a promoção exige o segredo
 *    `ADMIN_BOOTSTRAP_SECRET` (variável de ambiente) enviado no campo
 *    `secret` do formulário. Sem a env configurada, a promoção é negada.
 *
 * Isso elimina o vetor de escalonamento em que qualquer usuário logado
 * conseguia se auto-promover para administrador.
 */
export type PromoteState = { error?: string };

export const INITIAL_PROMOTE_STATE: PromoteState = {};

export async function promoteToAdmin(
  prevState: PromoteState,
  formData: FormData
): Promise<PromoteState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { error: 'Sessão inválida. Faça login novamente.' };
  }

  const [{ value: existingAdmins }] = await db
    .select({ value: count() })
    .from(userProfiles)
    .where(eq(userProfiles.role, 'admin'));

  if (existingAdmins > 0) {
    const bootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
    if (!bootstrapSecret) {
      return { error: 'Já existe um administrador. Peça a ele o acesso.' };
    }

    const provided = formData.get('secret');
    if (typeof provided !== 'string' || provided.trim() !== bootstrapSecret) {
      return { error: 'Segredo de administrador inválido.' };
    }
  }

  // Fronteira de integridade: o uid do Supabase é a identidade canônica.
  await db
    .insert(userProfiles)
    .values({ id: user.id, email: user.email ?? '', role: 'admin' })
    .onConflictDoUpdate({
      target: userProfiles.id,
      set: { role: 'admin' },
    });

  revalidatePath('/');
  revalidatePath('/admin');
  return {};
}