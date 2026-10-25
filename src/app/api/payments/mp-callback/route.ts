import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { exchangeMercadoPagoCode, verifySignedOAuthState } from '@/lib/mercadopago/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const dashboardUrl = (status: string): URL =>
  new URL(`/dashboard/professor?mp_status=${status}`, process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000');

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieStore = await cookies();
  const storedState = cookieStore.get('mp_oauth_state')?.value;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id || !code || !state || !storedState || state !== storedState || !verifySignedOAuthState(state, user.id)) {
    const response = NextResponse.redirect(dashboardUrl('invalid_state'));
    response.cookies.delete('mp_oauth_state');
    return response;
  }

  try {
    const token = await exchangeMercadoPagoCode(code);
    await db.update(userProfiles).set({
      mpCollectorId: String(token.user_id),
      mpAccessToken: token.access_token,
      mpRefreshToken: token.refresh_token,
      mpTokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
      mpConnectedAt: new Date(),
    }).where(eq(userProfiles.id, user.id));
    const response = NextResponse.redirect(dashboardUrl('connected'));
    response.cookies.delete('mp_oauth_state');
    return response;
  } catch (error) {
    console.error('[MP_OAUTH] Falha no callback:', error instanceof Error ? error.message : 'erro desconhecido');
    const response = NextResponse.redirect(dashboardUrl('error'));
    response.cookies.delete('mp_oauth_state');
    return response;
  }
}
