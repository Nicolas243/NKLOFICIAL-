import type { User } from '@supabase/supabase-js';

type ProfileUpserter = (user: User) => Promise<void>;

export type ProfileSyncResult =
  | { ok: true }
  | { ok: false; message: string };

export async function syncAuthenticatedProfile(
  user: User,
  upserter?: ProfileUpserter,
): Promise<ProfileSyncResult> {
  try {
    const syncProfile = upserter
      ?? (await import('@/lib/auth/profile')).upsertAuthenticatedProfile;
    await syncProfile(user);
    return { ok: true };
  } catch (error) {
    console.error(
      '[AUTH] Falha ao sincronizar perfil:',
      error instanceof Error ? error.name : 'erro desconhecido',
    );
    return {
      ok: false,
      message: 'Não foi possível sincronizar seu perfil. Tente novamente.',
    };
  }
}
