import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveGuestGuideStatus } from '@/lib/guest-guide-status';

test('maps one-time guide states to public guest access states', () => {
  assert.equal(resolveGuestGuideStatus('purchase', 'pending'), 'pending');
  assert.equal(resolveGuestGuideStatus('purchase', 'approved'), 'approved');
  assert.equal(resolveGuestGuideStatus('purchase', 'rejected'), 'rejected');
});

test('only active subscriptions grant guest access', () => {
  assert.equal(resolveGuestGuideStatus('subscription', 'active'), 'active');
  assert.equal(resolveGuestGuideStatus('subscription', 'past_due'), 'pending');
  assert.equal(resolveGuestGuideStatus('subscription', 'canceled'), 'rejected');
});
