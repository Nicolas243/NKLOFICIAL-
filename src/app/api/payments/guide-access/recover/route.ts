import { z } from 'zod';
import { and, eq, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { guidePurchases, guideSubscriptions } from '@/db/schema';
import { createGuestAccessToken, hashGuestAccessToken } from '@/lib/guest-checkout';
import {
  EmailDeliveryError,
  MissingEmailDeliveryConfigurationError,
  sendGuestAccessRecoveryEmail,
} from '@/lib/email/resend';

const requestSchema = z.object({
  email: z.string().trim().email().max(320),
});

const GENERIC_RESPONSE = {
  message: 'Se houver um acesso aprovado para este e-mail, enviaremos um novo link em instantes.',
};

function genericResponse(): NextResponse {
  return NextResponse.json(GENERIC_RESPONSE, { status: 202 });
}

export async function POST(request: Request): Promise<NextResponse> {
  let email: string;
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return genericResponse();
    email = parsed.data.email.toLowerCase();
  } catch {
    return genericResponse();
  }

  const now = new Date();
  const [purchase] = await db.select({
    id: guidePurchases.id,
    guestEmail: guidePurchases.guestEmail,
    email: guidePurchases.email,
  }).from(guidePurchases).where(and(
    eq(guidePurchases.status, 'approved'),
    or(eq(guidePurchases.guestEmail, email), eq(guidePurchases.email, email)),
  )).orderBy(guidePurchases.createdAt).limit(1);
  const [subscription] = purchase ? [] : await db.select({
    id: guideSubscriptions.id,
    guestEmail: guideSubscriptions.guestEmail,
    email: guideSubscriptions.email,
  }).from(guideSubscriptions).where(and(
    eq(guideSubscriptions.status, 'active'),
    or(eq(guideSubscriptions.guestEmail, email), eq(guideSubscriptions.email, email)),
  )).orderBy(guideSubscriptions.createdAt).limit(1);

  const access = purchase ? { kind: 'purchase' as const, ...purchase } : subscription
    ? { kind: 'subscription' as const, ...subscription }
    : null;
  if (!access) return genericResponse();

  const token = createGuestAccessToken(now);
  const table = access.kind === 'purchase' ? guidePurchases : guideSubscriptions;
  await db.update(table).set({
    guestAccessTokenHash: token.tokenHash,
    guestAccessTokenExpiresAt: token.expiresAt,
    guestAccessTokenConsumedAt: null,
    updatedAt: now,
  }).where(eq(table.id, access.id));

  const accessUrl = new URL('/guias/renda-extra/sucesso', request.url);
  accessUrl.searchParams.set('reference', `${access.kind === 'purchase' ? 'guide_purchase' : 'guide_subscription'}:${access.id}`);
  accessUrl.searchParams.set('guest_access_token', token.token);

  try {
    await sendGuestAccessRecoveryEmail({
      recipientEmail: access.guestEmail ?? access.email ?? email,
      accessUrl: accessUrl.toString(),
    });
  } catch (error) {
    console.error(
      '[GUIDE_RECOVERY] Falha ao enviar recuperação:',
      error instanceof MissingEmailDeliveryConfigurationError || error instanceof EmailDeliveryError
        ? error.code
        : 'erro desconhecido',
    );
    return NextResponse.json(
      { message: 'Não foi possível enviar o link agora. Tente novamente mais tarde.' },
      { status: 503 },
    );
  }

  return genericResponse();
}
