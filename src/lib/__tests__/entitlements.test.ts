import assert from 'node:assert/strict';
import test from 'node:test';
import { PAID_PRODUCT_SLUGS, type ProductSlug } from '@/config/products';
import {
  hasEntitlementInList,
  isEntitlementActiveRecord,
  isUndefinedTableError,
  type EntitlementRecord,
} from '@/lib/entitlements';
import { getStripeReference, parseClientReferenceId } from '@/lib/stripe/webhook-helpers';

const NOW = new Date('2026-11-20T12:00:00.000Z');
const USER_A = '11111111-1111-4111-8111-111111111111';
const USER_B = '22222222-2222-4222-8222-222222222222';

function makeRecord(overrides: Partial<EntitlementRecord> = {}): EntitlementRecord {
  return {
    id: 'ent-1',
    userId: USER_A,
    productSlug: 'bussola-negocios',
    status: 'active',
    orderReference: 'cs_test_123',
    grantedAt: new Date('2026-11-19T12:00:00.000Z'),
    expiresAt: null,
    ...overrides,
  };
}

test('active bussola-negocios entitlement grants only bussola-negocios and blocks all other SKUs', () => {
  const records: readonly EntitlementRecord[] = [
    makeRecord({ userId: USER_A, productSlug: 'bussola-negocios', status: 'active' }),
  ];

  assert.equal(hasEntitlementInList(records, USER_A, 'bussola-negocios', NOW), true);
  assert.equal(hasEntitlementInList(records, USER_A, 'ferramenta-ia', NOW), false);
  assert.equal(hasEntitlementInList(records, USER_A, 'pacote-idiomas-ia', NOW), false);
  assert.equal(hasEntitlementInList(records, USER_A, 'pacote-renda-extra', NOW), false);
  assert.equal(hasEntitlementInList(records, USER_A, 'ebook-ingles', NOW), false);
  assert.equal(hasEntitlementInList(records, USER_A, 'curso-ia-pratica', NOW), false);
});

test('active ferramenta-ia entitlement grants ferramenta-ia and blocks bussola-negocios and pacote-idiomas-ia', () => {
  const records: readonly EntitlementRecord[] = [
    makeRecord({ userId: USER_A, productSlug: 'ferramenta-ia', status: 'active' }),
  ];

  assert.equal(hasEntitlementInList(records, USER_A, 'ferramenta-ia', NOW), true);
  assert.equal(hasEntitlementInList(records, USER_A, 'bussola-negocios', NOW), false);
  assert.equal(hasEntitlementInList(records, USER_A, 'pacote-idiomas-ia', NOW), false);
});

test('isolates entitlements across distinct users', () => {
  const records: readonly EntitlementRecord[] = [
    makeRecord({ userId: USER_A, productSlug: 'bussola-negocios', status: 'active' }),
    makeRecord({ userId: USER_B, productSlug: 'curso-ia-pratica', status: 'active' }),
  ];

  assert.equal(hasEntitlementInList(records, USER_A, 'bussola-negocios', NOW), true);
  assert.equal(hasEntitlementInList(records, USER_B, 'bussola-negocios', NOW), false);
  assert.equal(hasEntitlementInList(records, USER_A, 'curso-ia-pratica', NOW), false);
  assert.equal(hasEntitlementInList(records, USER_B, 'curso-ia-pratica', NOW), true);
});

test('blocks revoked and expired entitlements', () => {
  const revoked = makeRecord({ status: 'revoked' });
  const expired = makeRecord({ status: 'expired' });

  assert.equal(isEntitlementActiveRecord(revoked, 'bussola-negocios', NOW), false);
  assert.equal(isEntitlementActiveRecord(expired, 'bussola-negocios', NOW), false);
  assert.equal(hasEntitlementInList([revoked, expired], USER_A, 'bussola-negocios', NOW), false);
});

test('enforces expiresAt strictly against current timestamp', () => {
  const pastExpiry = makeRecord({
    expiresAt: new Date(NOW.getTime() - 1000),
  });
  const exactExpiry = makeRecord({
    expiresAt: new Date(NOW.getTime()),
  });
  const futureExpiry = makeRecord({
    expiresAt: new Date(NOW.getTime() + 60_000),
  });

  assert.equal(isEntitlementActiveRecord(pastExpiry, 'bussola-negocios', NOW), false);
  assert.equal(isEntitlementActiveRecord(exactExpiry, 'bussola-negocios', NOW), false);
  assert.equal(isEntitlementActiveRecord(futureExpiry, 'bussola-negocios', NOW), true);
});

test('rejects empty userId and invalid product slugs', () => {
  const validRecord = makeRecord({ userId: USER_A, productSlug: 'bussola-negocios' });
  const emptyUserRecord = makeRecord({ userId: '   ', productSlug: 'bussola-negocios' });
  const invalidSlug = 'plano-global-pro' as ProductSlug;

  assert.equal(hasEntitlementInList([validRecord], '', 'bussola-negocios', NOW), false);
  assert.equal(hasEntitlementInList([validRecord], '   ', 'bussola-negocios', NOW), false);
  assert.equal(hasEntitlementInList([emptyUserRecord], '   ', 'bussola-negocios', NOW), false);
  assert.equal(hasEntitlementInList([validRecord], USER_A, invalidSlug, NOW), false);
  assert.equal(isEntitlementActiveRecord(validRecord, invalidSlug, NOW), false);
  assert.equal(isEntitlementActiveRecord(null, 'bussola-negocios', NOW), false);
});

test('grants each paid SKU independently without cross-leakage', () => {
  for (const grantedSlug of PAID_PRODUCT_SLUGS) {
    const records: readonly EntitlementRecord[] = [
      makeRecord({ userId: USER_A, productSlug: grantedSlug, status: 'active' }),
    ];

    for (const targetSlug of PAID_PRODUCT_SLUGS) {
      assert.equal(
        hasEntitlementInList(records, USER_A, targetSlug, NOW),
        targetSlug === grantedSlug,
      );
    }
  }
});

test('parses isolated product_entitlement Stripe references and rejects unknown slugs', () => {
  assert.deepEqual(
    parseClientReferenceId(`product_entitlement:${USER_A}:bussola-negocios`),
    {
      type: 'product_entitlement',
      id: USER_A,
      userId: USER_A,
      productSlug: 'bussola-negocios',
    },
  );
  assert.deepEqual(
    getStripeReference({ productSlug: 'ferramenta-ia', userId: USER_B }),
    {
      type: 'product_entitlement',
      id: USER_B,
      userId: USER_B,
      productSlug: 'ferramenta-ia',
    },
  );
  assert.equal(
    parseClientReferenceId(`product_entitlement:${USER_A}:desconhecido`),
    null,
  );
  assert.equal(
    getStripeReference({ productSlug: 'desconhecido', userId: USER_A }),
    null,
  );
});

test('detects PostgreSQL 42P01 undefined-table error directly or via cause', () => {
  assert.equal(isUndefinedTableError({ code: '42P01' }), true);
  assert.equal(isUndefinedTableError({ cause: { code: '42P01' } }), true);
  assert.equal(isUndefinedTableError({ code: '23505' }), false);
  assert.equal(isUndefinedTableError(null), false);
});
