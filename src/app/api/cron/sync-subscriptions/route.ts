import { NextRequest, NextResponse } from 'next/server';
import { and, eq, lt } from 'drizzle-orm';
import { db } from '@/db';
import { businessDirectory, subscriptions, userProfiles } from '@/db/schema';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Segurança: exige Authorization Bearer {CRON_SECRET}.
  const auth = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${CRON_SECRET ?? ''}`;

  if (!CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();

    // Assinaturas ativas com período vigente já expirado.
    const expiredSubscriptions = await db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
      })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'active'),
          lt(subscriptions.currentPeriodEnd, now)
        )
      );

    let demotedCount = 0;

    for (const sub of expiredSubscriptions) {
      await db
        .update(subscriptions)
        .set({ status: 'past_due' })
        .where(eq(subscriptions.id, sub.id));

      await db
        .update(userProfiles)
        .set({ planType: 'free' })
        .where(eq(userProfiles.id, sub.userId));

      // Sincroniza também a vitrine pública (paridade com o webhook de gateway).
      await db
        .update(businessDirectory)
        .set({ planType: 'free' })
        .where(eq(businessDirectory.userId, sub.userId));

      demotedCount += 1;
    }

    return NextResponse.json({ demotedCount }, { status: 200 });
  } catch (error) {
    console.error('Cron sync-subscriptions error:', error);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}