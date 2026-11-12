import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { guideSubscriptions, userProfiles } from '@/db/schema';
import { env } from '@/env';
import {
  GUIDE_SUBSCRIPTION_PRICE_CENTS,
} from '@/lib/guide-offer';
import {
  createGuestAccessToken,
  encryptGuestCpf,
  normalizeGuestCheckoutInput,
} from '@/lib/guest-checkout';
import { parseValidatedOfferVariant } from '@/lib/offer-experiment';
import { createCheckoutSession } from '@/lib/stripe/checkout';
import { buildGuideSubscriptionCheckoutParams } from '@/lib/stripe/guide';
import { createClient } from '@/lib/supabase/server';
const SUBSCRIPTION_REFERENCE_PREFIX = 'guide_subscription:';

const requestSchema = z.object({
  offerVariant: z.string().trim().max(64).regex(/^[a-z0-9:-]+$/i).optional(),
  fullName: z.string().trim().max(160).optional(),
  email: z.string().trim().max(320).optional(),
  cpf: z.string().trim().min(11).max(18),
  cpfConsentConfirmed: z.literal(true),
  consentVersion: z.string().trim().max(40).optional(),
});
const CPF_CONSENT_VERSION = '2026-11-11';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const [profile] = user?.id
      ? await db.select({
        email: userProfiles.email,
        fullName: userProfiles.fullName,
      }).from(userProfiles).where(eq(userProfiles.id, user.id)).limit(1)
      : [];

    const body: unknown = await request.json().catch(() => ({}));
    const parsedBody = requestSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'invalid_subscription_request', message: 'Não foi possível preparar a assinatura.' }, { status: 400 });
    }
    let guestData;
    try {
      guestData = normalizeGuestCheckoutInput({
        ...parsedBody.data,
        fullName: parsedBody.data.fullName?.trim() || profile?.fullName,
        email: parsedBody.data.email?.trim() || profile?.email,
        consentVersion: parsedBody.data.consentVersion ?? CPF_CONSENT_VERSION,
      });
    } catch (error) {
      if (error instanceof z.ZodError && error.issues.some((issue) => issue.path[0] === 'cpf')) {
        return NextResponse.json({ error: 'invalid_cpf', message: 'Informe um CPF válido para personalizar seus materiais.' }, { status: 400 });
      }
      return NextResponse.json({ error: 'invalid_subscription_request', message: 'Informe nome, e-mail, CPF e consentimento para continuar.' }, { status: 400 });
    }
    const offerVariant = parsedBody.data.offerVariant
      ? parseValidatedOfferVariant(parsedBody.data.offerVariant)
      : undefined;
    if (parsedBody.data.offerVariant && !offerVariant) {
      return NextResponse.json({ error: 'invalid_subscription_request', message: 'Não foi possível preparar a assinatura.' }, { status: 400 });
    }

    const subscriptionId = crypto.randomUUID();
    const externalReference = `${SUBSCRIPTION_REFERENCE_PREFIX}${subscriptionId}`;
    const access = createGuestAccessToken();
    const usesAuthenticatedProfile = Boolean(
      user?.id
      && profile?.email
      && profile.email.toLowerCase() === guestData.email,
    );
    const [subscription] = await db.insert(guideSubscriptions).values({
      id: subscriptionId,
      externalReference,
      userId: usesAuthenticatedProfile ? user?.id ?? null : null,
      amountCents: GUIDE_SUBSCRIPTION_PRICE_CENTS,
      offerVariant: offerVariant ?? undefined,
      email: guestData.email,
      guestFullName: guestData.fullName,
      guestEmail: guestData.email,
      encryptedCpf: encryptGuestCpf(guestData.cpf),
      cpfConsentConfirmed: true,
      cpfConsentVersion: guestData.consentVersion,
      cpfConsentAt: new Date(),
      guestAccessTokenHash: access.tokenHash,
      guestAccessTokenExpiresAt: access.expiresAt,
    }).returning({ id: guideSubscriptions.id });

    if (!subscription) {
      return NextResponse.json({ error: 'subscription_creation_failed', message: 'Não foi possível registrar a assinatura.' }, { status: 502 });
    }

    const session = await createCheckoutSession(buildGuideSubscriptionCheckoutParams({
      subscriptionId: subscription.id,
      siteUrl: env.NEXT_PUBLIC_SITE_URL,
      payerEmail: guestData.email,
      offerVariant: offerVariant ?? undefined,
      guestAccessToken: access.token,
    }));

    if (!session.url) {
      return NextResponse.json({ error: 'subscription_checkout_failed', message: 'O Stripe não retornou um checkout válido.' }, { status: 502 });
    }

    return NextResponse.json({ checkoutUrl: session.url }, { status: 200 });
  } catch (error) {
    console.error('[GUIDE_SUBSCRIPTION] Falha ao criar assinatura:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json({ error: 'subscription_checkout_failed', message: 'Não foi possível iniciar a assinatura. Tente novamente.' }, { status: 502 });
  }
}
