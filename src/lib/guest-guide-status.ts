export type GuestGuideStatus = 'pending' | 'approved' | 'active' | 'rejected';

export function resolveGuestGuideStatus(
  type: 'purchase' | 'subscription',
  status: string,
): GuestGuideStatus {
  if (type === 'purchase') {
    if (status === 'approved') return 'approved';
    if (status === 'rejected') return 'rejected';
    return 'pending';
  }

  if (status === 'active') return 'active';
  if (status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired') return 'rejected';
  return 'pending';
}
