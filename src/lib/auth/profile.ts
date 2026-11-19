import type { User } from '@supabase/supabase-js';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && error.code === '23505';
}

function getProviderName(user: User): string | null {
  const metadata = user.user_metadata;
  const name = metadata?.full_name ?? metadata?.name;
  return typeof name === 'string' && name.trim() ? name.trim() : null;
}

export async function upsertAuthenticatedProfile(
  user: User,
  options: { role?: string } = {}
): Promise<void> {
  const email = user.email?.trim();
  if (!email) {
    throw new Error('Usuário autenticado sem e-mail.');
  }

  const fullName = getProviderName(user);
  const values = {
    id: user.id,
    email,
    role: options.role ?? 'user',
    ...(fullName ? { fullName } : {}),
  };

  try {
    await db
      .insert(userProfiles)
      .values(values)
      .onConflictDoUpdate({
        target: userProfiles.id,
        set: {
          email,
          ...(fullName
            ? {
                fullName: sql`coalesce(nullif(${userProfiles.fullName}, ''), excluded.full_name)`,
              }
            : {}),
        },
      });
    return;
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
  }

  // Contas antigas podem ter um perfil com o mesmo e-mail, mas com um id
  // diferente. Mantemos a compatibilidade sem trocar o id de uma linha que
  // pode estar referenciada por outras tabelas.
  const [profileByEmail] = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(eq(userProfiles.email, email))
    .limit(1);

  if (!profileByEmail) throw new Error('Perfil autenticado não pôde ser sincronizado.');
  if (!fullName) return;

  await db
    .update(userProfiles)
    .set({
      fullName: sql`coalesce(nullif(${userProfiles.fullName}, ''), ${fullName})`,
    })
    .where(eq(userProfiles.id, profileByEmail.id));
}
