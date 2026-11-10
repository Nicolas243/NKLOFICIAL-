import assert from 'node:assert/strict';
import test from 'node:test';
import type { User } from '@supabase/supabase-js';
import { syncAuthenticatedProfile } from '@/lib/auth/profile-sync';

const user = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'user@example.com',
  user_metadata: {},
} as User;

test('returns success after synchronizing an authenticated user', async () => {
  let calls = 0;

  const result = await syncAuthenticatedProfile(user, async () => {
    calls += 1;
  });

  assert.deepEqual(result, { ok: true });
  assert.equal(calls, 1);
});

test('returns a recoverable error without changing the authenticated session', async () => {
  const previousError = console.error;
  console.error = () => undefined;
  try {
    const result = await syncAuthenticatedProfile(user, async () => {
      throw new Error('database unavailable');
    });

    assert.deepEqual(result, {
      ok: false,
      message: 'Não foi possível sincronizar seu perfil. Tente novamente.',
    });
  } finally {
    console.error = previousError;
  }
});
