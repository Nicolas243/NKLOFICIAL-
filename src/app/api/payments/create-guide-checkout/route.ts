import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq, inArray, or } from 'drizzle-orm';
import { isValidProductSlug, type ProductSlug } from '@/config/products';
import { db } from '@/db';
import { guidePurchases, userProfiles } from '@/db/schema';
import { env } from '@/env';
import {
  ALL_LANGUAGE_OFFER_VARIANTS,
  ENGLISH_EBOOK_OFFER_VARIANT,
  GUIDE_PRICE_CENTS,
  calculateLanguageBundleDiscount,
  getDiscountedLanguagePriceCents,
  isComingSoonLanguageOffer,
  isLanguageEbookOffer,
} from '@/lib/guide-offer';
import {
  createGuestAccessToken,
  encryptGuestCpf,
  normalizeGuestCheckoutInput,
} from '@/lib/guest-checkout';
import { parseValidatedOfferVariant } from '@/lib/offer-experiment';
import { createCheckoutSession } from '@/lib/stripe/checkout';
import { buildGuidePurchaseCheckoutParams } from '@/lib/stripe/guide';
import { createClient } from '@/lib/supabase/server';
const checkoutSchema = z.object({
  productSlug: z.string().trim().max(80).optional(),
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
    const parsedBody = checkoutSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'invalid_checkout_request', message: 'Não foi possível preparar esta oferta.' }, { status: 400 });
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
      return NextResponse.json({ error: 'invalid_checkout_request', message: 'Informe nome, e-mail, CPF e consentimento para continuar.' }, { status: 400 });
    }
    const offerVariant = parsedBody.data.offerVariant
      ? parseValidatedOfferVariant(parsedBody.data.offerVariant)
      : undefined;
    if (parsedBody.data.offerVariant && !offerVariant) {
      return NextResponse.json({ error: 'invalid_checkout_request', message: 'Não foi possível preparar esta oferta.' }, { status: 400 });
    }
    const rawProductSlug = parsedBody.data.productSlug;
    if (rawProductSlug !== undefined && !isValidProductSlug(rawProductSlug)) {
      return NextResponse.json({ error: 'invalid_checkout_request', message: 'Não foi possível preparar esta oferta.' }, { status: 400 });
    }
    const validatedProductSlug: ProductSlug | undefined = rawProductSlug;

    if (isComingSoonLanguageOffer(offerVariant)) {
      return NextResponse.json({ error: 'coming_soon', message: 'Este guia ainda está em produção editorial.' }, { status: 409 });
    }

    const access = createGuestAccessToken();
    const usesAuthenticatedProfile = Boolean(
      user?.id
      && profile?.email
      && profile.email.toLowerCase() === guestData.email,
    );
    const isLanguageOffer =
      offerVariant === ENGLISH_EBOOK_OFFER_VARIANT || isLanguageEbookOffer(offerVariant);

    let discountPercent: 0 | 30 | 50 = 0;
    let amountCents = GUIDE_PRICE_CENTS;
    if (isLanguageOffer) {
      const ownerCondition = usesAuthenticatedProfile && user?.id
        ? or(eq(guidePurchases.userId, user.id), eq(guidePurchases.email, guestData.email))
        : eq(guidePurchases.email, guestData.email);
      const ownedRows = await db
        .select({ offerVariant: guidePurchases.offerVariant })
        .from(guidePurchases)
        .where(
          and(
            eq(guidePurchases.status, 'approved'),
            inArray(guidePurchases.offerVariant, [...ALL_LANGUAGE_OFFER_VARIANTS]),
            ownerCondition,
          ),
        );
      const distinctOwnedOthers = new Set(
        ownedRows
          .map((row) => row.offerVariant)
          .filter((variant): variant is string => Boolean(variant) && variant !== offerVariant),
      );
      discountPercent = calculateLanguageBundleDiscount(distinctOwnedOthers.size);
      amountCents = getDiscountedLanguagePriceCents(distinctOwnedOthers.size);
    }

    const [purchase] = await db.insert(guidePurchases).values({
      userId: usesAuthenticatedProfile ? user?.id ?? null : null,
      email: guestData.email,
      guestFullName: guestData.fullName,
      guestEmail: guestData.email,
      encryptedCpf: encryptGuestCpf(guestData.cpf),
      cpfConsentConfirmed: true,
      cpfConsentVersion: guestData.consentVersion,
      cpfConsentAt: new Date(),
      guestAccessTokenHash: access.tokenHash,
      guestAccessTokenExpiresAt: access.expiresAt,
      amountCents,
      offerVariant: offerVariant ?? undefined,
    }).returning({ id: guidePurchases.id });

    if (!purchase) {
      return NextResponse.json({ error: 'purchase_creation_failed', message: 'Não foi possível registrar a intenção de compra.' }, { status: 502 });
    }

    const session = await createCheckoutSession(buildGuidePurchaseCheckoutParams({
      purchaseId: purchase.id,
      siteUrl: env.NEXT_PUBLIC_SITE_URL,
      offerVariant: offerVariant ?? undefined,
      guestAccessToken: access.token,
      productSlug: validatedProductSlug,
      discountPercent,
      overrideAmountCents: amountCents,
      customerEmail: guestData.email,
    }));

    if (!session.url) {
      return NextResponse.json({ error: 'checkout_url_missing', message: 'O Stripe não retornou um endereço de checkout válido.' }, { status: 502 });
    }

    return NextResponse.json({ checkoutUrl: session.url }, { status: 200 });
  } catch (error) {
    console.error('[GUIDE_CHECKOUT] Falha ao criar preferência:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json({ error: 'checkout_creation_failed', message: 'Não foi possível iniciar o checkout. Tente novamente.' }, { status: 502 });
  }
}
