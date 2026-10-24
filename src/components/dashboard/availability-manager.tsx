'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { saveTeacherAvailability } from '@/actions/scheduling';

const days = [
  ['0', 'Domingo'],
  ['1', 'Segunda'],
  ['2', 'Terça'],
  ['3', 'Quarta'],
  ['4', 'Quinta'],
  ['5', 'Sexta'],
  ['6', 'Sábado'],
] as const;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-neon px-5 py-3 font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? 'Salvando...' : 'Adicionar horário'}
    </button>
  );
}

export function AvailabilityManager() {
  const [state, formAction] = useActionState(saveTeacherAvailability, {
    success: false,
    message: '',
  });

  return (
    <form action={formAction} className="space-y-6 rounded-2xl border border-border bg-surface p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Disponibilidade</p>
        <h2 className="mt-2 font-playfair text-2xl font-bold">Abra sua agenda</h2>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {days.map(([value, label], index) => (
          <label key={value} className="cursor-pointer">
            <input
              type="radio"
              name="dayOfWeek"
              value={value}
              defaultChecked={index === 1}
              className="peer sr-only"
            />
            <span className="block rounded-lg border border-border px-3 py-3 text-center text-sm transition-colors peer-checked:border-neon peer-checked:bg-neon/10 peer-checked:text-neon">
              {label}
            </span>
          </label>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-semibold">
          Início
          <input name="startTime" type="time" defaultValue="14:00" required className="rounded-md border border-border bg-background p-3" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold">
          Fim
          <input name="endTime" type="time" defaultValue="18:00" required className="rounded-md border border-border bg-background p-3" />
        </label>
      </div>

      <SubmitButton />
      {state.message && (
        <p className={`text-sm ${state.success ? 'text-neon' : 'text-red-400'}`} role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}
