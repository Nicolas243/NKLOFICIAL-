import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { upsertLuthierProfile } from '@/actions/profile';

export const metadata = {
  title: 'Perfil de Luthier | Portal NKL',
};

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.id, user.id))
    .limit(1);

  return (
    <div className="max-w-2xl w-full mx-auto px-4 pt-8">
      <h1 className="font-playfair text-3xl font-bold mb-2">Perfil de Luthier</h1>
      <p className="text-sm opacity-70 mb-8">
        Cadastre seus dados para se habilitar como luthier no mercado.
      </p>

      <form
        action={upsertLuthierProfile}
        className="flex flex-col gap-4 bg-surface border border-border rounded-xl p-6 shadow-sm"
      >
        <input
          type="text"
          name="fullName"
          defaultValue={profile?.fullName ?? ''}
          placeholder="Nome completo"
          className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
        />
        <input
          type="text"
          name="businessName"
          defaultValue={profile?.businessName ?? ''}
          placeholder="Nome do ateliê / loja"
          className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
        />
        <input
          type="text"
          name="city"
          defaultValue={profile?.city ?? ''}
          placeholder="Cidade"
          className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
        />
        <input
          type="text"
          name="state"
          defaultValue={profile?.state ?? ''}
          placeholder="Estado (ex.: SP)"
          maxLength={2}
          className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
        />
        <button
          type="submit"
          className="py-3 bg-text text-bg rounded-md font-bold transition-all hover:opacity-90"
        >
          Salvar perfil de luthier
        </button>
      </form>
    </div>
  );
}