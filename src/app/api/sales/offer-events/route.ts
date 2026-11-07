import { NextResponse } from 'next/server';
import { count, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { guideOfferEvents } from '@/db/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EXIT_POPUP_EXPERIMENT = 'exit-popup';
const NATIVE_CARD_EXPERIMENT = 'native-card';
const EXIT_POPUP_VARIANTS = ['0', '1', '2', '3', '4'] as const;
const MINIMUM_EXPOSURES_PER_VARIANT = 40;
const eventSchema = z.object({
  experiment: z.enum([EXIT_POPUP_EXPERIMENT, NATIVE_CARD_EXPERIMENT]),
  variant: z.string().regex(/^[0-9]+$/u).max(64),
  eventType: z.enum(['impression', 'conversion']),
});

type VariantStats = {
  variant: string;
  impressions: number;
  conversions: number;
};

async function getExitPopupStats(): Promise<VariantStats[]> {
  const rows = await db.select({
    variant: guideOfferEvents.variant,
    eventType: guideOfferEvents.eventType,
    total: count(),
  }).from(guideOfferEvents)
    .where(eq(guideOfferEvents.experiment, EXIT_POPUP_EXPERIMENT))
    .groupBy(guideOfferEvents.variant, guideOfferEvents.eventType);

  return EXIT_POPUP_VARIANTS.map((variant) => {
    const impressionRow = rows.find((row) => row.variant === variant && row.eventType === 'impression');
    const conversionRow = rows.find((row) => row.variant === variant && row.eventType === 'conversion');
    return {
      variant,
      impressions: Number(impressionRow?.total ?? 0),
      conversions: Number(conversionRow?.total ?? 0),
    };
  });
}

function chooseVariant(stats: VariantStats[]): string {
  const minimumImpressions = Math.min(...stats.map((item) => item.impressions));
  if (minimumImpressions < MINIMUM_EXPOSURES_PER_VARIANT) {
    return [...stats]
      .sort((left, right) => left.impressions - right.impressions || left.variant.localeCompare(right.variant))
      .at(0)?.variant ?? EXIT_POPUP_VARIANTS[0];
  }

  return [...stats]
    .sort((left, right) => {
      const leftRate = left.conversions / left.impressions;
      const rightRate = right.conversions / right.impressions;
      return rightRate - leftRate || right.impressions - left.impressions || left.variant.localeCompare(right.variant);
    })
    .at(0)?.variant ?? EXIT_POPUP_VARIANTS[0];
}

export async function GET(): Promise<NextResponse> {
  try {
    const stats = await getExitPopupStats();
    return NextResponse.json({ variant: chooseVariant(stats) }, { status: 200 });
  } catch (error) {
    console.error('[OFFER_EVENTS] Falha ao escolher variante:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json({ error: 'offer_variant_unavailable' }, { status: 503 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsedBody = eventSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'invalid_offer_event' }, { status: 400 });
    }

    await db.insert(guideOfferEvents).values({
      experiment: parsedBody.data.experiment,
      variant: parsedBody.data.variant,
      eventType: parsedBody.data.eventType,
    });
    return NextResponse.json({ received: true }, { status: 201 });
  } catch (error) {
    console.error('[OFFER_EVENTS] Falha ao registrar evento:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json({ error: 'offer_event_unavailable' }, { status: 503 });
  }
}
