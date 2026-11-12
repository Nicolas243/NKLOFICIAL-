import { GUIDE_DOWNLOAD_ATTEMPTS_PER_ASSET } from '@/lib/guide-assets';

export function getGuestAccessKey(kind: 'purchase' | 'subscription', id: string): string {
  return `${kind}:${id}`;
}

export function canConsumeGuestAssetAttempt(attemptCount: number): boolean {
  return attemptCount < GUIDE_DOWNLOAD_ATTEMPTS_PER_ASSET;
}

export function getGuestAssetRemainingAttempts(attemptCount: number): number {
  return Math.max(GUIDE_DOWNLOAD_ATTEMPTS_PER_ASSET - attemptCount, 0);
}
