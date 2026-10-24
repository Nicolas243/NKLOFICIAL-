'use server';

import { createHash } from 'node:crypto';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { and, asc, count, desc, eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { partnerProgramReviews, partnerPrograms, partnerSuggestions, userProfiles } from '@/db/schema';

const REVIEWER_COOKIE = 'nkl_partner_reviewer';
const MIN_REASON_WORDS = 20;
const REVIEW_TAGS = ['fácil', 'médio', 'difícil', 'boa remuneração', 'flexível', 'exige experiência'];

type ProgramRow = typeof partnerPrograms.$inferSelect;

function stringArray(value: unknown): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : [];
}

function wordCount(value: string): number {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

async function reviewerHash(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(REVIEWER_COOKIE)?.value;

  if (!token) {
    token = crypto.randomUUID();
    cookieStore.set(REVIEWER_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });
  }

  return createHash('sha256')
    .update(`${token}:${process.env.SUPABASE_REVIEW_SALT ?? 'portal-nkl-review'}`)
    .digest('hex');
}

async function requireAdmin(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const [profile] = await db
    .select({ role: userProfiles.role })
    .from(userProfiles)
    .where(eq(userProfiles.id, user.id))
    .limit(1);

  if (profile?.role !== 'admin') {
    throw new Error('Acesso negado. Apenas administradores podem executar esta ação.');
  }
}

export type PartnerProgramCard = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  category: string;
  difficulty: string;
  tags: string[];
  websiteUrl: string;
  affiliateUrl: string | null;
  editorialRating: number;
  editorialSource: string;
  finalRating: number;
  communityRating: number | null;
  communityReviewCount: number;
  communityTags: string[];
};

export async function getPartnerPrograms(): Promise<PartnerProgramCard[]> {
  const programs = await db
    .select()
    .from(partnerPrograms)
    .where(eq(partnerPrograms.status, 'published'))
    .orderBy(asc(partnerPrograms.name));

  if (programs.length === 0) {
    return [];
  }

  const reviews = await db
    .select({
      programId: partnerProgramReviews.programId,
      rating: partnerProgramReviews.rating,
      tags: partnerProgramReviews.tags,
    })
    .from(partnerProgramReviews)
    .where(eq(partnerProgramReviews.status, 'published'));

  const reviewByProgram = new Map<string, typeof reviews>();
  for (const review of reviews) {
    const current = reviewByProgram.get(review.programId) ?? [];
    current.push(review);
    reviewByProgram.set(review.programId, current);
  }

  return programs.map((program) => {
    const programReviews = reviewByProgram.get(program.id) ?? [];
    const communityTags = programReviews.length >= 5
      ? Array.from(new Set(programReviews.flatMap((review) => stringArray(review.tags))))
      : [];
    const communityRating = programReviews.length > 0
      ? Number((programReviews.reduce((total, review) => total + review.rating, 0) / programReviews.length).toFixed(1))
      : null;

    return {
      id: program.id,
      slug: program.slug,
      name: program.name,
      shortDescription: program.shortDescription,
      longDescription: program.longDescription,
      category: program.category,
      difficulty: program.difficulty,
      tags: stringArray(program.tags),
      websiteUrl: program.websiteUrl,
      affiliateUrl: program.affiliateUrl,
      editorialRating: program.editorialRating,
      editorialSource: program.editorialSource,
      communityRating,
      finalRating: communityRating === null
        ? program.editorialRating
        : Number(((program.editorialRating + communityRating) / 2).toFixed(1)),
      communityReviewCount: programReviews.length,
      communityTags,
    };
  });
}

