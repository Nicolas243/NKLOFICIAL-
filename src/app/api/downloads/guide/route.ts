import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { cookies } from 'next/headers';
import { and, desc, eq, lt, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { guideDownloadAttempts, guidePurchases, guideSubscriptions, userProfiles } from '@/db/schema';
import { enforceGuideDownloadRateLimit } from '@/lib/rate-limit';
import { getGuideAsset, GUIDE_ASSET_IDS, GUIDE_DOWNLOAD_ATTEMPTS_PER_ASSET } from '@/lib/guide-assets';
import {
  decryptGuestCpf,
  GUEST_ACCESS_COOKIE_NAME,
  hashGuestAccessToken,
  hasMatchingGuestAccessToken,
} from '@/lib/guest-checkout';
import { getGuestAccessKey } from '@/lib/guest-guide-access';
import { downloadGuideAsset } from '@/lib/guide-storage';
import { personalizeGuideAsset } from '@/lib/guide-personalizer';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DOWNLOAD_LIMIT_MESSAGE = 'O limite de downloads de segurança deste acesso foi atingido.';
const INVALID_ACCESS_MESSAGE = 'Não foi possível validar este acesso.';
const requestSchema = z.object({
  assetId: z.enum(GUIDE_ASSET_IDS),
  guestAccessToken: z.string().min(20).max(200).optional(),
});

function getRequestIdentifier(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

async function readLocalGuideAsset(assetId: z.infer<typeof requestSchema>['assetId']): Promise<Buffer | null> {
  const asset = getGuideAsset(assetId);
  const candidatePaths = [
    path.join(process.cwd(), 'Conteudo de novembro', asset.filename),
    path.join(process.cwd(), asset.filename),
  ];
  for (const candidatePath of candidatePaths) {
    try {
      return await readFile(candidatePath);
    } catch {
      continue;
    }
  }
  console.error('[GUIDE_DOWNLOAD] Ativo local indisponível.');
  return null;
}

async function readGuideSource(assetId: z.infer<typeof requestSchema>['assetId']): Promise<Buffer | null> {
  const asset = getGuideAsset(assetId);
  const stored = await downloadGuideAsset(asset);
  if (stored) return stored;
  if (process.env.NODE_ENV === 'production') return null;
  return readLocalGuideAsset(assetId);
}

export async function POST(request: Request): Promise<NextResponse> {
  let parsedBody: z.infer<typeof requestSchema>;
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_download_request', message: INVALID_ACCESS_MESSAGE }, { status: 400 });
    }
    parsedBody = parsed.data;
  } catch {
    return NextResponse.json({ error: 'invalid_json', message: INVALID_ACCESS_MESSAGE }, { status: 400 });
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(GUEST_ACCESS_COOKIE_NAME)?.value;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const guestToken = parsedBody.guestAccessToken ?? (!user?.id ? cookieToken : undefined);

  try {
    await enforceGuideDownloadRateLimit(getRequestIdentifier(request));
  } catch (error) {
    console.error('[GUIDE_DOWNLOAD] Rate limit indisponível ou excedido:', error instanceof Error ? error.message : 'erro desconhecido');
    const limited = error instanceof Error && error.message.includes('Muitas tentativas');
    return NextResponse.json({
      error: limited ? 'download_rate_limited' : 'download_protection_unavailable',
      message: limited ? error.message : 'A proteção de downloads está temporariamente indisponível.',
    }, { status: limited ? 429 : 503 });
  }

  if (guestToken) {
    const [purchase] = await db.select({
      id: guidePurchases.id,
      status: guidePurchases.status,
      encryptedCpf: guidePurchases.encryptedCpf,
      cpf: guidePurchases.cpf,
      fullName: guidePurchases.guestFullName,
      email: guidePurchases.guestEmail,
      guestAccessTokenHash: guidePurchases.guestAccessTokenHash,
      guestAccessTokenExpiresAt: guidePurchases.guestAccessTokenExpiresAt,
    }).from(guidePurchases).where(eq(guidePurchases.guestAccessTokenHash, hashGuestAccessToken(guestToken))).limit(1);
    const [subscription] = purchase ? [] : await db.select({
      id: guideSubscriptions.id,
      status: guideSubscriptions.status,
      encryptedCpf: guideSubscriptions.encryptedCpf,
      cpf: guideSubscriptions.cpf,
      fullName: guideSubscriptions.guestFullName,
      email: guideSubscriptions.guestEmail,
      guestAccessTokenHash: guideSubscriptions.guestAccessTokenHash,
      guestAccessTokenExpiresAt: guideSubscriptions.guestAccessTokenExpiresAt,
    }).from(guideSubscriptions).where(eq(guideSubscriptions.guestAccessTokenHash, hashGuestAccessToken(guestToken))).limit(1);
    const guestAccess = purchase ? { kind: 'purchase' as const, ...purchase } : subscription
      ? { kind: 'subscription' as const, ...subscription }
      : null;
    if (!guestAccess
      || !hasMatchingGuestAccessToken(guestToken, guestAccess.guestAccessTokenHash, guestAccess.guestAccessTokenExpiresAt)
      || (guestAccess.kind === 'purchase' ? guestAccess.status !== 'approved' : guestAccess.status !== 'active')
      || !guestAccess.fullName
      || !guestAccess.email
      || (!guestAccess.encryptedCpf && !guestAccess.cpf)) {
      return NextResponse.json({ error: 'guide_access_not_available', message: INVALID_ACCESS_MESSAGE }, { status: 403 });
    }

    let cpf: string;
    try {
      cpf = guestAccess.encryptedCpf ? decryptGuestCpf(guestAccess.encryptedCpf) : guestAccess.cpf!;
    } catch (error) {
      console.error('[GUIDE_DOWNLOAD] Falha ao descriptografar identidade do acesso convidado:', error instanceof Error ? error.message : 'erro desconhecido');
      return NextResponse.json({ error: 'guide_access_not_available', message: INVALID_ACCESS_MESSAGE }, { status: 403 });
    }

    const asset = getGuideAsset(parsedBody.assetId);
    const source = await readGuideSource(parsedBody.assetId);
    if (!source) {
      return NextResponse.json({
        error: 'guide_asset_unavailable',
        message: 'Este material ainda não está disponível. Tente novamente em alguns instantes.',
      }, { status: 503 });
    }

    let personalized;
    try {
      personalized = await personalizeGuideAsset(asset, source, {
        fullName: guestAccess.fullName,
        cpf,
        email: guestAccess.email,
        shortId: guestAccess.id.slice(0, 8),
      });
    } catch (error) {
      console.error('[GUIDE_DOWNLOAD] Falha ao personalizar ativo convidado:', error instanceof Error ? error.message : 'erro desconhecido');
      return NextResponse.json({
        error: 'guide_personalization_failed',
        message: 'Não foi possível preparar este material agora. Tente novamente em alguns instantes.',
      }, { status: 503 });
    }

    const accessKey = getGuestAccessKey(guestAccess.kind, guestAccess.id);
    const [attempt] = await db.insert(guideDownloadAttempts).values({
      accessKey,
      assetId: parsedBody.assetId,
      attemptCount: 1,
      lastAttemptAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: [guideDownloadAttempts.accessKey, guideDownloadAttempts.assetId],
      set: {
        attemptCount: sql`${guideDownloadAttempts.attemptCount} + 1`,
        lastAttemptAt: new Date(),
        updatedAt: new Date(),
      },
      setWhere: lt(guideDownloadAttempts.attemptCount, GUIDE_DOWNLOAD_ATTEMPTS_PER_ASSET),
    }).returning({ attemptCount: guideDownloadAttempts.attemptCount });
    if (!attempt) {
      return NextResponse.json({ error: 'download_limit_reached', message: DOWNLOAD_LIMIT_MESSAGE }, { status: 403 });
    }

    return new NextResponse(new Blob([new Uint8Array(personalized.content)], { type: personalized.contentType }), {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(personalized.filename)}`,
        'Content-Type': personalized.contentType,
        'X-Downloads-Remaining': String(GUIDE_DOWNLOAD_ATTEMPTS_PER_ASSET - attempt.attemptCount),
      },
    });
  }

  if (!user?.id) {
    return NextResponse.json({ error: 'authentication_required', message: 'Entre na sua conta para baixar seus materiais.' }, { status: 401 });
  }

  const [profile] = await db.select({
    fullName: userProfiles.fullName,
    email: userProfiles.email,
  }).from(userProfiles).where(eq(userProfiles.id, user.id)).limit(1);
  const [purchase] = await db.select({
    id: guidePurchases.id,
    cpf: guidePurchases.cpf,
    downloadCount: guidePurchases.downloadCount,
    maxDownloads: guidePurchases.maxDownloads,
  }).from(guidePurchases)
    .where(and(
      eq(guidePurchases.userId, user.id),
      eq(guidePurchases.status, 'approved'),
      lt(guidePurchases.downloadCount, guidePurchases.maxDownloads),
    ))
    .orderBy(desc(guidePurchases.createdAt))
    .limit(1);
  const [subscription] = purchase ? [] : await db.select({
    id: guideSubscriptions.id,
    cpf: guideSubscriptions.cpf,
    downloadCount: guideSubscriptions.downloadCount,
    maxDownloads: guideSubscriptions.maxDownloads,
  }).from(guideSubscriptions)
    .where(and(
      eq(guideSubscriptions.userId, user.id),
      eq(guideSubscriptions.status, 'active'),
      lt(guideSubscriptions.downloadCount, guideSubscriptions.maxDownloads),
    ))
    .orderBy(desc(guideSubscriptions.createdAt))
    .limit(1);

  const access = purchase ? { kind: 'purchase' as const, ...purchase } : subscription
    ? { kind: 'subscription' as const, ...subscription }
    : null;
  if (!access || !access.cpf || !profile?.fullName || !profile.email) {
    return NextResponse.json({ error: 'guide_access_not_available', message: INVALID_ACCESS_MESSAGE }, { status: 403 });
  }

  const asset = getGuideAsset(parsedBody.assetId);
  const source = await readGuideSource(parsedBody.assetId);
  if (!source) {
    return NextResponse.json({
      error: 'guide_asset_unavailable',
      message: 'Este material ainda não está disponível. Tente novamente em alguns instantes.',
    }, { status: 503 });
  }

  let personalized;
  try {
    personalized = await personalizeGuideAsset(asset, source, {
      fullName: profile.fullName,
      cpf: access.cpf,
      email: profile.email,
      shortId: user.id.slice(0, 8),
    });
  } catch (error) {
    console.error('[GUIDE_DOWNLOAD] Falha ao personalizar ativo:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json({
      error: 'guide_personalization_failed',
      message: 'Não foi possível preparar este material agora. Tente novamente em alguns instantes.',
    }, { status: 503 });
  }

  const table = access.kind === 'purchase' ? guidePurchases : guideSubscriptions;
  const [updated] = await db.update(table).set({
    downloadCount: sql`${table.downloadCount} + 1`,
    lastDownloadedAt: new Date(),
  }).where(and(
    eq(table.id, access.id),
    lt(table.downloadCount, table.maxDownloads),
  )).returning({
    downloadCount: table.downloadCount,
    maxDownloads: table.maxDownloads,
  });
  if (!updated) {
    return NextResponse.json({ error: 'download_limit_reached', message: DOWNLOAD_LIMIT_MESSAGE }, { status: 403 });
  }

  return new NextResponse(new Blob([new Uint8Array(personalized.content)], { type: personalized.contentType }), {
    status: 200,
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(personalized.filename)}`,
      'Content-Type': personalized.contentType,
      'X-Downloads-Remaining': String(updated.maxDownloads - updated.downloadCount),
    },
  });
}
