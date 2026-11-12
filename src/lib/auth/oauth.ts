import {
  buildLoginPath,
  buildReturnPath,
  safeNextPath,
  type GuideResumeIntent,
  type LoginArea,
} from '@/lib/auth/return-intent';

export function profileSyncFailurePath(
  nextPath: string,
  resumeIntent: GuideResumeIntent | null = null,
  area: LoginArea = 'music',
): string {
  const loginUrl = new URL(buildLoginPath(nextPath, resumeIntent, area), 'http://localhost');
  const search = new URLSearchParams({
    error: 'profile_sync_failed',
    next: loginUrl.searchParams.get('next') ?? '/',
  });
  const resume = loginUrl.searchParams.get('resume');
  if (resume) search.set('resume', resume);
  const loginArea = loginUrl.searchParams.get('area');
  if (loginArea) search.set('area', loginArea);
  return `${loginUrl.pathname}?${search.toString()}`;
}

export { buildReturnPath };
export { safeNextPath };
