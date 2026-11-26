import assert from 'node:assert/strict';
import test from 'node:test';
import { assertLiveProductionSafety, parseEnvFile } from './migrate-stripe-account.mjs';

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
