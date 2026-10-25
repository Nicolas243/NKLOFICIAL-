'use server';

import { and, count, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/db';
import { businessDirectory, classBookings, entityReports, teacherReviews, userProfiles } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { createBookingNotification } from '@/lib/notifications/booking-alerts';
import { enforcePublicRateLimit } from '@/lib/upstash/ratelimit';

const MIN_REVIEW_RATING = 1;
const MAX_REVIEW_RATING = 5;
const MIN_COMMENT_LENGTH = 10;
const MAX_COMMENT_LENGTH = 1500;
const AUTO_SUSPENSION_RESOLVED_THRESHOLD = 3;

const visibilitySchema = z.enum(['public', 'teacher_only', 'admin_only']);
const targetTypeSchema = z.enum(['student', 'teacher', 'store', 'luthier']);
const reasonSchema = z.enum(['fraud', 'harassment', 'no_show', 'inappropriate_content', 'commercial_violation', 'other']);

export type ModerationActionState = { success: boolean; message: string };

function value(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

async function requireAdmin(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) throw new Error('Sessão expirada.');
  const [profile] = await db.select({ role: userProfiles.role }).from(userProfiles).where(eq(userProfiles.id, user.id)).limit(1);
  if (profile?.role !== 'admin') throw new Error('Acesso restrito a administradores.');
  return user.id;
}

async function enforceAutomaticSuspensionIfThresholdReached(input: { targetUserId: string | null; targetDirectoryId: string | null }): Promise<void> {
  const predicates = [];
  if (input.targetUserId) predicates.push(eq(entityReports.targetUserId, input.targetUserId));
  if (input.targetDirectoryId) predicates.push(eq(entityReports.targetDirectoryId, input.targetDirectoryId));
  if (predicates.length === 0) return;
  const [result] = await db.select({ total: count() }).from(entityReports).where(and(eq(entityReports.status, 'resolved'), sql.join(predicates, sql` OR `)));
  const resolvedReportsCount = result?.total ?? 0;
  if (resolvedReportsCount < AUTO_SUSPENSION_RESOLVED_THRESHOLD) return;
  if (input.targetUserId) {
    await db.update(userProfiles).set({ isSuspended: true, acceptsNewStudents: false, suspendedAt: new Date(), suspensionReason: 'Suspensão automática após três denúncias procedentes', resolvedReportsCount }).where(eq(userProfiles.id, input.targetUserId));
    await createBookingNotification({ userId: input.targetUserId, title: 'Perfil suspenso para análise', message: 'Seu perfil foi suspenso preventivamente após denúncias procedentes. Entre em contato com a administração.' });
  }
  if (input.targetDirectoryId) {
    const [directory] = await db.select({ userId: businessDirectory.userId }).from(businessDirectory).where(eq(businessDirectory.id, input.targetDirectoryId)).limit(1);
    await db.update(businessDirectory).set({ isSuspended: true, suspendedAt: new Date(), suspensionReason: 'Suspensão automática após três denúncias procedentes', resolvedReportsCount }).where(eq(businessDirectory.id, input.targetDirectoryId));
    if (directory?.userId) await createBookingNotification({ userId: directory.userId, title: 'Estabelecimento suspenso para análise', message: 'Seu estabelecimento foi suspenso preventivamente após denúncias procedentes.' });
  }
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
    completedAt: classBookings.completedAt,
  }).from(classBookings).where(and(eq(classBookings.id, parsed.data.bookingId), eq(classBookings.studentId, user.id))).limit(1);
  if (!booking || booking.paymentStatus !== 'paid' || booking.status !== 'confirmed' || !booking.completedAt) {
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
  const adminId = await requireAdmin();
  const status = z.enum(['under_review', 'resolved', 'dismissed']).parse(value(formData, 'status'));
  const reportId = z.string().uuid().parse(value(formData, 'reportId'));
  await db.update(entityReports).set({
    status,
    adminNotes: value(formData, 'adminNotes') || null,
    resolvedBy: status === 'resolved' || status === 'dismissed' ? adminId : null,
    resolvedAt: status === 'resolved' || status === 'dismissed' ? new Date() : null,
  }).where(eq(entityReports.id, reportId));
  const [report] = await db.select({ targetUserId: entityReports.targetUserId, targetDirectoryId: entityReports.targetDirectoryId }).from(entityReports).where(eq(entityReports.id, reportId)).limit(1);
  if (report) await enforceAutomaticSuspensionIfThresholdReached(report);
  revalidatePath('/admin');
}

export async function setEntitySuspensionStateAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const entityType = z.enum(['user', 'directory']).parse(value(formData, 'entityType'));
  const entityId = z.string().uuid().parse(value(formData, 'entityId'));
  const suspend = value(formData, 'suspend') === 'true';
  const reason = value(formData, 'reason') || null;
  if (entityType === 'user') {
    await db.update(userProfiles).set({ isSuspended: suspend, suspendedAt: suspend ? new Date() : null, suspensionReason: suspend ? reason : null, acceptsNewStudents: suspend ? false : true }).where(eq(userProfiles.id, entityId));
  } else {
    await db.update(businessDirectory).set({ isSuspended: suspend, suspendedAt: suspend ? new Date() : null, suspensionReason: suspend ? reason : null }).where(eq(businessDirectory.id, entityId));
  }
  revalidatePath('/admin');
  revalidatePath('/professores');
  revalidatePath('/lojas');
  revalidatePath('/luthiers');
  revalidatePath('/dashboard/professor');
  revalidatePath('/dashboard/aluno');
}
