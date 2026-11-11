import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { pushSubscriptions } from '@/db/schema';

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 });

  const payload = await request.json() as { endpoint?: unknown };
  if (typeof payload.endpoint !== 'string' || !payload.endpoint.startsWith('https://')) {
    return NextResponse.json({ error: 'Endpoint de push inválido.' }, { status: 400 });
  }

  await db.delete(pushSubscriptions).where(and(
    eq(pushSubscriptions.userId, user.id),
    eq(pushSubscriptions.endpoint, payload.endpoint),
  ));

  return NextResponse.json({ ok: true });
}
