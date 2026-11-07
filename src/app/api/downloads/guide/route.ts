import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { and, eq, lt, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { guidePurchases, guideSubscriptions } from '@/db/schema';
import { enforceGuideDownloadRateLimit } from '@/lib/rate-limit';
import { getGuideAsset, GUIDE_ASSET_IDS } from '@/lib/guide-assets';
import { createGuideAssetSignedUrl } from '@/lib/guide-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PURCHASE_REFERENCE_PREFIX = 'guide_purchase:';
const SUBSCRIPTION_REFERENCE_PREFIX = 'guide_subscription:';
const DOWNLOAD_LIMIT_MESSAGE = 'O limite de downloads de segurança deste acesso foi atingido.';
const INVALID_ACCESS_MESSAGE = 'Não foi possível validar este acesso.';
const requestSchema = z.object({
  assetId: z.enum(GUIDE_ASSET_IDS),
  provider: z.literal('hotmart').optional(),
  external_reference: z.string().trim().min(1).optional(),
  payment_id: z.string().trim().min(1).optional(),
  subscription_reference: z.string().trim().min(1).optional(),
}).superRefine((value, context) => {
  const hasPurchase = Boolean(value.external_reference || value.payment_id);
  const hasSubscription = Boolean(value.subscription_reference);
  if (value.provider === 'hotmart') {
    if (!value.payment_id?.startsWith('hotmart:')) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'O identificador da compra Hotmart é obrigatório.',
        path: ['payment_id'],
      });
    }
    return;
  }
  if (hasPurchase === hasSubscription) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Informe uma referência de compra ou assinatura.',
      path: ['external_reference'],
    });
  }
  if (value.external_reference && !value.payment_id) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'O identificador do pagamento é obrigatório para compras únicas.',
      path: ['payment_id'],
    });
  }
});

