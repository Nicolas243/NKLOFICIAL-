'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createClassBooking } from '@/actions/scheduling';

type TimeSlotPickerProps = {
  teacherId: string;
  slots: string[];
};

function BookingSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-neon px-5 py-3 font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? 'Reservando...' : 'Reservar horário'}
    </button>
  );
}

export function TimeSlotPicker({ teacherId, slots }: TimeSlotPickerProps) {
  const [selectedSlot, setSelectedSlot] = useState(slots[0] ?? '');
  const [state, formAction] = useActionState(createClassBooking, {
    success: false,
    message: '',
  });

  if (slots.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-border p-6">
        <h2 className="font-playfair text-2xl font-bold">Nenhum horário livre</h2>
        <p className="mt-2 text-sm opacity-70">Volte em outro momento para consultar a agenda.</p>
      </section>
    );
  }

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-border bg-background/70 p-6">
      <input type="hidden" name="teacherId" value={teacherId} />
      <input type="hidden" name="scheduledAt" value={selectedSlot} />
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Horários</p>
        <h2 className="mt-2 font-playfair text-2xl font-bold">Escolha uma aula</h2>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {slots.map((slot) => (
          <button
            key={slot}
            type="button"
            onClick={() => setSelectedSlot(slot)}
            className={`rounded-lg border px-4 py-3 text-left text-sm font-semibold transition-colors ${
              selectedSlot === slot
                ? 'border-neon bg-neon/10 text-neon'
                : 'border-border hover:border-neon/60'
            }`}
          >
            {new Intl.DateTimeFormat('pt-BR', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(slot))}
          </button>
        ))}
      </div>
      <BookingSubmitButton />
      {state.message && (
        <p className={`text-sm ${state.success ? 'text-neon' : 'text-red-400'}`} role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}
