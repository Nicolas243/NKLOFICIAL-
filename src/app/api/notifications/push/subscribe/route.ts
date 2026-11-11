import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { pushSubscriptions } from '@/db/schema';

type SubscriptionPayload = {
  endpoint?: unknown;
  keys?: unknown;
  expirationTime?: unknown;
};

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 });

  const payload = await request.json() as SubscriptionPayload;
  if (typeof payload.endpoint !== 'string' || !payload.endpoint.startsWith('https://') || typeof payload.keys !== 'object' || payload.keys === null) {
    return NextResponse.json({ error: 'Inscrição de push inválida.' }, { status: 400 });
  }

  await db.insert(pushSubscriptions).values({
    userId: user.id,
    endpoint: payload.endpoint,
    subscription: {
      endpoint: payload.endpoint,
      keys: payload.keys as Record<string, unknown>,
      expirationTime: payload.expirationTime ?? null,
    },
  }).onConflictDoUpdate({
    target: pushSubscriptions.endpoint,
    set: {
      userId: user.id,
      subscription: {
        endpoint: payload.endpoint,
        keys: payload.keys as Record<string, unknown>,
        expirationTime: payload.expirationTime ?? null,
      },
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
