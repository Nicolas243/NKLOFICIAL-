import assert from 'node:assert/strict';
import test from 'node:test';

process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/portal_nkl_test';
process.env.UPSTASH_REDIS_REST_URL ??= 'https://redis.test.local';
process.env.UPSTASH_REDIS_REST_TOKEN ??= 'test-token';
process.env.DAILY_API_KEY ??= 'test-daily-key';
process.env.CRON_SECRET ??= 'test-cron-secret';
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'https://supabase.test.local';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key';

test('registers five balanced Guide CTA variants alongside the program experiment', async () => {
  const { getOfferExperimentVariants } = await import('./route');
  assert.deepEqual(getOfferExperimentVariants('guide-page-cta'), ['0', '1', '2', '3', '4']);
  assert.deepEqual(getOfferExperimentVariants('program-secondary-cta'), ['0', '1', '2']);
});

test('accepts a Guide impression and rejects an unsupported variant', async () => {
  const { validateOfferEvent } = await import('./route');
  assert.equal(validateOfferEvent({
    experiment: 'guide-page-cta',
    variant: '0',
    eventType: 'impression',
  }), true);
  assert.equal(validateOfferEvent({
    experiment: 'guide-page-cta',
    variant: '5',
    eventType: 'impression',
  }), false);
});
