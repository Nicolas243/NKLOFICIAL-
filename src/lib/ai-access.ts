export type AiAccessStatus = 'none' | 'pending' | 'active' | 'canceling' | 'canceled' | 'past_due';

export type AiAccessInput = {
  userId: string;
  accessStatus: AiAccessStatus | string;
  accessUntil?: Date | null;
  now?: Date;
};

export function canAccessAiProduct(input: AiAccessInput): boolean {
  if (!input.userId.trim()) return false;
  if (input.accessStatus === 'active') return true;
  if (input.accessStatus !== 'canceling') return false;
  if (!input.accessUntil) return false;
  return input.accessUntil.getTime() > (input.now ?? new Date()).getTime();
}
