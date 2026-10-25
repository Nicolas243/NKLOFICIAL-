import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const timestamp = new Date().toISOString();
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ status: 'ok', database: 'connected', timestamp }, { status: 200 });
  } catch (error) {
    console.error('[HEALTH] Banco indisponível:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json({ status: 'degraded', database: 'unreachable', timestamp }, { status: 503 });
  }
}
