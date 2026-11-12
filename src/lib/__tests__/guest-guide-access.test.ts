import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canConsumeGuestAssetAttempt,
  getGuestAccessKey,
  getGuestAssetRemainingAttempts,
} from '@/lib/guest-guide-access';
import {
  createGuestAccessToken,
  hasMatchingGuestAccessToken,
} from '@/lib/guest-checkout';

test('keeps guest download attempts independent per access and asset', () => {
  assert.equal(getGuestAccessKey('purchase', 'purchase-id'), 'purchase:purchase-id');
  assert.equal(getGuestAccessKey('subscription', 'subscription-id'), 'subscription:subscription-id');
  assert.equal(getGuestAssetRemainingAttempts(0), 2);
  assert.equal(getGuestAssetRemainingAttempts(1), 1);
  assert.equal(getGuestAssetRemainingAttempts(2), 0);
  assert.equal(canConsumeGuestAssetAttempt(0), true);
  assert.equal(canConsumeGuestAssetAttempt(1), true);
  assert.equal(canConsumeGuestAssetAttempt(2), false);
});

test('accepts only a matching, unexpired guest token', () => {
  const now = new Date('2026-11-11T12:00:00.000Z');
  const access = createGuestAccessToken(now);

  assert.equal(hasMatchingGuestAccessToken(access.token, access.tokenHash, access.expiresAt, now), true);
  assert.equal(hasMatchingGuestAccessToken('wrong-token', access.tokenHash, access.expiresAt, now), false);
  assert.equal(
    hasMatchingGuestAccessToken(access.token, access.tokenHash, new Date(now.getTime() - 1), now),
    false,
  );
});
