'use server';

import { and, eq, gt } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/db';
import { classBookings, notifications, studentPlanEnrollments, teacherReviews, userProfiles, users } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';

async function currentUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) throw new Error('Sessão expirada.');
  return user.id;
}

export async function exportUserPersonalDataAction(): Promise<Record<string, unknown>> {
  const userId = await currentUserId();
  const [[user], [profile], bookings, enrollments, reviews, userNotifications] = await Promise.all([
    db.select({ id: users.id, email: users.email, name: users.name, phone: users.phone, role: users.role, createdAt: users.createdAt }).from(users).where(eq(users.id, userId)).limit(1),
    db.select({ id: userProfiles.id, email: userProfiles.email, fullName: userProfiles.fullName, businessName: userProfiles.businessName, city: userProfiles.city, state: userProfiles.state, bio: userProfiles.bio, papel: userProfiles.papel, instrumento: userProfiles.instrumento, acceptsNewStudents: userProfiles.acceptsNewStudents, createdAt: userProfiles.createdAt }).from(userProfiles).where(eq(userProfiles.id, userId)).limit(1),
    db.select().from(classBookings).where(and(eq(classBookings.studentId, userId), eq(classBookings.studentId, userId))),
    db.select().from(studentPlanEnrollments).where(eq(studentPlanEnrollments.studentId, userId)),
    db.select().from(teacherReviews).where(eq(teacherReviews.studentId, userId)),
    db.select().from(notifications).where(eq(notifications.userId, userId)),
  ]);
  return { exportedAt: new Date().toISOString(), user, profile, bookings, enrollments, reviews, notifications: userNotifications };
}

export async function anonymizeOwnAccountAction(
  _previousState: { success: boolean; message: string },
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const userId = await currentUserId();
  if (z.string().parse(formData.get('confirmation')) !== 'CONFIRMAR EXCLUSAO') {
    return { success: false, message: 'Digite CONFIRMAR EXCLUSAO para prosseguir.' };
  }
  const [futureBooking] = await db.select({ id: classBookings.id }).from(classBookings).where(and(
    eq(classBookings.studentId, userId),
    eq(classBookings.status, 'confirmed'),
    eq(classBookings.paymentStatus, 'paid'),
    gt(classBookings.scheduledAt, new Date()),
  )).limit(1);
  if (futureBooking) return { success: false, message: 'Cancele suas aulas futuras antes de encerrar a conta.' };
  await db.update(users).set({ name: 'Usuário Anonimizado LGPD', phone: null }).where(eq(users.id, userId));
  await db.update(userProfiles).set({
    fullName: 'Usuário Anonimizado LGPD',
    businessName: null,
    bio: null,
    mpAccessToken: null,
    mpRefreshToken: null,
    mpCollectorId: null,
    mpTokenExpiresAt: null,
    isSuspended: true,
    acceptsNewStudents: false,
  }).where(eq(userProfiles.id, userId));
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/login');
  return { success: true, message: 'Conta anonimizada e sessão encerrada.' };
}
