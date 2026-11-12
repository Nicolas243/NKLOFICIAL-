import { timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { guidePurchases, guideSubscriptions } from '@/db/schema';
import {
  GUEST_ACCESS_COOKIE_NAME,
  hashGuestAccessToken,
  isGuestAccessTokenValid,
} from '@/lib/guest-checkout';
import { resolveGuestGuideStatus } from '@/lib/guest-guide-status';
import { getStripeReference } from '@/lib/stripe/webhook-helpers';

const ACCESS_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

function hasMatchingToken(token: string, tokenHash: string | null, expiresAt: Date | null): boolean {
  if (!tokenHash || !expiresAt || !isGuestAccessTokenValid(expiresAt)) return false;
  const actualHash = Buffer.from(hashGuestAccessToken(token), 'hex');
  const expectedHash = Buffer.from(tokenHash, 'hex');
  return actualHash.length === expectedHash.length && timingSafeEqual(actualHash, expectedHash);
}

function invalidAccessResponse(): NextResponse {
  return NextResponse.json({ error: 'access_not_found', message: 'Não foi possível confirmar este acesso.' }, { status: 404 });
}

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const rawReference = url.searchParams.get('reference');
  const reference = rawReference ? getStripeReference({ reference: rawReference }) : null;
  if (!reference || !['guide_purchase', 'guide_subscription'].includes(reference.type)) {
    return invalidAccessResponse();
  }

  const cookieStore = await cookies();
  const queryToken = url.searchParams.get('guest_access_token');
  const cookieToken = cookieStore.get(GUEST_ACCESS_COOKIE_NAME)?.value;
  const token = queryToken ?? cookieToken;
  if (!token) return invalidAccessResponse();

  if (reference.type === 'guide_purchase') {
    const [purchase] = await db.select({
      status: guidePurchases.status,
      guestAccessTokenHash: guidePurchases.guestAccessTokenHash,
      guestAccessTokenExpiresAt: guidePurchases.guestAccessTokenExpiresAt,
      downloadCount: guidePurchases.downloadCount,
      maxDownloads: guidePurchases.maxDownloads,
    }).from(guidePurchases).where(eq(guidePurchases.id, reference.id)).limit(1);
    if (!purchase || !hasMatchingToken(token, purchase.guestAccessTokenHash, purchase.guestAccessTokenExpiresAt)) {
      return invalidAccessResponse();
    }

    const response = NextResponse.json({
      status: resolveGuestGuideStatus('purchase', purchase.status),
      remainingDownloads: Math.max(purchase.maxDownloads - purchase.downloadCount, 0),
    });
    response.cookies.set({
      name: GUEST_ACCESS_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ACCESS_COOKIE_MAX_AGE_SECONDS,
    });
    return response;
  }

  const [subscription] = await db.select({
    status: guideSubscriptions.status,
    guestAccessTokenHash: guideSubscriptions.guestAccessTokenHash,
    guestAccessTokenExpiresAt: guideSubscriptions.guestAccessTokenExpiresAt,
    downloadCount: guideSubscriptions.downloadCount,
    maxDownloads: guideSubscriptions.maxDownloads,
  }).from(guideSubscriptions).where(eq(guideSubscriptions.id, reference.id)).limit(1);
  if (!subscription || !hasMatchingToken(token, subscription.guestAccessTokenHash, subscription.guestAccessTokenExpiresAt)) {
    return invalidAccessResponse();
  }

  const response = NextResponse.json({
    status: resolveGuestGuideStatus('subscription', subscription.status),
    remainingDownloads: Math.max(subscription.maxDownloads - subscription.downloadCount, 0),
  });
  response.cookies.set({
    name: GUEST_ACCESS_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}
