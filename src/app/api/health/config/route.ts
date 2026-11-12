import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUIRED_SERVER_VARIABLES = [
  'DATABASE_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'DAILY_API_KEY',
  'CRON_SECRET',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

const REQUIRED_PUBLIC_VARIABLES = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SITE_URL',
] as const;

function isConfigured(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

export async function GET(): Promise<NextResponse> {
  const server = Object.fromEntries(REQUIRED_SERVER_VARIABLES.map((name) => [name, isConfigured(name)]));
  const publicVariables = Object.fromEntries(REQUIRED_PUBLIC_VARIABLES.map((name) => [name, isConfigured(name)]));
  const ready = [...Object.values(server), ...Object.values(publicVariables)].every(Boolean);

  return NextResponse.json({
    status: ready ? 'ok' : 'degraded',
    configured: { server, public: publicVariables },
  }, { status: ready ? 200 : 503 });
}
