import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { buildMercadoPagoOAuthUrl, createSignedOAuthState } from '@/lib/mercadopago/oauth';
import { env } from '@/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'));

  const [profile] = await db.select({ role: userProfiles.role, papel: userProfiles.papel })
    .from(userProfiles).where(eq(userProfiles.id, user.id)).limit(1);
  if (!profile || (profile.role !== 'professor' && profile.papel !== 'Professor')) {
    return NextResponse.redirect(new URL('/dashboard/professor?mp_status=invalid_role', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'));
  }
  if (!env.MERCADOPAGO_CLIENT_ID) {
    return NextResponse.redirect(new URL('/dashboard/professor?mp_status=oauth_not_configured', env.NEXT_PUBLIC_SITE_URL));
  }
  const state = createSignedOAuthState(user.id);
  const response = NextResponse.redirect(buildMercadoPagoOAuthUrl(state));
  response.cookies.set('mp_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
  });
  return response;
}
