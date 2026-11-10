'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { isUuid } from '@/lib/uuid';
import { getLoginErrorMessage } from '@/lib/auth/errors';
import { safeNextPath } from '@/lib/auth/oauth';
import { syncAuthenticatedProfile } from '@/lib/auth/profile-sync';

/**
 * IDENTIDADE (LGPD / integridade do grafo): o `user_profiles` DEVE ser
 * criado com `id = auth.users.id`. Antes, o insert omitia o id e o banco
 * aplicava `defaultRandom()`, gerando um perfil órfão que quebrava
 * favorites/compliance/portfolio/leads/pagamentos para recém-registrados.
 */
async function upsertUserProfile(params: {
  userId: string;
  email: string;
  role: string;
  fullName?: string | null;
  papel?: string | null;
  instrumento?: string | null;
  anosExperiencia?: number | null;
  newsletterOptIn?: boolean;
  birthDate?: string | null;
}): Promise<void> {
  const {
    userId,
    email,
    role,
    fullName,
    papel,
    instrumento,
    anosExperiencia,
    newsletterOptIn,
    birthDate,
  } = params;

  await db
    .insert(userProfiles)
    .values({
      id: userId,
      email,
      role,
      fullName: fullName ?? null,
      papel: papel ?? null,
      instrumento: instrumento ?? null,
      anosExperiencia: anosExperiencia ?? 0,
      newsletterOptIn: newsletterOptIn ?? false,
      birthDate: birthDate ?? null,
    })
    .onConflictDoUpdate({
      target: userProfiles.id,
      set: {
        email,
        fullName: fullName ?? null,
        papel: papel ?? null,
        instrumento: instrumento ?? null,
        anosExperiencia: anosExperiencia ?? 0,
        newsletterOptIn: newsletterOptIn ?? false,
        birthDate: birthDate ?? null,
      },
    });
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error, data } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(getLoginErrorMessage(error))}`);
  }

  // Usuários legados podem não ter user_profiles (perfil nascia só no bootstrap
  // luthier). Garantir a linha de identidade no login evita FKs quebradas.
  if (data.user?.id) {
    const profileSync = await syncAuthenticatedProfile(data.user);
    if (!profileSync.ok) {
      redirect(`/login?error=${encodeURIComponent(profileSync.message)}`);
    }
  }

  revalidatePath('/', 'layout');
  redirect('/'); // Ou redirecione para uma rota de dashboard/perfil
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error, data } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect('/login?error=Falha ao criar conta. Verifique os dados.');
  }

  if (data.user?.id) {
    try {
      await upsertUserProfile({
        userId: data.user.id,
        email: data.user.email ?? email,
        role: 'user',
      });
    } catch (profileError) {
      console.error('[signup] Falha ao gravar perfil:', profileError);
    }
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function registerWithProfile(formData: FormData): Promise<{ error?: string }> {
  'use server';
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const firstName = (formData.get('firstName') as string) || '';
  const lastName = (formData.get('lastName') as string) || '';
  const fullName = (formData.get('fullName') as string) || `${firstName} ${lastName}`.trim();
  const birthDate = formData.get('birthDate') as string;
  const papel = (formData.get('papel') as string) || 'user';
  const instrumento = (formData.get('instrumento') as string) || '';
  const anosExperiencia = Number(formData.get('anosExperiencia')) || 0;
  const newsletterOptIn = formData.get('newsletterOptIn') === 'on';

  if (!email || !password || password.length < 8) {
    return { error: 'E-mail obrigatório e senha deve ter no mínimo 8 caracteres.' };
  }

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, papel, instrumento, anos_experiencia: anosExperiencia },
    },
  });

  if (error) {
    return { error: error.message };
  }

  const authUser = data.user;
  if (!authUser?.id || !isUuid(authUser.id)) {
    return { error: 'Falha ao identificar a conta criada. Tente novamente.' };
  }
  const userId = authUser.id;

  // Grava os metadados de onboarding na tabela userProfiles VINCULADOS ao
  // uid do Supabase (nunca mais a um id aleatório do `defaultRandom`).
  try {
    await upsertUserProfile({
      userId,
      email: authUser.email ?? email,
      role: papel === 'Luthier' ? 'luthier' : 'user',
      fullName,
      papel,
      instrumento,
      anosExperiencia,
      newsletterOptIn,
      birthDate: birthDate || null,
    });
  } catch (profileError) {
    console.error('[registerWithProfile] Falha ao gravar perfil:', profileError);
    // Não bloqueia o fluxo — a conta já foi criada com sucesso.
  }

  // Quando a confirmação de e-mail está ativa, o Supabase não retorna sessão.
  // Não tentamos autenticar novamente antes da confirmação.
  if (!data.session) {
    revalidatePath('/', 'layout');
    return {
      error: 'Conta criada. Confirme seu e-mail antes de entrar.',
    };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function retryProfileSync(nextPath = '/'): Promise<{ error?: string; redirectTo?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { error: 'Sua sessão expirou. Entre novamente para sincronizar o perfil.' };
  }

  const result = await syncAuthenticatedProfile(data.user);
  return result.ok
    ? { redirectTo: safeNextPath(nextPath) }
    : { error: result.message };
}