import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { adCampaigns, adInventorySlots } from '@/db/schema';
import {
  AD_ASSET_MAX_BYTES,
  AD_ASSET_MIME_TYPES,
} from '@/lib/ad-inventory-config';

export {
  AD_ASSET_MAX_BYTES,
  AD_ASSET_MIME_TYPES,
  AD_BANNER_SLOT_COUNT,
  getAdPricing,
  getAdMonthlyPriceCents,
} from '@/lib/ad-inventory-config';
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

export type ActiveAdSlot = {
  slotNumber: number;
  campaignId: string | null;
  businessName: string | null;
  assetUrl: string | null;
  assetMimeType: string | null;
  assetAltText: string | null;
  destinationUrl: string | null;
};

export function formatAdPrice(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function isAllowedAdAsset(file: File): boolean {
  return AD_ASSET_MIME_TYPES.includes(file.type as (typeof AD_ASSET_MIME_TYPES)[number])
    && file.size > 0
    && file.size <= AD_ASSET_MAX_BYTES;
}

export function safeAdDestinationUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function adAssetExtension(file: File): string {
  const extensionByMime: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/webm': 'webm',
  };
  return extensionByMime[file.type] ?? 'bin';
}

export async function getActiveAdSlots(): Promise<ActiveAdSlot[]> {
  const rows = await db
    .select({
      slotNumber: adInventorySlots.slotNumber,
      campaignId: adCampaigns.id,
      businessName: adCampaigns.businessName,
      assetUrl: adCampaigns.assetUrl,
      assetMimeType: adCampaigns.assetMimeType,
      assetAltText: adCampaigns.assetAltText,
      destinationUrl: adCampaigns.destinationUrl,
    })
    .from(adInventorySlots)
    .leftJoin(
      adCampaigns,
      and(
        eq(adInventorySlots.campaignId, adCampaigns.id),
        eq(adCampaigns.status, 'active'),
        eq(adCampaigns.billingStatus, 'active'),
      ),
    )
    .orderBy(adInventorySlots.slotNumber);

  return rows;
}

export async function countReservedAdSlots(now = new Date()): Promise<number> {
  const rows = await db
    .select({ slotCount: adCampaigns.slotCount })
    .from(adCampaigns)
    .where(and(
      or(
        eq(adCampaigns.status, 'pending_review'),
        eq(adCampaigns.status, 'approved'),
        eq(adCampaigns.status, 'active'),
        and(eq(adCampaigns.status, 'pending_payment'), sql`${adCampaigns.reservedUntil} > ${now}`),
      ),
      isNull(adCampaigns.reviewNotes),
    ));

  return rows.reduce((total, row) => total + row.slotCount, 0);
}
