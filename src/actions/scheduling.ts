'use server';

import { and, eq, gte, lt } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { classBookings, teacherAvailability, users } from '@/db/schema';
import { calculateClassPricing, DEFAULT_CLASS_PRICE_CENTS } from '@/lib/pricing';
import { createClient } from '@/lib/supabase/server';

type ActionResult = {
  success: boolean;
  message: string;
  bookingId?: string;
};

export async function saveTeacherAvailability(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { success: false, message: 'Sessão expirada. Entre novamente.' };
  }

  const dayOfWeek = Number(formData.get('dayOfWeek'));
  const startTime = String(formData.get('startTime') ?? '');
  const endTime = String(formData.get('endTime') ?? '');

  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6 || !startTime || !endTime) {
    return { success: false, message: 'Informe um dia e um intervalo válidos.' };
  }

  const [profile] = await db.select({ role: users.role }).from(users).where(eq(users.id, user.id)).limit(1);
  if (profile?.role !== 'professor') {
    return { success: false, message: 'Apenas professores podem editar a disponibilidade.' };
  }

  await db.insert(teacherAvailability).values({
    teacherId: user.id,
    dayOfWeek,
    startTime,
    endTime,
    isActive: true,
  });

  revalidatePath('/dashboard/professor');
  return { success: true, message: 'Disponibilidade adicionada.' };
}

export async function getAvailableTeacherSlots(
  teacherId: string,
  from: Date,
  to: Date,
): Promise<Date[]> {
  const availability = await db
    .select()
    .from(teacherAvailability)
    .where(and(eq(teacherAvailability.teacherId, teacherId), eq(teacherAvailability.isActive, true)));

  const bookings = await db
    .select({ scheduledAt: classBookings.scheduledAt })
    .from(classBookings)
    .where(and(
      eq(classBookings.teacherId, teacherId),
      gte(classBookings.scheduledAt, from),
      lt(classBookings.scheduledAt, to),
    ));

  const bookedTimes = new Set(bookings.map((booking) => booking.scheduledAt.getTime()));
  const slots: Date[] = [];
  const cursor = new Date(from);
  cursor.setMinutes(0, 0, 0);

  while (cursor < to) {
    const dayAvailability = availability.some((entry) => {
      const [startHour, startMinute] = entry.startTime.split(':').map(Number);
      const [endHour, endMinute] = entry.endTime.split(':').map(Number);
      const minutes = cursor.getHours() * 60 + cursor.getMinutes();
      return entry.dayOfWeek === cursor.getDay()
        && minutes >= startHour * 60 + startMinute
        && minutes + 60 <= endHour * 60 + endMinute;
    });

    if (dayAvailability && !bookedTimes.has(cursor.getTime())) {
      slots.push(new Date(cursor));
    }
    cursor.setHours(cursor.getHours() + 1);
  }

  return slots;
}

export async function createClassBooking(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const teacherId = String(formData.get('teacherId') ?? '');
  const scheduledAtValue = String(formData.get('scheduledAt') ?? '');
  const scheduledAt = new Date(scheduledAtValue);

  if (!user?.id || !teacherId || Number.isNaN(scheduledAt.getTime())) {
    return { success: false, message: 'Dados de reserva inválidos.' };
  }

  const existing = await db
    .select({ id: classBookings.id })
    .from(classBookings)
    .where(and(
      eq(classBookings.teacherId, teacherId),
      eq(classBookings.scheduledAt, scheduledAt),
    ))
    .limit(1);

  if (existing.length > 0) {
    return { success: false, message: 'Este horário acabou de ser reservado.' };
  }

  const [booking] = await db.insert(classBookings).values({
    studentId: user.id,
    teacherId,
    scheduledAt,
    status: 'pending',
    paymentStatus: 'pending',
    priceCents: DEFAULT_CLASS_PRICE_CENTS,
    platformFeeCents: calculateClassPricing(DEFAULT_CLASS_PRICE_CENTS).platformApplicationFeeCents,
  }).returning({ id: classBookings.id });

  revalidatePath('/dashboard/aluno');
  return {
    success: true,
    message: 'Reserva criada. Continue para o pagamento.',
    bookingId: booking?.id,
  };
}
