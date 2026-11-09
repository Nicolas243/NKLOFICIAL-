import { NextResponse } from 'next/server';
import { count, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { guideOfferEvents } from '@/db/schema';
import { enforcePublicRateLimit } from '@/lib/upstash/ratelimit';
import {
  chooseBalancedVariant,
  PROGRAM_SECONDARY_CTA_EXPERIMENT,
  PROGRAM_SECONDARY_CTA_VARIANTS,
} from '@/lib/offer-experiment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EXIT_POPUP_EXPERIMENT = 'exit-popup';
const NATIVE_CARD_EXPERIMENT = 'native-card';
const EXIT_POPUP_VARIANTS = ['0', '1', '2', '3', '4'] as const;
const NATIVE_CARD_VARIANTS = ['0', '1', '2', '3', '4', '5'] as const;
const MINIMUM_EXPOSURES_PER_VARIANT = 40;
const experimentVariants = {
  [EXIT_POPUP_EXPERIMENT]: EXIT_POPUP_VARIANTS,
  [NATIVE_CARD_EXPERIMENT]: NATIVE_CARD_VARIANTS,
  [PROGRAM_SECONDARY_CTA_EXPERIMENT]: PROGRAM_SECONDARY_CTA_VARIANTS,
} as const;

type ExperimentName = keyof typeof experimentVariants;

const eventSchema = z.object({
  experiment: z.enum([EXIT_POPUP_EXPERIMENT, NATIVE_CARD_EXPERIMENT, PROGRAM_SECONDARY_CTA_EXPERIMENT]),
  variant: z.string().regex(/^[0-9]+$/u).max(64),
  eventType: z.enum(['impression', 'click', 'checkout', 'conversion']),
}).superRefine((value, context) => {
  if (!experimentVariants[value.experiment].includes(value.variant as never)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Variante de experimento inválida.',
      path: ['variant'],
    });
  }
});

type VariantStats = {
  variant: string;
  impressions: number;
  conversions: number;
};

async function getExperimentStats(experiment: ExperimentName, variants: readonly string[]): Promise<VariantStats[]> {
  const rows = await db.select({
    variant: guideOfferEvents.variant,
    eventType: guideOfferEvents.eventType,
    total: count(),
  }).from(guideOfferEvents)
    .where(eq(guideOfferEvents.experiment, experiment))
    .groupBy(guideOfferEvents.variant, guideOfferEvents.eventType);

  return variants.map((variant) => {
    const impressionRow = rows.find((row) => row.variant === variant && row.eventType === 'impression');
    const conversionRow = rows.find((row) => row.variant === variant && row.eventType === 'conversion');
    return {
      variant,
      impressions: Number(impressionRow?.total ?? 0),
      conversions: Number(conversionRow?.total ?? 0),
    };
  });
}

function isExperimentName(value: string | null): value is ExperimentName {
  return value !== null && value in experimentVariants;
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const experimentParam = new URL(request.url).searchParams.get('experiment');
    const experiment = experimentParam === null ? EXIT_POPUP_EXPERIMENT : experimentParam;
    if (!isExperimentName(experiment)) {
      return NextResponse.json({ error: 'invalid_offer_experiment' }, { status: 400 });
    }

    const variants = experimentVariants[experiment];
    const stats = await getExperimentStats(experiment, variants);
    return NextResponse.json({
      variant: chooseBalancedVariant(stats, variants, MINIMUM_EXPOSURES_PER_VARIANT),
    }, { status: 200 });
  } catch (error) {
    console.error('[OFFER_EVENTS] Falha ao escolher variante:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json({ error: 'offer_variant_unavailable' }, { status: 503 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  let parsedBody: z.infer<typeof eventSchema>;
  try {
    const body: unknown = await request.json();
    const result = eventSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'invalid_offer_event' }, { status: 400 });
    }
    parsedBody = result.data;
  } catch {
    return NextResponse.json({ error: 'invalid_offer_event' }, { status: 400 });
  }

  try {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const identifier = forwardedFor?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
    await enforcePublicRateLimit('offer-event', identifier);

    await db.insert(guideOfferEvents).values({
      experiment: parsedBody.experiment,
      variant: parsedBody.variant,
      eventType: parsedBody.eventType,
    });
    return NextResponse.json({ received: true }, { status: 201 });
  } catch (error) {
    console.error('[OFFER_EVENTS] Falha ao registrar evento:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json({ error: 'offer_event_unavailable' }, { status: 503 });
  }
}
