export function safeNextPath(value: string | null): string {
  return value
    && value.startsWith('/')
    && !value.startsWith('//')
    && !value.includes('\\')
    ? value
    : '/';
}

export function profileSyncFailurePath(nextPath: string): string {
  const search = new URLSearchParams({
    error: 'profile_sync_failed',
    next: safeNextPath(nextPath),
  });
  return `/login?${search.toString()}`;
}
