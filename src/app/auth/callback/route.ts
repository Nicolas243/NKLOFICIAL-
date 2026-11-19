import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  buildReturnPath,
  profileOnboardingPath,
  profileSyncFailurePath,
  safeNextPath,
} from '@/lib/auth/oauth';
import { parseGuideResumeIntent, parseLoginArea } from '@/lib/auth/return-intent';
import { syncAuthenticatedProfile } from '@/lib/auth/profile-sync';
import { hasCompletedOnboarding } from '@/lib/auth/onboarding';
import { sendWelcomeEmailOnce } from '@/lib/email/welcome';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get('code');
  const nextPath = safeNextPath(request.nextUrl.searchParams.get('next'));
  const resumeIntent = parseGuideResumeIntent(request.nextUrl.searchParams.get('resume'));
  const area = parseLoginArea(request.nextUrl.searchParams.get('area'));

  if (!code) {
    const loginPath = profileSyncFailurePath(nextPath, resumeIntent, area).replace(
      'profile_sync_failed',
      'oauth_callback_invalid',
    );
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[AUTH] Falha ao trocar código OAuth:', error.message);
    const loginPath = profileSyncFailurePath(nextPath, resumeIntent, area).replace(
      'profile_sync_failed',
      'oauth_callback_failed',
    );
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    console.error('[AUTH] OAuth não retornou usuário autenticado:', userError?.message ?? 'usuário ausente');
    const loginPath = profileSyncFailurePath(nextPath, resumeIntent, area).replace(
      'profile_sync_failed',
      'oauth_callback_failed',
    );
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  const profileSync = await syncAuthenticatedProfile(userData.user);
  if (!profileSync.ok) {
    return NextResponse.redirect(new URL(profileSyncFailurePath(nextPath, resumeIntent, area), request.url));
  }

  try {
    await sendWelcomeEmailOnce(supabase, userData.user, area);
  } catch (welcomeError) {
    console.error('[AUTH] Falha ao enviar boas-vindas Google:', welcomeError instanceof Error ? welcomeError.message : 'erro desconhecido');
  }

  if (!hasCompletedOnboarding(userData.user.user_metadata)) {
    return NextResponse.redirect(
      new URL(profileOnboardingPath(nextPath, resumeIntent, area), request.url),
    );
  }

  return NextResponse.redirect(new URL(buildReturnPath(nextPath, resumeIntent), request.url));
}
