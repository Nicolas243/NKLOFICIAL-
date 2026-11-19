import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AD_BAND_COUNT,
  AD_BANDS,
  AD_MURAL_SLOTS,
  AD_MURAL_TILE_COUNT,
  AD_SLOTS_PER_BAND,
  canReserveAdSlots,
  countReservedAdSlots,
  getAdSlotLabel,
  isAdCampaignReservingSlots,
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

test('validates slot reservation eligibility and 10-slot capacity limits', () => {
  const now = new Date('2026-11-19T12:00:00Z');
  const future = new Date('2026-11-19T12:20:00Z');
  const past = new Date('2026-11-19T11:40:00Z');

  assert.equal(isAdCampaignReservingSlots({ status: 'active', slotCount: 2, reviewNotes: null }, now), true);
  assert.equal(isAdCampaignReservingSlots({ status: 'pending_review', slotCount: 1, reviewNotes: null }, now), true);
  assert.equal(isAdCampaignReservingSlots({ status: 'approved', slotCount: 1, reviewNotes: null }, now), true);
  assert.equal(isAdCampaignReservingSlots({ status: 'pending_payment', slotCount: 1, reservedUntil: future, reviewNotes: null }, now), true);
  assert.equal(isAdCampaignReservingSlots({ status: 'pending_payment', slotCount: 1, reservedUntil: past, reviewNotes: null }, now), false);
  assert.equal(isAdCampaignReservingSlots({ status: 'active', slotCount: 1, reviewNotes: 'Reprovado' }, now), false);
  assert.equal(isAdCampaignReservingSlots({ status: 'cancelled', slotCount: 1, reviewNotes: null }, now), false);

  assert.equal(canReserveAdSlots(7, 3), true);
  assert.equal(canReserveAdSlots(8, 3), false);
  assert.equal(canReserveAdSlots(10, 1), false);
  assert.equal(canReserveAdSlots(0, 0), false);
});

test('countReservedAdSlots sums slotCount from shared query executor', async () => {
  const fakeExecutor = {
    select: () => ({
      from: () => ({
        where: async () => [{ slotCount: 2 }, { slotCount: 5 }],
      }),
    }),
  } as unknown as Parameters<typeof countReservedAdSlots>[1];

  const total = await countReservedAdSlots(new Date('2026-11-19T12:00:00Z'), fakeExecutor);
  assert.equal(total, 7);
});
