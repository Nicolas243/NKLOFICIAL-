'use server';

import { createHash } from 'node:crypto';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { and, asc, count, desc, eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { partnerProgramReviews, partnerPrograms, partnerReferralLeads, partnerSuggestions, userProfiles } from '@/db/schema';
import { enforcePublicRateLimit } from '@/lib/upstash/ratelimit';

const REVIEWER_COOKIE = 'nkl_partner_reviewer';
const MIN_REASON_WORDS = 20;
const REVIEW_TAGS = [
  'fácil',
  'médio',
  'difícil',
  'boa remuneração',
  'flexível',
  'exige experiência',
  'pagamento pontual',
  'suporte eficiente',
  'cadastro simples',
  'tarefas interessantes',
  'boa oferta de tarefas',
  'baixa remuneração',
  'poucas tarefas disponíveis',
  'pagamento atrasado',
  'suporte ruim',
  'cadastro demorado',
  'requisitos confusos',
  'tarefas repetitivas',
];
const REVIEW_CURRENCIES = ['BRL', 'USD', 'EUR'] as const;
const REVIEW_PERIODS = ['hora', 'dia', 'semana', 'trabalho'] as const;

type ProgramRow = typeof partnerPrograms.$inferSelect;

function stringArray(value: unknown): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : [];
}

