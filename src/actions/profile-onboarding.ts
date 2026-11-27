'use server';

import { revalidatePath } from 'next/cache';
import { eq, or } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { buildReturnPath, safeNextPath } from '@/lib/auth/oauth';
import { parseGuideResumeIntent } from '@/lib/auth/return-intent';
import { includesMusic, parseOnboardingContext } from '@/lib/auth/onboarding';

export type OnboardingState = {
  error?: string;
  redirectTo?: string;
};

function formString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

const MUSIC_ROLES = new Set(['Musico', 'Músico', 'Lojista', 'Luthier', 'Professor', 'Aluno']);

function selectedRoles(formData: FormData): string[] {
  return formData
    .getAll('papel')
    .filter((value): value is string => typeof value === 'string')
    .map((value) => {
      const trimmed = value.trim();
      return trimmed === 'Musico' ? 'Músico' : trimmed;
    })
    .filter((value, index, values) => MUSIC_ROLES.has(value) && values.indexOf(value) === index);
}

export async function completeProfileOnboarding(
  _previousState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    return { error: 'Sua sessão expirou. Entre novamente para continuar.' };
  }

  const context = parseOnboardingContext(formData.get('context'));
  if (!context) {
    return { error: 'Escolha quais áreas do Portal NKL você deseja usar.' };
  }

  const papeis = selectedRoles(formData);
  const papel = papeis.join(', ');
  const instrumento = formString(formData, 'instrumento');
  const yearsValue = formString(formData, 'anosExperiencia');
  const anosExperiencia = yearsValue === '' ? 0 : Number(yearsValue);

  if (includesMusic(context)) {
    if (papeis.length === 0 || !instrumento) {
      return { error: 'Informe seu papel e instrumento principal.' };
    }
    if (!Number.isInteger(anosExperiencia) || anosExperiencia < 0 || anosExperiencia > 80) {
      return { error: 'Informe uma experiência entre 0 e 80 anos.' };
    }
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      nkl_context: context,
      nkl_onboarding_completed: true,
    },
  });

  if (metadataError) {
    console.error('[PROFILE] Falha ao salvar contexto do onboarding:', metadataError.message);
    return { error: 'Não foi possível salvar suas preferências. Tente novamente.' };
  }

  try {
    const [existingProfile] = await db
      .select({
        id: userProfiles.id,
        role: userProfiles.role,
        fullName: userProfiles.fullName,
      })
      .from(userProfiles)
      .where(or(eq(userProfiles.id, user.id), eq(userProfiles.email, user.email)))
      .limit(1);

    const providerName = user.user_metadata?.full_name ?? user.user_metadata?.name;
    const fullName = existingProfile?.fullName
      || (typeof providerName === 'string' ? providerName.trim() : null)
      || null;
    const profileRole = existingProfile?.role === 'admin'
      ? 'admin'
      : includesMusic(context) && papeis.includes('Luthier')
        ? 'luthier'
        : existingProfile?.role ?? 'user';
    const profileId = existingProfile?.id ?? user.id;

    const musicProfileEnabled = includesMusic(context);
    const incomeProfileEnabled = context === 'income' || context === 'both';

    if (existingProfile) {
      await db
        .update(userProfiles)
        .set({
          email: user.email,
          role: profileRole,
          fullName,
          musicProfileEnabled,
          incomeProfileEnabled,
          ...(musicProfileEnabled
            ? {
                papel,
                instrumento,
                anosExperiencia,
              }
            : {}),
        })
        .where(eq(userProfiles.id, existingProfile.id));
    } else {
      await db.insert(userProfiles).values({
        id: profileId,
        email: user.email,
        role: profileRole,
        fullName,
        musicProfileEnabled,
        incomeProfileEnabled,
        papel: musicProfileEnabled ? papel : null,
        instrumento: musicProfileEnabled ? instrumento : null,
        anosExperiencia: musicProfileEnabled ? anosExperiencia : 0,
      });
    }
  } catch (error) {
    console.error(
      '[PROFILE] Falha ao salvar dados do onboarding:',
      error instanceof Error ? error.message : 'erro desconhecido',
    );
    return { error: 'Não foi possível salvar seu perfil. Tente novamente.' };
  }

  revalidatePath('/perfil');
  revalidatePath('/', 'layout');

  const nextPath = safeNextPath(formString(formData, 'next') || '/perfil');
  const resumeIntent = parseGuideResumeIntent(formString(formData, 'resume') || null);
  return { redirectTo: buildReturnPath(nextPath, resumeIntent) };
}
