import { redirect } from 'next/navigation';
import Link from 'next/link';
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

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-8">
        <Link
          href="/perfil/avaliacoes"
          className="inline-flex items-center gap-2 text-sm font-bold text-neon hover:underline"
        >
          → Minhas Avaliações
        </Link>
        <Link
          href="/perfil/notificacoes"
          className="inline-flex items-center gap-2 text-sm font-bold text-neon hover:underline"
        >
          → Notificações
        </Link>
        <Link
          href="/perfil/privacidade"
          className="inline-flex items-center gap-2 text-sm font-bold text-neon hover:underline"
        >
          → Privacidade e Dados
        </Link>
      </div>

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
        <textarea
          name="bio"
          defaultValue={profile?.bio ?? ''}
          placeholder="Conte um pouco sobre seu trabalho (biografia pública)"
          rows={4}
          className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none resize-none"
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