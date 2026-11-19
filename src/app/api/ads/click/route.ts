import { and, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { adCampaigns, adInventorySlots } from '@/db/schema';
import { safeAdDestinationUrl } from '@/lib/ad-inventory';

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const slotNumber = Number(url.searchParams.get('slot'));
  if (!Number.isInteger(slotNumber) || slotNumber < 1 || slotNumber > 10) {
    return NextResponse.redirect(new URL('/programas/anuncie', request.url));
  }

  const [slot] = await db
    .select({
      destinationUrl: adCampaigns.destinationUrl,
      campaignId: adCampaigns.id,
    })
    .from(adInventorySlots)
    .innerJoin(
      adCampaigns,
      and(
        eq(adInventorySlots.campaignId, adCampaigns.id),
        eq(adCampaigns.status, 'active'),
        eq(adCampaigns.billingStatus, 'active'),
      ),
    )
    .where(eq(adInventorySlots.slotNumber, slotNumber))
    .limit(1);

  const destinationUrl = slot ? safeAdDestinationUrl(slot.destinationUrl) : null;
  if (!destinationUrl) {
    return NextResponse.redirect(new URL('/programas/anuncie?slot=unavailable', request.url));
  }

  await db.update(adInventorySlots).set({
    clickCount: sql`${adInventorySlots.clickCount} + 1`,
    updatedAt: new Date(),
  }).where(and(
    eq(adInventorySlots.slotNumber, slotNumber),
    eq(adInventorySlots.campaignId, slot.campaignId),
  ));

  return NextResponse.redirect(destinationUrl);
}
