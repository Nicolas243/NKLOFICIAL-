import assert from 'node:assert/strict';
import test from 'node:test';
import { getPushConfiguration } from '../push';

test('disables push when VAPID configuration is incomplete', () => {
  assert.deepEqual(getPushConfiguration({
    publicKey: null,
    privateKey: 'private',
    subject: 'mailto:admin@example.com',
  }), {
    enabled: false,
    publicKey: null,
  });
});

test('exposes only the public key when VAPID configuration is complete', () => {
  assert.deepEqual(getPushConfiguration({
    publicKey: 'public',
    privateKey: 'private',
    subject: 'mailto:admin@example.com',
  }), {
    enabled: true,
    publicKey: 'public',
  });
});
