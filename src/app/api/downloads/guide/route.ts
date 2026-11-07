import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { and, eq, lt, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { guidePurchases, guideSubscriptions } from '@/db/schema';
import { enforceGuideDownloadRateLimit } from '@/lib/rate-limit';
import { getGuideAsset, GUIDE_ASSET_IDS } from '@/lib/guide-assets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PURCHASE_REFERENCE_PREFIX = 'guide_purchase:';
const SUBSCRIPTION_REFERENCE_PREFIX = 'guide_subscription:';
const DOWNLOAD_LIMIT_MESSAGE = 'O limite de downloads de segurança deste acesso foi atingido.';
const INVALID_ACCESS_MESSAGE = 'Não foi possível validar este acesso.';
const requestSchema = z.object({
  assetId: z.enum(GUIDE_ASSET_IDS),
  external_reference: z.string().trim().min(1).optional(),
  payment_id: z.string().trim().min(1).optional(),
  subscription_reference: z.string().trim().min(1).optional(),
}).superRefine((value, context) => {
  const hasPurchase = Boolean(value.external_reference || value.payment_id);
  const hasSubscription = Boolean(value.subscription_reference);
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

  const assetResult = await readGuideAsset(parsedBody.assetId);
  if (!assetResult) {
    return NextResponse.json({ error: 'guide_asset_unavailable', message: 'Este material está temporariamente indisponível.' }, { status: 503 });
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
    return new NextResponse(new Blob([assetResult.content], { type: assetResult.asset.contentType }), {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(assetResult.asset.filename)}`,
        'Content-Type': assetResult.asset.contentType,
        'X-Downloads-Remaining': String(updated.maxDownloads - updated.downloadCount),
      },
    });
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
  return new NextResponse(new Blob([assetResult.content], { type: assetResult.asset.contentType }), {
    status: 200,
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(assetResult.asset.filename)}`,
      'Content-Type': assetResult.asset.contentType,
      'X-Downloads-Remaining': String(updated.maxDownloads - updated.downloadCount),
    },
  });
}
