import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { profileSyncFailurePath, safeNextPath } from '@/lib/auth/oauth';
import { syncAuthenticatedProfile } from '@/lib/auth/profile-sync';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get('code');
  const nextPath = safeNextPath(request.nextUrl.searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=oauth_callback_invalid', request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[AUTH] Falha ao trocar código OAuth:', error.message);
    return NextResponse.redirect(new URL('/login?error=oauth_callback_failed', request.url));
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    console.error('[AUTH] OAuth não retornou usuário autenticado:', userError?.message ?? 'usuário ausente');
    return NextResponse.redirect(new URL('/login?error=oauth_callback_failed', request.url));
  }

  const profileSync = await syncAuthenticatedProfile(userData.user);
  if (!profileSync.ok) {
    return NextResponse.redirect(new URL(profileSyncFailurePath(nextPath), request.url));
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
