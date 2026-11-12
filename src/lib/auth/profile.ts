import type { User } from '@supabase/supabase-js';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';

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
}
