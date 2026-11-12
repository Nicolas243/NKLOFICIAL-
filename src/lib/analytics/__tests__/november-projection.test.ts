import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateNovemberProjection } from '@/lib/analytics/november-projection';

const asOf = new Date('2026-11-10T12:00:00.000Z');

test('calculates the seven-day average and remaining November views', () => {
  const result = calculateNovemberProjection({
    recentDailyViews: [100, 200, 300, 400, 500, 600, 700],
    asOf,
  });

  assert.deepEqual(result, {
    currentViews: 2800,
    projectedNovember: 10800,
    averageDailyViews: 400,
    remainingDays: 20,
    source: 'recent-sample',
  });
});

test('clamps negative daily views and rounds projection values', () => {
  const result = calculateNovemberProjection({
    recentDailyViews: [-10, 0, 1, 2, 3, 4, 5],
    asOf,
  });

  assert.equal(result.currentViews, 15);
  assert.equal(result.averageDailyViews, 2);
  assert.equal(result.projectedNovember, 55);
});

test('uses configured preview values when GA4 data is unavailable', () => {
  const result = calculateNovemberProjection({
    recentDailyViews: [],
    asOf,
    configuredPreview: {
      currentViews: 140,
      averageDailyViews: 20,
    },
  });

  assert.deepEqual(result, {
    currentViews: 140,
    projectedNovember: 540,
    averageDailyViews: 20,
    remainingDays: 20,
    source: 'configured-preview',
  });
});

test('rejects a missing configured preview when no sample exists', () => {
  assert.throws(
    () => calculateNovemberProjection({ recentDailyViews: [], asOf }),
    /Projection baseline is not configured/u,
  );
});
