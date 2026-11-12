'use client';

import { BellPlus, CalendarPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SharePageButton } from '@/components/ui/share-page-button';

type Props = {
  name: string;
  slug: string;
  url: string;
};

type Frequency = 'daily' | 'weekdays' | 'weekly';

function calendarDate(date: Date): string {
  return date.toISOString().replaceAll('-', '').replaceAll(':', '').replace(/\.\d{3}Z$/u, 'Z');
}

function recurrence(frequency: Frequency): string {
  if (frequency === 'weekdays') return 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR';
  if (frequency === 'weekly') return 'RRULE:FREQ=WEEKLY';
  return 'RRULE:FREQ=DAILY';
}

export function ProgramActions({ name, slug, url }: Props) {
  const [reminderOpen, setReminderOpen] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>('weekly');

  useEffect(() => {
    if (!reminderOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setReminderOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [reminderOpen]);

  function addReminder(format: 'google' | 'ics'): void {
    const start = new Date(Date.now() + 60 * 60 * 1000);
    start.setMinutes(0, 0, 0);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const title = `Renda extra: avançar em ${name}`;
    const details = `Reserve 30 minutos para avançar em ${name}. Acesse: ${url}`;
    if (format === 'google') {
      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        dates: `${calendarDate(start)}/${calendarDate(end)}`,
        details: `${details}\n\nFrequência: ${frequency === 'daily' ? 'diária' : frequency === 'weekdays' ? 'dias úteis' : 'semanal'}.`,
        recur: recurrence(frequency),
      });
      window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank', 'noopener,noreferrer');
    } else {
      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Portal NKL//Renda Extra//PT-BR',
        'BEGIN:VEVENT',
        `UID:${slug}-${Date.now()}@nkloficial.com.br`,
        `DTSTAMP:${calendarDate(new Date())}`,
        `DTSTART:${calendarDate(start)}`,
        `DTEND:${calendarDate(end)}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${details}`,
        recurrence(frequency),
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');
      const objectUrl = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `lembrete-renda-extra-${slug}.ics`;
      link.click();
      URL.revokeObjectURL(objectUrl);
    }
    setReminderOpen(false);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <SharePageButton
          canonicalHref={url}
          title={`${name} · Portal NKL`}
          text={`Oi! Encontrei esta oportunidade de renda extra e lembrei de você: ${name}.`}
        />
        <button type="button" onClick={() => setReminderOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-bold hover:border-neon hover:text-neon" aria-label={`Criar lembrete para ${name}`}>
          <BellPlus size={16} aria-hidden="true" /> <span>Lembrar depois</span>
        </button>
      </div>
      {reminderOpen && (
        <div className="fixed inset-0 z-[240] flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-labelledby={`reminder-${slug}-title`} onMouseDown={(event) => { if (event.target === event.currentTarget) setReminderOpen(false); }}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-income-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Não deixe para depois</p>
                <h2 id={`reminder-${slug}-title`} className="mt-1 font-playfair text-2xl font-bold">Lembrar de avançar</h2>
              </div>
              <button type="button" onClick={() => setReminderOpen(false)} className="rounded-md p-2 opacity-60 hover:bg-background hover:opacity-100" aria-label="Fechar"><X size={20} /></button>
            </div>
            <p className="mt-4 text-sm leading-relaxed opacity-75">O Portal NKL não salva seus dados. O lembrete é criado diretamente no seu calendário.</p>
            <label className="mt-5 block text-sm font-bold">
              Frequência
              <select value={frequency} onChange={(event) => setFrequency(event.target.value as Frequency)} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 font-normal">
                <option value="daily">Todos os dias</option>
                <option value="weekdays">Dias úteis</option>
                <option value="weekly">Uma vez por semana</option>
              </select>
            </label>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => addReminder('google')} className="inline-flex items-center justify-center gap-2 rounded-md bg-neon px-4 py-2.5 text-sm font-bold text-black hover:opacity-90"><CalendarPlus size={16} aria-hidden="true" /> Google Calendar</button>
              <button type="button" onClick={() => addReminder('ics')} className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-bold hover:border-neon"><BellPlus size={16} aria-hidden="true" /> Baixar .ics</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
