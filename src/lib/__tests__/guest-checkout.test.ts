import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createGuestAccessToken,
  decryptGuestCpf,
  encryptGuestCpf,
  GUEST_ACCESS_COOKIE_NAME,
  hashGuestAccessToken,
  isGuestAccessTokenValid,
  normalizeGuestCheckoutInput,
} from '@/lib/guest-checkout';

process.env.GUEST_CHECKOUT_ENCRYPTION_KEY = 'test-guest-checkout-encryption-key';

test('normalizes valid guest checkout data and requires CPF consent', () => {
  assert.deepEqual(
    normalizeGuestCheckoutInput({
      fullName: '  Nicolas Santos  ',
      email: ' NICOLAS@EXAMPLE.COM ',
      cpf: '529.982.247-25',
      cpfConsentConfirmed: true,
      consentVersion: '2026-11-11',
    }),
    {
      fullName: 'Nicolas Santos',
      email: 'nicolas@example.com',
      cpf: '52998224725',
      cpfConsentConfirmed: true,
      consentVersion: '2026-11-11',
    },
  );
  assert.throws(
    () => normalizeGuestCheckoutInput({
      fullName: 'Nicolas Santos',
      email: 'nicolas@example.com',
      cpf: '12345678909',
      cpfConsentConfirmed: false,
      consentVersion: '2026-11-11',
    }),
    /consent/i,
  );
});

test('creates one-way guest access tokens that expire', () => {
  const access = createGuestAccessToken();
  assert.notEqual(access.token, access.tokenHash);
  assert.equal(hashGuestAccessToken(access.token), access.tokenHash);
  assert.equal(isGuestAccessTokenValid(access.expiresAt), true);
  assert.equal(
    isGuestAccessTokenValid(access.expiresAt, new Date(access.expiresAt.getTime() + 1)),
    false,
  );
});

test('encrypts and decrypts CPF without storing it as plaintext', () => {
  const encrypted = encryptGuestCpf('52998224725');
  assert.notEqual(encrypted, '52998224725');
  assert.equal(decryptGuestCpf(encrypted), '52998224725');
});

test('uses a dedicated HttpOnly guest access cookie name', () => {
  assert.equal(GUEST_ACCESS_COOKIE_NAME, 'nkl_guest_access');
});