function wordCount(value: string): number {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

const HIGH_QUALITY_LOGOS: Record<string, string> = {
  billo: '/partner-logos/billo.png',
  'claru-ia': '/partner-logos/claru-ai.png',
  apphub: 'https://app.hub.xyz/favicon.ico',
  crowdato: '/partner-logos/crowdato.png',
  oneforma: '/partner-logos/oneforma.png',
  'outlier-ai': '/partner-logos/outlier.webp',
  utest: 'https://utest.com/favicon.ico',
  dataannotation: '/partner-logos/dataannotation.png',
  'marketplaces-afiliados': '/partner-logos/marketplaces.png',
  'tiktok-shop': '/NKL/tiktoklogo.png',
};

const PROGRAM_EDITORIAL_META: Record<string, { averageEarning: string; languages: string[] }> = {
  fluencify: { averageEarning: 'R$ 80 ±', languages: ['Português'] },
  prolific: { averageEarning: 'US$ 40 ±', languages: ['Português', 'Inglês'] },
  'mercado-pago': { averageEarning: 'R$ 50 ±', languages: ['Português'] },
  honeygain: { averageEarning: 'US$ 20 ±', languages: ['Português', 'Inglês'] },
  apphub: { averageEarning: 'US$ 50 ±', languages: ['Português', 'Inglês'] },
  'quintoandar-indica-ai': { averageEarning: 'R$ 100 + comissão', languages: ['Português'] },
  billo: { averageEarning: 'US$ 50 ±', languages: ['Inglês'] },
  'claru-ia': { averageEarning: 'US$ 30 ±', languages: ['Português', 'Inglês'] },
  crowdato: { averageEarning: 'US$ 40 ±', languages: ['Português', 'Inglês'] },
  oneforma: { averageEarning: 'US$ 100 ±', languages: ['Português', 'Inglês'] },
  'outlier-ai': { averageEarning: 'US$ 300 ±', languages: ['Português', 'Inglês'] },
  utest: { averageEarning: 'US$ 50 ±', languages: ['Português', 'Inglês'] },
  dataannotation: { averageEarning: 'US$ 200 ±', languages: ['Português', 'Inglês'] },
  aligner: { averageEarning: 'US$ 100 ±', languages: ['Português', 'Inglês'] },
  'marketplaces-afiliados': { averageEarning: 'R$ 300 ±', languages: ['Português'] },
  'tiktok-shop': { averageEarning: 'R$ 150 ±', languages: ['Português'] },
};

function logoUrl(slug: string, websiteUrl: string): string {
  const highQualityLogo = HIGH_QUALITY_LOGOS[slug];
  if (highQualityLogo) return highQualityLogo;

  try {
    const hostname = new URL(websiteUrl).hostname.replace(/^www\./u, '');
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=256`;
  } catch {
    return '';
  }
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

async function requestIdentifier(): Promise<string> {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwardedFor || requestHeaders.get('x-real-ip')?.trim() || 'unknown';
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
  logoUrl: string;
  affiliateUrl: string | null;
  editorialRating: number;
  editorialSource: string;
  averageEarning: string;
  languages: string[];
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
      logoUrl: logoUrl(program.slug, program.websiteUrl),
      affiliateUrl: program.affiliateUrl,
      editorialRating: Math.min(9, Math.max(6, program.editorialRating)),
      editorialSource: program.editorialSource,
      averageEarning: PROGRAM_EDITORIAL_META[program.slug]?.averageEarning ?? 'R$ 100 ±',
      languages: PROGRAM_EDITORIAL_META[program.slug]?.languages ?? ['Português', 'Inglês'],
      communityRating,
      finalRating: communityRating === null
        ? Math.min(9, Math.max(6, program.editorialRating))
        : Math.min(10, Math.max(0, Number(((program.editorialRating + communityRating) / 2).toFixed(1)))),
      communityReviewCount: programReviews.length,
      communityTags,
    };
  });
}

export async function submitPartnerReview(formData: FormData): Promise<void> {
  await enforcePublicRateLimit('partner-review', await requestIdentifier());

  const programId = typeof formData.get('programId') === 'string' ? formData.get('programId') as string : '';
  const reason = typeof formData.get('reason') === 'string' ? (formData.get('reason') as string).trim() : '';
  const rating = Number(formData.get('rating'));
  const tags = formData.getAll('tags')
    .filter((tag): tag is string => typeof tag === 'string')
    .filter((tag) => REVIEW_TAGS.includes(tag));

  const payAmountRaw = typeof formData.get('payAmount') === 'string' ? (formData.get('payAmount') as string).trim().replace(',', '.') : '';
  const payCurrency = typeof formData.get('payCurrency') === 'string' ? formData.get('payCurrency') as string : '';
  const payPeriod = typeof formData.get('payPeriod') === 'string' ? formData.get('payPeriod') as string : '';
  const payAmount = payAmountRaw ? Number(payAmountRaw) : null;

  if (!programId || !Number.isInteger(rating) || rating < 0 || rating > 10) {
    throw new Error('Programa ou nota inválida.');
  }

  if (payAmountRaw && (!Number.isFinite(payAmount) || payAmount === null || payAmount <= 0 || !REVIEW_CURRENCIES.includes(payCurrency as typeof REVIEW_CURRENCIES[number]) || !REVIEW_PERIODS.includes(payPeriod as typeof REVIEW_PERIODS[number]))) {
    throw new Error('Informe valor, moeda e período válidos para a remuneração.');
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
    payAmount: payAmount === null ? null : payAmount.toFixed(2),
    payCurrency: payAmount === null ? null : payCurrency,
    payPeriod: payAmount === null ? null : payPeriod,
    reason,
    tags,
  }).onConflictDoUpdate({
    target: [partnerProgramReviews.programId, partnerProgramReviews.reviewerKeyHash],
    set: {
      rating,
      payAmount: payAmount === null ? null : payAmount.toFixed(2),
      payCurrency: payAmount === null ? null : payCurrency,
      payPeriod: payAmount === null ? null : payPeriod,
      reason,
      tags,
      status: 'published',
    },
  });

  revalidatePath('/programas');
  revalidatePath('/blog/renda-extra');
}

export async function submitPartnerSuggestion(formData: FormData): Promise<void> {
  await enforcePublicRateLimit('partner-suggestion', await requestIdentifier());

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

export async function submitPartnerReferralLead(formData: FormData): Promise<void> {
  await enforcePublicRateLimit('partner-referral-lead', await requestIdentifier());

  const programId = typeof formData.get('programId') === 'string' ? formData.get('programId') as string : '';
  const contactName = typeof formData.get('contactName') === 'string' ? (formData.get('contactName') as string).trim() : '';
  const phone = typeof formData.get('phone') === 'string' ? (formData.get('phone') as string).trim() : '';

  if (!programId || contactName.length < 2 || contactName.length > 180) {
    throw new Error('Informe um nome válido.');
  }

  if (!/^[0-9+()\s-]{8,30}$/u.test(phone)) {
    throw new Error('Informe um telefone válido.');
  }

  const [program] = await db
    .select({ id: partnerPrograms.id })
    .from(partnerPrograms)
    .where(and(eq(partnerPrograms.id, programId), eq(partnerPrograms.slug, 'quintoandar-indica-ai'), eq(partnerPrograms.status, 'published')))
    .limit(1);

  if (!program) {
    throw new Error('Programa de indicação não encontrado.');
  }

  await db.insert(partnerReferralLeads).values({
    programId,
    contactName,
    phone,
    consentConfirmed: false,
  });

  revalidatePath('/programas');
  revalidatePath('/blog/renda-extra');
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

  if (!id || !['published', 'draft'].includes(status) || !Number.isInteger(editorialRating) || editorialRating < 6 || editorialRating > 9) {
    throw new Error('Dados administrativos inválidos.');
  }

  await db.update(partnerPrograms).set({
    affiliateUrl: affiliateUrl || null,
    editorialRating,
    status,
    updatedAt: new Date(),
  }).where(eq(partnerPrograms.id, id));

  revalidatePath('/programas');
  revalidatePath('/blog/renda-extra');
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
