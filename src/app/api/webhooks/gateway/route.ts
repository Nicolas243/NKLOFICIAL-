import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { subscriptions, userProfiles, businessDirectory } from '@/db/schema';

// Chave secreta para validar webhooks (definida via env em produção).
// Se ausente em dev, aceita o payload para permitir testes locais.
const WEBHOOK_SECRET = process.env.GATEWAY_WEBHOOK_SECRET;

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

export async function POST(request: NextRequest) {
  try {
    // 1) Validação do header de autenticação/assinatura (anti-spoofing).
    if (WEBHOOK_SECRET) {
      const signature = request.headers.get('x-gateway-signature');
      if (signature !== WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'forbidden' }, { status: 401 });
      }
    }

    // 2) Parsing do payload.
    const payload = (await request.json()) as Record<string, unknown>;
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

    // 3) Persiste a assinatura (upsert pela assinatura do gateway).
    //    Uma renovação/atualização de status deve atualizar o registro, não
    //    falhar nem ignorar — usa a unique em gatewaySubscriptionId.
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

    // Mantem sincronizado o businessDirectory (fonte usada pelo diretório).
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