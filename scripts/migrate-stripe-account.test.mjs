import assert from 'node:assert/strict';
import test from 'node:test';
import { STRIPE_CATALOG_SPEC, assertLiveProductionSafety, parseEnvFile } from './migrate-stripe-account.mjs';

test('assertLiveProductionSafety blocks test keys and inactive accounts when syncing prod', () => {
  assert.throws(
    () => assertLiveProductionSafety({
      secretKey: 'sk_test_123',
      publishableKey: 'pk_live_123',
      account: { id: 'acct_1', charges_enabled: true },
      allowTestInProd: false,
    }),
    /sk_live_/,
  );

  assert.throws(
    () => assertLiveProductionSafety({
      secretKey: 'sk_live_123',
      publishableKey: 'pk_test_123',
      account: { id: 'acct_1', charges_enabled: true },
      allowTestInProd: false,
    }),
    /pk_live_/,
  );

  assert.throws(
    () => assertLiveProductionSafety({
      secretKey: 'sk_live_123',
      publishableKey: 'pk_live_123',
      account: { id: 'acct_1', charges_enabled: false },
      allowTestInProd: false,
    }),
    /charges_enabled=true/,
  );

  assert.doesNotThrow(() => assertLiveProductionSafety({
    secretKey: 'sk_live_123',
    publishableKey: 'pk_live_123',
    account: { id: 'acct_1', charges_enabled: true },
    allowTestInProd: false,
  }));
});

test('parseEnvFile parses quotes and ignores comments safely', () => {
  const parsed = parseEnvFile('# comment\nSTRIPE_SECRET_KEY="sk_test_abc"\nOTHER=\'val\'\n');
  assert.equal(parsed.STRIPE_SECRET_KEY, 'sk_test_abc');
  assert.equal(parsed.OTHER, 'val');
});

test('STRIPE_CATALOG_SPEC defines all 12 Portal NKL products and 33 integer BRL prices', () => {
  assert.equal(STRIPE_CATALOG_SPEC.length, 12);
  const priceCount = STRIPE_CATALOG_SPEC.reduce((acc, product) => acc + product.prices.length, 0);
  assert.equal(priceCount, 33);
  const seenKeys = new Set();
  for (const product of STRIPE_CATALOG_SPEC) {
    assert.ok(!seenKeys.has(product.key), `Duplicate product key: ${product.key}`);
    seenKeys.add(product.key);
    for (const price of product.prices) {
      assert.ok(Number.isInteger(price.unitAmount) && price.unitAmount > 0, `Invalid amount for ${price.priceKey}`);
      assert.ok(!seenKeys.has(price.priceKey), `Duplicate price key: ${price.priceKey}`);
      seenKeys.add(price.priceKey);
    }
  }
});
