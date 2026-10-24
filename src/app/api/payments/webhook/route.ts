import crypto from 'node:crypto';
import { after, NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type MercadoPagoNotification = {
  action?: unknown;
  api_version?: unknown;
  data?: { id?: unknown };
  date_created?: unknown;
  id?: unknown;
  live_mode?: unknown;
  type?: unknown;
  user_id?: unknown;
};

type SignatureParts = {
  timestamp: string;
  signature: string;
};

const HEX_SIGNATURE = /^[a-f0-9]{64}$/i;

function parseSignature(value: string): SignatureParts | null {
  const parts = new Map(
    value.split(',').map((part) => {
      const [key, ...rest] = part.trim().split('=');
      return [key, rest.join('=')];
    }),
  );
  const timestamp = parts.get('ts');
  const signature = parts.get('v1');

  if (!timestamp || !signature || !/^\d+$/.test(timestamp) || !HEX_SIGNATURE.test(signature)) {
    return null;
  }

  return { timestamp, signature };
}

function hasValidSignature(request: NextRequest, notification: MercadoPagoNotification): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const signatureHeader = request.headers.get('x-signature');
  const requestId = request.headers.get('x-request-id');
  const dataId = notification.data?.id;

  if (!secret || !signatureHeader || !requestId || typeof dataId !== 'string' || !dataId) {
    return false;
  }

  const parts = parseSignature(signatureHeader);
  if (!parts) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${parts.timestamp};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  const receivedBuffer = Buffer.from(parts.signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  return receivedBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

async function processNotification(notification: MercadoPagoNotification): Promise<void> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const paymentId = notification.data?.id;

  if (!accessToken) {
    console.error('[WEBHOOK] MERCADOPAGO_ACCESS_TOKEN ausente.');
    return;
  }

  if (typeof paymentId !== 'string' || !paymentId) {
    console.error('[WEBHOOK] Notificação sem identificador de pagamento.');
    return;
  }

  try {
    const client = new MercadoPagoConfig({ accessToken });
    const payment = await new Payment(client).get({ id: paymentId });
    console.log('[WEBHOOK] Pagamento sincronizado:', {
      id: payment.id,
      status: payment.status,
      type: notification.type,
      action: notification.action,
    });
  } catch (error) {
    console.error('[WEBHOOK] Falha ao consultar pagamento:', error instanceof Error ? error.message : 'erro desconhecido');
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let notification: MercadoPagoNotification;

  try {
    notification = await request.json() as MercadoPagoNotification;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (!hasValidSignature(request, notification)) {
    console.error('[WEBHOOK] Assinatura inválida ou configuração ausente.');
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  console.log('[WEBHOOK] Notificação recebida:', {
    id: notification.id,
    type: notification.type,
    action: notification.action,
    paymentId: notification.data?.id,
  });

  after(() => processNotification(notification));
  return NextResponse.json({ received: true }, { status: 200 });
}
