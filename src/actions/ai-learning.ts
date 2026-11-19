'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { aiAccessGrants, aiLearningProgress } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { AI_PRODUCT_KEY } from '@/lib/ai-product';
import { canAccessAiProduct } from '@/lib/ai-access';
import { calculateAiProgress, getAiCourseLessons, type AiProgress } from '@/lib/ai-course';

const lessonSchema = z.object({
  lessonSlug: z.string().trim().min(1).max(120),
});

export type AiLearningAccess = {
  userId: string;
  hasAccess: boolean;
  progress: AiProgress;
  completedLessonIds: string[];
};

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect('/login?next=%2Fia%2Fcurso');
  }

  return user.id;
}

async function readAccessGrant(userId: string) {
  const [grant] = await db
    .select({
      status: aiAccessGrants.status,
      accessUntil: aiAccessGrants.accessUntil,
    })
    .from(aiAccessGrants)
    .where(and(
      eq(aiAccessGrants.userId, userId),
      eq(aiAccessGrants.productKey, AI_PRODUCT_KEY),
    ))
    .limit(1);

  return canAccessAiProduct({
    userId,
    accessStatus: grant?.status ?? 'none',
    accessUntil: grant?.accessUntil,
  });
}

export async function getAiLearningAccess(): Promise<AiLearningAccess> {
  const userId = await requireUserId();
  const hasAccess = await readAccessGrant(userId);
  const lessonIds = getAiCourseLessons().map((lesson) => lesson.id);
  const completedRows = hasAccess
    ? await db
      .select({ lessonSlug: aiLearningProgress.lessonSlug })
      .from(aiLearningProgress)
      .where(and(
        eq(aiLearningProgress.userId, userId),
        inArray(aiLearningProgress.lessonSlug, lessonIds),
      ))
    : [];
  const completedLessonIds = completedRows.map((row) => row.lessonSlug);

  return {
    userId,
    hasAccess,
    completedLessonIds,
    progress: calculateAiProgress(completedLessonIds, lessonIds),
  };
}

export async function completeAiLesson(input: unknown): Promise<{ success: true } | { success: false; message: string }> {
  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: 'Lição inválida.' };
  }

  const userId = await requireUserId();
  if (!(await readAccessGrant(userId))) {
    return { success: false, message: 'Seu acesso ao curso de IA não está ativo.' };
  }

  const lesson = getAiCourseLessons().find((item) => item.id === parsed.data.lessonSlug);
  if (!lesson) {
    return { success: false, message: 'Lição não encontrada.' };
  }

  await db.insert(aiLearningProgress).values({
    userId,
    lessonSlug: lesson.id,
  }).onConflictDoUpdate({
    target: [aiLearningProgress.userId, aiLearningProgress.lessonSlug],
    set: { completedAt: new Date() },
  });

  revalidatePath('/ia/curso');
  revalidatePath(`/ia/curso/${lesson.moduleSlug}`);
  revalidatePath('/ia/progresso');

  return { success: true };
}
