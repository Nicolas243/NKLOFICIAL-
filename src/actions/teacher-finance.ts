'use server';

import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { MIN_CLASS_PRICE_CENTS, MAX_PLAN_PRICE_CENTS } from '@/lib/pricing';

const priceSchema = z.coerce.number().min(MIN_CLASS_PRICE_CENTS / 100).max(MAX_PLAN_PRICE_CENTS / 100);
const teacherPricingSchema = z.object({
  singleClassPrice: priceSchema,
  monthlyPlanPrice: priceSchema,
  semiannualPlanPrice: priceSchema,
  annualPlanPrice: priceSchema,
  acceptsNewStudents: z.coerce.boolean(),
});

export type TeacherFinanceState = { success: boolean; message: string };

export async function updateTeacherPricingAction(
  _previousState: TeacherFinanceState,
  formData: FormData,
): Promise<TeacherFinanceState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return { success: false, message: 'Sessão expirada.' };
  const result = teacherPricingSchema.safeParse({
    singleClassPrice: formData.get('singleClassPrice'),
    monthlyPlanPrice: formData.get('monthlyPlanPrice'),
    semiannualPlanPrice: formData.get('semiannualPlanPrice'),
    annualPlanPrice: formData.get('annualPlanPrice'),
    acceptsNewStudents: formData.get('acceptsNewStudents') === 'on',
  });
  if (!result.success) return { success: false, message: 'Informe valores válidos para todos os planos.' };
  const values = result.data;
  await db.update(userProfiles).set({
    singleClassPriceCents: Math.round(values.singleClassPrice * 100),
    monthlyPlanPriceCents: Math.round(values.monthlyPlanPrice * 100),
    semiannualPlanPriceCents: Math.round(values.semiannualPlanPrice * 100),
    annualPlanPriceCents: Math.round(values.annualPlanPrice * 100),
    acceptsNewStudents: values.acceptsNewStudents,
  }).where(and(eq(userProfiles.id, user.id), eq(userProfiles.papel, 'Professor')));
  return { success: true, message: 'Planos atualizados.' };
}

export async function disconnectMercadoPagoAction(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return;
  await db.update(userProfiles).set({
    mpAccessToken: null,
    mpRefreshToken: null,
    mpCollectorId: null,
    mpTokenExpiresAt: null,
  }).where(eq(userProfiles.id, user.id));
}

export async function simulateDevMercadoPagoConnectAction(): Promise<TeacherFinanceState> {
  if (process.env.NODE_ENV === 'production') return { success: false, message: 'Simulação indisponível em produção.' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return { success: false, message: 'Sessão expirada.' };
  await db.update(userProfiles).set({ mpCollectorId: `dev-${user.id}`, mpAccessToken: 'development-token', mpConnectedAt: new Date() }).where(eq(userProfiles.id, user.id));
  return { success: true, message: 'Conta simulada para desenvolvimento.' };
}
