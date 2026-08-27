import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userProfiles, businessDirectory } from '@/db/schema';
import { upsertBusinessData } from '@/actions/business';

export const metadata = {
  title: 'Dashboard de Luthier | Portal NKL',
};

export default async function DashboardLuthierPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect('/login');
  }

  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.id, user.id))
    .limit(1);

  // Redirecionamento de borda: apenas luthiers acessam este dashboard.
  if (!profile || profile.role !== 'luthier') {
    redirect('/');
  }

  const [business] = await db
    .select()
    .from(businessDirectory)
    .where(eq(businessDirectory.userId, user.id))
    .limit(1);

  // Mitigação de nulos: quando não há registro comercial,
  // o formulário pré-popula com os dados públicos do perfil de luthier.
  const businessName = business?.businessName ?? profile.businessName ?? '';
  const city = business?.city ?? profile.city ?? '';
  const state = business?.state ?? profile.state ?? '';
  const whatsapp = business?.whatsapp ?? '';

  return (
    <div className="max-w-2xl w-full mx-auto px-4 pt-8">
      <h1 className="font-playfair text-3xl font-bold mb-2">Dashboard Comercial</h1>
      <p className="text-sm opacity-70 mb-8">
        Gerencie os dados públicos do seu ateliê para o diretório B2B de luthiers.
      </p>

      <form
        action={upsertBusinessData}
        className="flex flex-col gap-4 bg-surface border border-border rounded-xl p-6 shadow-sm"
      >
        <input
          type="text"
          name="businessName"
          defaultValue={businessName}
          placeholder="Nome do ateliê / loja"
          required
          className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            name="city"
            defaultValue={city}
            placeholder="Cidade"
            required
            className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
          />
          <input
            type="text"
            name="state"
            defaultValue={state}
            placeholder="Estado (ex.: SP)"
            required
            maxLength={2}
            className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
          />
        </div>
        <input
          type="tel"
          name="whatsapp"
          defaultValue={whatsapp}
          placeholder="WhatsApp (ex.: 5511999999999)"
          className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
        />
        <button
          type="submit"
          className="py-3 bg-text text-bg rounded-md font-bold transition-all hover:opacity-90"
        >
          Salvar dados comerciais
        </button>
      </form>
    </div>
  );
}