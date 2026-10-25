'use client';

import { cancelClassBookingAction } from '@/actions/booking-lifecycle';

export function BookingActionsBar({ bookingId }: { bookingId: string }) {
  async function cancel(formData: FormData): Promise<void> {
    await cancelClassBookingAction(formData);
  }
  return <form action={cancel} className="mt-4"><input type="hidden" name="bookingId" value={bookingId} /><button type="submit" className="text-sm font-bold text-red-400 hover:underline">Cancelar Aula</button></form>;
}