function getRequestIdentifier(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

function getPurchaseId(externalReference: string): string | null {
  if (!externalReference.startsWith(PURCHASE_REFERENCE_PREFIX)) return null;
  const parsed = z.string().uuid().safeParse(externalReference.slice(PURCHASE_REFERENCE_PREFIX.length));
  return parsed.success ? parsed.data : null;
}

async function readGuideAsset(assetId: z.infer<typeof requestSchema>['assetId']): Promise<{
  asset: ReturnType<typeof getGuideAsset>;
  content: ArrayBuffer;
} | null> {
  const asset = getGuideAsset(assetId);
  const assetsDirectory = path.join(process.cwd(), 'Conteudo de novembro');
  const absolutePath = path.join(assetsDirectory, asset.filename);
  try {
    const file = await readFile(absolutePath);
    const content = new ArrayBuffer(file.byteLength);
    new Uint8Array(content).set(file);
    return { asset, content };
  } catch (error) {
    console.error('[GUIDE_DOWNLOAD] Ativo indisponível:', error instanceof Error ? error.message : 'erro desconhecido');
    return null;
  }
}

type PreparedGuideAsset =
  | { asset: ReturnType<typeof getGuideAsset>; signedUrl: string }
  | { asset: ReturnType<typeof getGuideAsset>; content: ArrayBuffer };

async function prepareGuideAsset(
  assetId: z.infer<typeof requestSchema>['assetId'],
): Promise<PreparedGuideAsset | null> {
  const asset = getGuideAsset(assetId);
  const signedUrl = await createGuideAssetSignedUrl(asset);
  if (signedUrl) return { asset, signedUrl };

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const assetResult = await readGuideAsset(assetId);
  if (!assetResult) return null;
  return { asset: assetResult.asset, content: assetResult.content };
}

function deliverPreparedGuideAsset(
  prepared: PreparedGuideAsset,
  remainingDownloads: number,
): NextResponse {
  if ('signedUrl' in prepared) {
    return NextResponse.json({
      downloadUrl: prepared.signedUrl,
      remainingDownloads,
    }, {
      status: 200,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }

  return new NextResponse(new Blob([prepared.content], { type: prepared.asset.contentType }), {
    status: 200,
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(prepared.asset.filename)}`,
      'Content-Type': prepared.asset.contentType,
      'X-Downloads-Remaining': String(remainingDownloads),
    },
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  let parsedBody: z.infer<typeof requestSchema>;
  try {
    const body: unknown = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_download_request', message: INVALID_ACCESS_MESSAGE }, { status: 400 });
    }
    parsedBody = parsed.data;
  } catch {
    return NextResponse.json({ error: 'invalid_json', message: INVALID_ACCESS_MESSAGE }, { status: 400 });
  }

  try {
    await enforceGuideDownloadRateLimit(getRequestIdentifier(request));
  } catch (error) {
    console.error('[GUIDE_DOWNLOAD] Rate limit indisponível ou excedido:', error instanceof Error ? error.message : 'erro desconhecido');
    const message = error instanceof Error && error.message.includes('Muitas tentativas')
      ? error.message
      : 'A proteção de downloads está temporariamente indisponível.';
    const status = error instanceof Error && error.message.includes('Muitas tentativas') ? 429 : 503;
    return NextResponse.json({ error: 'download_rate_limited', message }, { status });
  }

  if (parsedBody.subscription_reference) {
    if (!parsedBody.subscription_reference.startsWith(SUBSCRIPTION_REFERENCE_PREFIX)) {
      return NextResponse.json({ error: 'invalid_subscription_reference', message: INVALID_ACCESS_MESSAGE }, { status: 403 });
    }
    const [subscription] = await db.select({
      id: guideSubscriptions.id,
      status: guideSubscriptions.status,
      downloadCount: guideSubscriptions.downloadCount,
      maxDownloads: guideSubscriptions.maxDownloads,
    }).from(guideSubscriptions)
      .where(eq(guideSubscriptions.externalReference, parsedBody.subscription_reference))
      .limit(1);
    if (!subscription || subscription.status !== 'active') {
      return NextResponse.json({ error: 'subscription_not_active', message: INVALID_ACCESS_MESSAGE }, { status: 403 });
    }
    if (subscription.downloadCount >= subscription.maxDownloads) {
      return NextResponse.json({ error: 'download_limit_reached', message: DOWNLOAD_LIMIT_MESSAGE }, { status: 403 });
    }
    const prepared = await prepareGuideAsset(parsedBody.assetId);
    if (!prepared) {
      return NextResponse.json({
        error: 'guide_asset_unavailable',
        message: 'Este material ainda não está disponível. Tente novamente em alguns instantes.',
      }, { status: 503 });
    }
    const [updated] = await db.update(guideSubscriptions).set({
      downloadCount: sql`${guideSubscriptions.downloadCount} + 1`,
      lastDownloadedAt: new Date(),
    }).where(and(
      eq(guideSubscriptions.id, subscription.id),
      eq(guideSubscriptions.status, 'active'),
      lt(guideSubscriptions.downloadCount, guideSubscriptions.maxDownloads),
    )).returning({ downloadCount: guideSubscriptions.downloadCount, maxDownloads: guideSubscriptions.maxDownloads });
    if (!updated) {
      return NextResponse.json({ error: 'download_limit_reached', message: DOWNLOAD_LIMIT_MESSAGE }, { status: 403 });
    }
    return deliverPreparedGuideAsset(prepared, updated.maxDownloads - updated.downloadCount);
  }

  if (parsedBody.provider === 'hotmart') {
    if (!parsedBody.payment_id?.startsWith('hotmart:')) {
      return NextResponse.json({ error: 'invalid_hotmart_reference', message: INVALID_ACCESS_MESSAGE }, { status: 403 });
    }
    const [purchase] = await db.select({
      id: guidePurchases.id,
      status: guidePurchases.status,
      paymentId: guidePurchases.paymentId,
      downloadCount: guidePurchases.downloadCount,
      maxDownloads: guidePurchases.maxDownloads,
    }).from(guidePurchases).where(eq(guidePurchases.paymentId, parsedBody.payment_id)).limit(1);
    if (!purchase || purchase.status !== 'approved') {
      return NextResponse.json({ error: 'purchase_not_approved', message: INVALID_ACCESS_MESSAGE }, { status: 403 });
    }
    if (purchase.downloadCount >= purchase.maxDownloads) {
      return NextResponse.json({ error: 'download_limit_reached', message: DOWNLOAD_LIMIT_MESSAGE }, { status: 403 });
    }
    const prepared = await prepareGuideAsset(parsedBody.assetId);
    if (!prepared) {
      return NextResponse.json({
        error: 'guide_asset_unavailable',
        message: 'Este material ainda não está disponível. Tente novamente em alguns instantes.',
      }, { status: 503 });
    }
    const [updated] = await db.update(guidePurchases).set({
      downloadCount: sql`${guidePurchases.downloadCount} + 1`,
      lastDownloadedAt: new Date(),
    }).where(and(
      eq(guidePurchases.id, purchase.id),
      eq(guidePurchases.status, 'approved'),
      eq(guidePurchases.paymentId, parsedBody.payment_id),
      lt(guidePurchases.downloadCount, guidePurchases.maxDownloads),
    )).returning({ downloadCount: guidePurchases.downloadCount, maxDownloads: guidePurchases.maxDownloads });
    if (!updated) {
      return NextResponse.json({ error: 'download_limit_reached', message: DOWNLOAD_LIMIT_MESSAGE }, { status: 403 });
    }
    return deliverPreparedGuideAsset(prepared, updated.maxDownloads - updated.downloadCount);
  }

  const purchaseId = parsedBody.external_reference ? getPurchaseId(parsedBody.external_reference) : null;
  if (!purchaseId || !parsedBody.payment_id) {
    return NextResponse.json({ error: 'invalid_purchase_reference', message: INVALID_ACCESS_MESSAGE }, { status: 403 });
  }
  const [purchase] = await db.select({
    id: guidePurchases.id,
    status: guidePurchases.status,
    paymentId: guidePurchases.paymentId,
    downloadCount: guidePurchases.downloadCount,
    maxDownloads: guidePurchases.maxDownloads,
  }).from(guidePurchases).where(eq(guidePurchases.id, purchaseId)).limit(1);
  if (!purchase || purchase.status !== 'approved' || purchase.paymentId !== parsedBody.payment_id) {
    return NextResponse.json({ error: 'purchase_not_approved', message: INVALID_ACCESS_MESSAGE }, { status: 403 });
  }
  if (purchase.downloadCount >= purchase.maxDownloads) {
    return NextResponse.json({ error: 'download_limit_reached', message: DOWNLOAD_LIMIT_MESSAGE }, { status: 403 });
  }
  const prepared = await prepareGuideAsset(parsedBody.assetId);
  if (!prepared) {
    return NextResponse.json({
      error: 'guide_asset_unavailable',
      message: 'Este material ainda não está disponível. Tente novamente em alguns instantes.',
    }, { status: 503 });
  }
  const [updated] = await db.update(guidePurchases).set({
    downloadCount: sql`${guidePurchases.downloadCount} + 1`,
    lastDownloadedAt: new Date(),
  }).where(and(
    eq(guidePurchases.id, purchase.id),
    eq(guidePurchases.status, 'approved'),
    eq(guidePurchases.paymentId, parsedBody.payment_id),
    lt(guidePurchases.downloadCount, guidePurchases.maxDownloads),
  )).returning({ downloadCount: guidePurchases.downloadCount, maxDownloads: guidePurchases.maxDownloads });
  if (!updated) {
    return NextResponse.json({ error: 'download_limit_reached', message: DOWNLOAD_LIMIT_MESSAGE }, { status: 403 });
  }
  return deliverPreparedGuideAsset(prepared, updated.maxDownloads - updated.downloadCount);
}
