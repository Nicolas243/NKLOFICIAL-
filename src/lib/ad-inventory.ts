export const AD_MURAL_TILE_COUNT = 40;
export const AD_BAND_COUNT = 3;
export const AD_SLOTS_PER_BAND = 10;

export type AdPreviewSlot = {
  id: string;
  label: string;
};

function formatSlotNumber(index: number): string {
  return String(index + 1).padStart(2, '0');
}

export function getAdSlotLabel(index: number): string {
  return `Mural ${formatSlotNumber(index)}`;
}

export const AD_MURAL_SLOTS: AdPreviewSlot[] = Array.from(
  { length: AD_MURAL_TILE_COUNT },
  (_, index) => ({
    id: `mural-${index + 1}`,
    label: getAdSlotLabel(index),
  }),
);

export const AD_BANDS: AdPreviewSlot[][] = Array.from(
  { length: AD_BAND_COUNT },
  (_, bandIndex) => Array.from(
    { length: AD_SLOTS_PER_BAND },
    (_, slotIndex) => ({
      id: `band-${bandIndex + 1}-${slotIndex + 1}`,
      label: `Faixa ${bandIndex + 1} · espaço ${formatSlotNumber(slotIndex)}`,
    }),
  ),
);
