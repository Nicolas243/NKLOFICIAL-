'use server';

import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { classBookings, entityReports, teacherReviews, userProfiles } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { createBookingNotification } from '@/lib/notifications/booking-alerts';
import { enforcePublicRateLimit } from '@/lib/upstash/ratelimit';

const MIN_REVIEW_RATING = 1;
const MAX_REVIEW_RATING = 5;
const MIN_COMMENT_LENGTH = 10;
const MAX_COMMENT_LENGTH = 1500;

const visibilitySchema = z.enum(['public', 'teacher_only', 'admin_only']);
const targetTypeSchema = z.enum(['student', 'teacher', 'store', 'luthier']);
const reasonSchema = z.enum(['fraud', 'harassment', 'no_show', 'inappropriate_content', 'commercial_violation', 'other']);

export type ModerationActionState = { success: boolean; message: string };

function value(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

export async function submitTeacherReviewAction(
  _previousState: ModerationActionState,
  formData: FormData,
): Promise<ModerationActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return { success: false, message: 'Sessão expirada.' };

  const parsed = z.object({
    bookingId: z.string().uuid(),
    rating: z.coerce.number().int().min(MIN_REVIEW_RATING).max(MAX_REVIEW_RATING),
    comment: z.string().trim().min(MIN_COMMENT_LENGTH).max(MAX_COMMENT_LENGTH),
    visibility: visibilitySchema,
  }).safeParse({
    bookingId: value(formData, 'bookingId'),
    rating: value(formData, 'rating'),
    comment: value(formData, 'comment'),
    visibility: value(formData, 'visibility'),
  });
  if (!parsed.success) return { success: false, message: 'Informe uma avaliação válida.' };

  const [booking] = await db.select({
    teacherId: classBookings.teacherId,
    paymentStatus: classBookings.paymentStatus,
    status: classBookings.status,
  }).from(classBookings).where(and(eq(classBookings.id, parsed.data.bookingId), eq(classBookings.studentId, user.id))).limit(1);
  if (!booking || booking.paymentStatus !== 'paid' || booking.status !== 'confirmed') {
    return { success: false, message: 'A aula ainda não pode ser avaliada.' };
  }
  const [existing] = await db.select({ id: teacherReviews.id }).from(teacherReviews).where(eq(teacherReviews.bookingId, parsed.data.bookingId)).limit(1);
  if (existing) return { success: false, message: 'Esta aula já foi avaliada.' };

  await db.insert(teacherReviews).values({
    bookingId: parsed.data.bookingId,
    studentId: user.id,
    teacherId: booking.teacherId,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
    visibility: parsed.data.visibility,
  });
  if (parsed.data.visibility !== 'admin_only') {
    await createBookingNotification({
      userId: booking.teacherId,
      title: 'Nova avaliação recebida',
      message: 'Um aluno enviou uma avaliação sobre sua aula.',
      link: parsed.data.bookingId,
    });
  }
  return { success: true, message: 'Avaliação enviada.' };
}

export async function submitEntityReportAction(
  _previousState: ModerationActionState,
  formData: FormData,
): Promise<ModerationActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return { success: false, message: 'Sessão expirada.' };
  try {
    await enforcePublicRateLimit('entity-report', user.id);
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Muitas tentativas.' };
  }

  const targetUserId = value(formData, 'targetUserId') || null;
  const parsed = z.object({
    targetType: targetTypeSchema,
    reason: reasonSchema,
    details: z.string().trim().min(MIN_COMMENT_LENGTH).max(MAX_COMMENT_LENGTH),
    targetDirectoryId: z.string().uuid().nullable(),
    bookingId: z.string().uuid().nullable(),
  }).safeParse({
    targetType: value(formData, 'targetType'),
    reason: value(formData, 'reason'),
    details: value(formData, 'details'),
    targetDirectoryId: value(formData, 'targetDirectoryId') || null,
    bookingId: value(formData, 'bookingId') || null,
  });
  if (!parsed.success || targetUserId === user.id) return { success: false, message: 'Denúncia inválida.' };

  await db.insert(entityReports).values({
    reporterId: user.id,
    targetType: parsed.data.targetType,
    targetUserId,
    targetDirectoryId: parsed.data.targetDirectoryId,
    bookingId: parsed.data.bookingId,
    reason: parsed.data.reason,
    details: parsed.data.details,
  });
  return { success: true, message: 'Denúncia enviada para moderação.' };
}

export async function updateEntityReportStatusAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) throw new Error('Sessão expirada.');
  const [profile] = await db.select({ role: userProfiles.role }).from(userProfiles).where(eq(userProfiles.id, user.id)).limit(1);
  if (profile?.role !== 'admin') throw new Error('Acesso restrito a administradores.');
  const status = z.enum(['under_review', 'resolved', 'dismissed']).parse(value(formData, 'status'));
  const reportId = z.string().uuid().parse(value(formData, 'reportId'));
  await db.update(entityReports).set({
    status,
    adminNotes: value(formData, 'adminNotes') || null,
    resolvedBy: status === 'resolved' || status === 'dismissed' ? user.id : null,
    resolvedAt: status === 'resolved' || status === 'dismissed' ? new Date() : null,
  }).where(eq(entityReports.id, reportId));
}
