import {
  buildLoginPath,
  buildReturnPath,
  safeNextPath,
  type GuideResumeIntent,
} from '@/lib/auth/return-intent';

export function profileSyncFailurePath(
  nextPath: string,
  resumeIntent: GuideResumeIntent | null = null,
): string {
  const loginUrl = new URL(buildLoginPath(nextPath, resumeIntent), 'http://localhost');
  const search = new URLSearchParams({
    error: 'profile_sync_failed',
    next: loginUrl.searchParams.get('next') ?? '/',
  });
  const resume = loginUrl.searchParams.get('resume');
  if (resume) search.set('resume', resume);
  return `${loginUrl.pathname}?${search.toString()}`;
}

export { buildReturnPath };
export { safeNextPath };
