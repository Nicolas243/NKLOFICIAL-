import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '@/db';
import { subscriptions, userProfiles, businessDirectory } from '@/db/schema';

// Chave secreta para assinar/validar webhooks (definida via env em produção).
// Assinatura: HMAC-SHA256 hexadecimal do body bruto, enviada no header
// `x-webhook-signature`. Ausente apenas em dev para permitir testes locais.
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? process.env.GATEWAY_WEBHOOK_SECRET;

const HMAC_SHA256_HEX = /^[0-9a-f]{64}$/i;

function extractUserId(payload: Record<string, unknown>): string | null {
  const meta = payload as {
    data?: { metadata?: { user_id?: unknown } };
    external_reference?: unknown;
  };
  const userId =
    meta.data?.metadata?.user_id ??
    meta.external_reference ??
    payload.user_id ??
    null;

  return typeof userId === 'string' && userId.length > 0 ? userId : null;
}

function extractStatus(payload: Record<string, unknown>): string {
  const raw =
    payload.status ??
    (payload as { data?: { status?: unknown } }).data?.status ??
    'active';
  return String(raw).toLowerCase();
}

/**
 * Comparação em tempo constante do HMAC recebido contra o valor esperado.
 * `timingSafeEqual` exige buffers de mesmo comprimento; por isso o formato
 * hex (64 chars) é validado antes, e ambos os lados são normalizados.
 */
function isValidSignature(received: string, expected: Buffer): boolean {
  if (!HMAC_SHA256_HEX.test(received)) return false;
  const receivedBuffer = Buffer.from(received, 'hex');
  return crypto.timingSafeEqual(receivedBuffer, expected);
}

export async function POST(request: NextRequest) {
  try {
    // 1) Lê o corpo bruto UMA única vez — o HMAC precisa do payload exato
    //    transmitido e o parse de JSON subsequente reutiliza essa string.
    const rawBody = await request.text();
    if (!rawBody) {
      return NextResponse.json({ error: 'empty payload' }, { status: 400 });
    }

    // 2) Validação de autenticidade (anti-spoofing / replay): HMAC-SHA256 do
    //    body bruto contra o secret. Em ambiente prod, o secret é obrigatório.
    if (WEBHOOK_SECRET) {
      const signature = request.headers.get('x-webhook-signature');
      if (!signature) {
        return NextResponse.json({ error: 'missing signature' }, { status: 401 });
      }

      const expectedHmac = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(rawBody, 'utf8')
        .digest();

      if (!isValidSignature(signature, expectedHmac)) {
        return NextResponse.json({ error: 'forbidden' }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.error('[webhook/gateway] WEBHOOK_SECRET ausente em produção.');
      return NextResponse.json({ error: 'server misconfigured' }, { status: 500 });
    } else {
      console.warn(
        '[webhook/gateway] WEBHOOK_SECRET ausente — payload aceito sem assinatura (apenas dev).'
      );
    }

    // 3) Parsing do payload a partir do body já lido.
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'invalid json' }, { status: 400 });
    }

    const userId = extractUserId(payload);
    if (!userId) {
      return NextResponse.json({ error: 'missing user reference' }, { status: 422 });
    }

    const gatewayProvider = String(payload.provider ?? 'mercadopago');
    const gatewaySubscriptionId = String(
      (payload as { data?: { id?: unknown } }).data?.id ?? payload.id ?? 'unknown'
    );
    const status = extractStatus(payload);

    // Normaliza para os valores aceitos pela coluna.
    const normalizedStatus = ['active', 'past_due', 'canceled'].includes(status)
      ? status
      : 'active';

    // 4) Persiste a assinatura (upsert pelo id da assinatura do gateway).
    const periodEndRaw =
      (payload as {
        data?: { current_period_end?: number | string };
      }).data?.current_period_end ??
      payload.current_period_end ??
      null;

    const currentPeriodEnd =
      typeof periodEndRaw === 'number'
        ? new Date(periodEndRaw * 1000)
        : typeof periodEndRaw === 'string'
          ? new Date(periodEndRaw)
          : null;

    await db
      .insert(subscriptions)
      .values({
        userId,
        gatewayProvider,
        gatewaySubscriptionId,
        status: normalizedStatus,
        currentPeriodEnd,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: subscriptions.gatewaySubscriptionId,
        set: {
          status: normalizedStatus,
          currentPeriodEnd,
          updatedAt: new Date(),
        },
      });

    // Sincroniza o plano do perfil do usuário conforme o status.
    const planType = normalizedStatus === 'active' ? 'premium' : 'free';

    await db
      .update(userProfiles)
      .set({ planType })
      .where(eq(userProfiles.id, userId));

    // Mantém sincronizado o businessDirectory (fonte usada pelo diretório).
    await db
      .update(businessDirectory)
      .set({ planType })
      .where(eq(businessDirectory.userId, userId));

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }
}