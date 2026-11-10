import assert from 'node:assert/strict';
import test from 'node:test';
import { profileSyncFailurePath, safeNextPath } from '@/lib/auth/oauth';

test('allows only local next paths', () => {
  assert.equal(safeNextPath('/perfil'), '/perfil');
  assert.equal(safeNextPath('//evil.example'), '/');
  assert.equal(safeNextPath('/\\evil.example'), '/');
  assert.equal(safeNextPath('https://evil.example'), '/');
  assert.equal(safeNextPath(null), '/');
});

test('preserves the validated destination when profile sync needs a retry', () => {
  assert.equal(
    profileSyncFailurePath('/programas/utest'),
    '/login?error=profile_sync_failed&next=%2Fprogramas%2Futest',
  );
  assert.equal(
    profileSyncFailurePath('//evil.example'),
    '/login?error=profile_sync_failed&next=%2F',
  );
});
