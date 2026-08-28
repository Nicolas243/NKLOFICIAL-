import { redirect } from 'next/navigation';
import { count, eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userProfiles, businessDirectory, luthierLeads } from '@/db/schema';
import { upsertBusinessData } from '@/actions/business';
import { addPortfolioItem, deletePortfolioItem, getLuthierPortfolio } from '@/actions/portfolio';

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

  const [[leadCountRow], portfolio] = await Promise.all([
    db
      .select({ value: count() })
      .from(luthierLeads)
      .where(eq(luthierLeads.luthierId, user.id)),
    getLuthierPortfolio(user.id),
  ]);
  const leadCount = leadCountRow?.value ?? 0;

  return (
    <div className="max-w-3xl w-full mx-auto px-4 pt-8 flex flex-col gap-12">
      <div>
        <h1 className="font-playfair text-3xl font-bold mb-2">Dashboard Comercial</h1>
        <p className="text-sm opacity-70">
          Gerencie os dados públicos do seu ateliê e acompanhe suas métricas de conversão.
        </p>
      </div>

      {/* Métricas de Sucesso */}
      <section className="bg-surface border border-border rounded-xl p-6 shadow-sm">
        <h2 className="font-playfair text-xl font-bold mb-4">Métricas de Sucesso</h2>
        <div className="flex items-center gap-6">
          <div>
            <div className="text-3xl font-bold text-neon">{leadCount}</div>
            <div className="text-xs uppercase tracking-wider opacity-70 mt-1 font-medium">
              Contatos via WhatsApp
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-neon">{portfolio.length}</div>
            <div className="text-xs uppercase tracking-wider opacity-70 mt-1 font-medium">
              Trabalhos publicados
            </div>
          </div>
        </div>
      </section>

      <section>
        <form
          action={upsertBusinessData}
          className="flex flex-col gap-4 bg-surface border border-border rounded-xl p-6 shadow-sm"
        >
          <h2 className="font-playfair text-xl font-bold">Dados Comerciais</h2>
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
      </section>

      {/* Gerenciar Portfólio */}
      <section>
        <h2 className="font-playfair text-2xl font-bold mb-6">Gerenciar Portfólio</h2>

        <form
          action={addPortfolioItem}
          className="flex flex-col gap-4 bg-surface border border-border rounded-xl p-6 shadow-sm mb-8"
        >
          <input
            type="text"
            name="imageUrl"
            placeholder="URL da imagem (https://...) — obrigatório"
            required
            className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              name="title"
              placeholder="Título do trabalho"
              className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
            />
            <input
              type="text"
              name="description"
              placeholder="Breve descrição"
              className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
            />
          </div>
          <button
            type="submit"
            className="py-3 bg-text text-bg rounded-md font-bold transition-all hover:opacity-90"
          >
            Adicionar ao portfólio
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {portfolio.map((item) => (
            <div
              key={item.id}
              className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col"
            >
              <div className="p-3 text-sm font-bold">{item.title || 'Sem título'}</div>
              <form action={deletePortfolioItem} className="p-3 border-t border-border mt-auto">
                <input type="hidden" name="itemId" value={item.id} />
                <button
                  type="submit"
                  className="w-full py-2 text-sm font-bold border border-red-500/50 text-red-500 rounded-md transition-all hover:bg-red-500/10"
                >
                  Excluir
                </button>
              </form>
            </div>
          ))}
          {portfolio.length === 0 && (
            <p className="col-span-full text-center opacity-60 py-8 border border-dashed border-border rounded-lg">
              Nenhum trabalho publicado ainda. Adicione seu primeiro item acima.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}