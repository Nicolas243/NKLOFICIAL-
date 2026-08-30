'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect('/login?error=Credenciais inválidas');
  }

  revalidatePath('/', 'layout');
  redirect('/'); // Ou redirecione para uma rota de dashboard/perfil
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect('/login?error=Falha ao criar conta. Verifique os dados.');
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function registerWithProfile(formData: FormData): Promise<{ error?: string }> {
  'use server';
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const papel = formData.get('papel') as string;
  const instrumento = formData.get('instrumento') as string;
  const anosExperiencia = Number(formData.get('anosExperiencia')) || 0;
  const newsletterOptIn = formData.get('newsletterOptIn') === 'on';

  if (!email || !password || password.length < 8) {
    return { error: 'E-mail obrigatório e senha deve ter no mínimo 8 caracteres.' };
  }

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, papel, instrumento, anos_experiencia: anosExperiencia } },
  });

  if (error) {
    return { error: error.message };
  }

  // Grava os metadados de onboarding na tabela userProfiles
  if (data.user) {
    try {
      await db.insert(userProfiles).values({
        email,
        role: papel || 'user',
        fullName,
        papel,
        instrumento,
        anosExperiencia,
        newsletterOptIn,
      });
    } catch (profileError) {
      console.error('[registerWithProfile] Falha ao gravar perfil:', profileError);
      // Não bloqueia o fluxo — a conta já foi criada com sucesso
    }
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