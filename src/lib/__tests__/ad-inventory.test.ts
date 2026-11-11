import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AD_BAND_COUNT,
  AD_BANDS,
  AD_MURAL_SLOTS,
  AD_MURAL_TILE_COUNT,
  AD_SLOTS_PER_BAND,
  getAdSlotLabel,
} from '../ad-inventory';

test('defines the responsive mural inventory', () => {
  assert.equal(AD_MURAL_TILE_COUNT, 40);
  assert.equal(AD_MURAL_SLOTS.length, 40);
  assert.equal(getAdSlotLabel(0), 'Mural 01');
  assert.equal(getAdSlotLabel(39), 'Mural 40');
});

test('defines three horizontal bands with ten slots each', () => {
  assert.equal(AD_BAND_COUNT, 3);
  assert.equal(AD_SLOTS_PER_BAND, 10);
  assert.equal(AD_BANDS.length, 3);
  assert.ok(AD_BANDS.every((band) => band.length === 10));
  assert.equal(AD_BANDS[0]?.[0]?.label, 'Faixa 1 · espaço 01');
});

test('keeps the preview free of external destinations and real billing values', () => {
  const slots = [...AD_MURAL_SLOTS, ...AD_BANDS.flat()];
  assert.ok(slots.every((slot) => !('href' in slot)));
  assert.ok(slots.every((slot) => !('price' in slot)));
});
