'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';

type BookingCalendarProps = {
  professorId: string;
};

type Slot = {
  id: string;
  label: string;
};

const slots: Slot[] = [
  { id: '09:00', label: '09:00 - 10:00' },
  { id: '11:00', label: '11:00 - 12:00' },
  { id: '15:00', label: '15:00 - 16:00' },
  { id: '19:00', label: '19:00 - 20:00' },
];

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-md bg-neon px-5 py-3 font-bold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Preparando pagamento...' : 'Agendar e Pagar'}
    </button>
  );
}

export function BookingCalendar({ professorId }: BookingCalendarProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(slots[0].id);

  const days = Array.from({ length: 5 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index + 1);
    return date;
  });

  return (
    <section className="rounded-2xl border border-border bg-background/70 p-6">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Agenda</p>
        <h2 className="mt-2 font-playfair text-2xl font-bold">Escolha o melhor horário</h2>
        <p className="mt-2 text-sm opacity-70">
          Selecione um horário disponível para continuar com o pagamento seguro.
        </p>
      </div>

      <form
        action={async () => {
          await Promise.resolve();
        }}
        className="space-y-6"
      >
        <input type="hidden" name="professorId" value={professorId} />
        <input type="hidden" name="day" value={selectedDay} />
        <input type="hidden" name="slot" value={selectedSlot} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {days.map((date, index) => (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => setSelectedDay(index)}
              className={`rounded-lg border px-3 py-3 text-left transition-colors ${
                selectedDay === index
                  ? 'border-neon bg-neon/10 text-neon'
                  : 'border-border hover:border-neon/60'
              }`}
            >
              <span className="block text-xs uppercase opacity-70">
                {date.toLocaleDateString('pt-BR', { weekday: 'short' })}
              </span>
              <span className="mt-1 block text-lg font-bold">{date.getDate()}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {slots.map((slot) => (
            <button
              key={slot.id}
              type="button"
              onClick={() => setSelectedSlot(slot.id)}
              className={`rounded-lg border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                selectedSlot === slot.id
                  ? 'border-neon bg-neon/10 text-neon'
                  : 'border-border hover:border-neon/60'
              }`}
            >
              {slot.label}
            </button>
          ))}
        </div>

        <SubmitButton />
      </form>
    </section>
  );
}