export async function submitPartnerReview(formData: FormData): Promise<void> {
  const programId = typeof formData.get('programId') === 'string' ? formData.get('programId') as string : '';
  const reason = typeof formData.get('reason') === 'string' ? (formData.get('reason') as string).trim() : '';
  const rating = Number(formData.get('rating'));
  const tags = formData.getAll('tags')
    .filter((tag): tag is string => typeof tag === 'string')
    .filter((tag) => REVIEW_TAGS.includes(tag));

  if (!programId || !Number.isInteger(rating) || rating < 0 || rating > 10) {
    throw new Error('Programa ou nota inválida.');
  }

  if (wordCount(reason) < MIN_REASON_WORDS) {
    throw new Error(`Explique sua experiência com pelo menos ${MIN_REASON_WORDS} palavras.`);
  }

  const [program] = await db
    .select({ id: partnerPrograms.id })
    .from(partnerPrograms)
    .where(and(eq(partnerPrograms.id, programId), eq(partnerPrograms.status, 'published')))
    .limit(1);

  if (!program) {
    throw new Error('Programa não encontrado.');
  }

  await db.insert(partnerProgramReviews).values({
    programId,
    reviewerKeyHash: await reviewerHash(),
    rating,
    reason,
    tags,
  }).onConflictDoUpdate({
    target: [partnerProgramReviews.programId, partnerProgramReviews.reviewerKeyHash],
    set: { rating, reason, tags, status: 'published' },
  });

  revalidatePath('/programas');
}

export async function submitPartnerSuggestion(formData: FormData): Promise<void> {
  const name = typeof formData.get('name') === 'string' ? (formData.get('name') as string).trim() : '';
  const websiteUrl = typeof formData.get('websiteUrl') === 'string' ? (formData.get('websiteUrl') as string).trim() : '';
  const reason = typeof formData.get('reason') === 'string' ? (formData.get('reason') as string).trim() : '';

  if (!name || wordCount(reason) < 10) {
    throw new Error('Informe o nome e explique a sugestão com pelo menos 10 palavras.');
  }

  await db.insert(partnerSuggestions).values({
    name,
    websiteUrl: websiteUrl || null,
    reason,
  });

  revalidatePath('/programas/admin');
}

export type PartnerAdminProgram = ProgramRow & {
  reviewCount: number;
};

export async function getPartnerAdminData(): Promise<{
  programs: PartnerAdminProgram[];
  suggestions: typeof partnerSuggestions.$inferSelect[];
}> {
  await requireAdmin();

  const [programs, suggestions, reviewCounts] = await Promise.all([
    db.select().from(partnerPrograms).orderBy(asc(partnerPrograms.name)),
    db.select().from(partnerSuggestions).where(eq(partnerSuggestions.status, 'pending')).orderBy(desc(partnerSuggestions.createdAt)),
    db
      .select({ programId: partnerProgramReviews.programId, value: count() })
      .from(partnerProgramReviews)
      .groupBy(partnerProgramReviews.programId),
  ]);

  const counts = new Map(reviewCounts.map((item) => [item.programId, item.value]));
  return {
    programs: programs.map((program) => ({ ...program, reviewCount: counts.get(program.id) ?? 0 })),
    suggestions,
  };
}

export async function updatePartnerProgram(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = typeof formData.get('id') === 'string' ? formData.get('id') as string : '';
  const affiliateUrl = typeof formData.get('affiliateUrl') === 'string' ? (formData.get('affiliateUrl') as string).trim() : '';
  const status = typeof formData.get('status') === 'string' ? formData.get('status') as string : 'published';
  const editorialRating = Number(formData.get('editorialRating'));

  if (!id || !['published', 'draft'].includes(status) || !Number.isInteger(editorialRating) || editorialRating < 0 || editorialRating > 10) {
    throw new Error('Dados administrativos inválidos.');
  }

  await db.update(partnerPrograms).set({
    affiliateUrl: affiliateUrl || null,
    editorialRating,
    status,
    updatedAt: new Date(),
  }).where(eq(partnerPrograms.id, id));

  revalidatePath('/programas');
  revalidatePath('/programas/admin');
}

export async function approvePartnerSuggestion(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = typeof formData.get('id') === 'string' ? formData.get('id') as string : '';

  if (!id) {
    throw new Error('Sugestão inválida.');
  }

  await db.update(partnerSuggestions).set({ status: 'approved' }).where(eq(partnerSuggestions.id, id));
  revalidatePath('/programas/admin');
}

export async function rejectPartnerSuggestion(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = typeof formData.get('id') === 'string' ? formData.get('id') as string : '';

  if (!id) {
    throw new Error('Sugestão inválida.');
  }

  await db.update(partnerSuggestions).set({ status: 'rejected' }).where(eq(partnerSuggestions.id, id));
  revalidatePath('/programas/admin');
}
