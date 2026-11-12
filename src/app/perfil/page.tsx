import { redirect } from 'next/navigation';
import Link from 'next/link';
import { and, eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { guidePurchases, guideSubscriptions, userProfiles } from '@/db/schema';
import { GuideAssetDownloads } from '@/components/sales/guide-asset-downloads';
import { GUIDE_ASSETS } from '@/lib/guide-assets';
import { upsertLuthierProfile } from '@/actions/profile';
import {
  getFavoriteStrings,
  getFavoriteLuthiers,
  getFavoriteBusinesses,
  getFavoriteProfessors,
} from '@/actions/favorites';
import { loadOptionalProfileData } from '@/lib/profile-optional-data';

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
  const {
    guideAccess,
    favoriteStrings,
    favoriteLuthiers,
    favoriteBusinesses,
    favoriteProfessors,
  } = await loadOptionalProfileData({
    readGuideAccess: async () => {
      const [guidePurchase, guideSubscription] = await Promise.all([
        db.select({
          downloadCount: guidePurchases.downloadCount,
          maxDownloads: guidePurchases.maxDownloads,
        }).from(guidePurchases).where(and(
          eq(guidePurchases.userId, user.id),
          eq(guidePurchases.status, 'approved'),
        )).limit(1),
        db.select({
          downloadCount: guideSubscriptions.downloadCount,
          maxDownloads: guideSubscriptions.maxDownloads,
        }).from(guideSubscriptions).where(and(
          eq(guideSubscriptions.userId, user.id),
          eq(guideSubscriptions.status, 'active'),
        )).limit(1),
      ]);
      return guidePurchase[0] ?? guideSubscription[0] ?? null;
    },
    readFavoriteStrings: () => getFavoriteStrings(user.id),
    readFavoriteLuthiers: () => getFavoriteLuthiers(user.id),
    readFavoriteBusinesses: () => getFavoriteBusinesses(user.id),
    readFavoriteProfessors: () => getFavoriteProfessors(user.id),
    onError: (section, error) => {
      console.error(`[PROFILE] Falha ao carregar ${section}:`, error);
    },
  });

  // Tarefa 11 — UX que incentiva o preenchimento completo do perfil.
  const missingFields: string[] = [];
  if (!profile?.fullName) missingFields.push('Nome completo');
  if (!profile?.bio) missingFields.push('Biografia (About me)');
  if (!profile?.city || !profile?.state) missingFields.push('Cidade e Estado');
  const isProfileIncomplete = missingFields.length > 0;

  return (
    <div className="max-w-2xl w-full mx-auto px-4 pt-8">
      <h1 className="font-playfair text-3xl font-bold mb-2">Perfil de Luthier</h1>
      <p className="text-sm opacity-70 mb-8">
        Cadastre seus dados para se habilitar como luthier no mercado.
      </p>

      {isProfileIncomplete && (
        <div
          role="alert"
          className="mb-8 p-4 rounded-xl border border-neon/50 bg-neon/5 flex flex-col gap-1"
        >
          <p className="text-sm font-bold text-neon">
            Complete seu perfil para aparecer nas buscas
          </p>
          <p className="text-sm opacity-80">
            Campos pendentes: <strong>{missingFields.join(', ')}</strong>. Um
            perfil completo com biografia aumenta sua credibilidade e suas
            chances de ser contatado.
          </p>
        </div>
      )}

      {guideAccess && (
        <section className="mb-8 rounded-xl border border-orange/30 bg-orange/5 p-6">
          <h2 className="font-playfair text-xl font-bold">Meus materiais NKL</h2>
          <p className="mt-2 text-sm leading-relaxed opacity-75">
            Cada arquivo é personalizado no momento do download com seus dados de acesso. O original permanece protegido.
          </p>
          <GuideAssetDownloads
            assets={GUIDE_ASSETS}
            initialRemainingDownloads={Math.max(guideAccess.maxDownloads - guideAccess.downloadCount, 0)}
          />
        </section>
      )}

      <section className="mb-8 p-6 bg-surface border border-border rounded-xl flex flex-col gap-4">
        <h2 className="font-playfair text-xl font-bold">Meus Favoritos</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/meu-setup"
            className="p-4 rounded-lg border border-border hover:border-neon transition-colors group"
          >
            <span className="block text-2xl font-playfair font-bold text-neon">
              {favoriteStrings.length}
            </span>
            <span className="text-sm opacity-80 group-hover:opacity-100">
              {favoriteStrings.length === 1 ? 'Corda salva' : 'Cordas salvas'}
            </span>
          </Link>
          <Link
            href="/meu-setup"
            className="p-4 rounded-lg border border-border hover:border-neon transition-colors group"
          >
            <span className="block text-2xl font-playfair font-bold text-neon">
              {favoriteLuthiers.length}
            </span>
            <span className="text-sm opacity-80 group-hover:opacity-100">
              {favoriteLuthiers.length === 1 ? 'Luthier salvo' : 'Luthiers salvos'}
            </span>
          </Link>
          <Link
            href="/meu-setup"
            className="p-4 rounded-lg border border-border hover:border-neon transition-colors group"
          >
            <span className="block text-2xl font-playfair font-bold text-neon">
              {favoriteBusinesses.length}
            </span>
            <span className="text-sm opacity-80 group-hover:opacity-100">
              {favoriteBusinesses.length === 1 ? 'Loja favorita' : 'Lojas favoritas'}
            </span>
          </Link>
          <Link
            href="/meu-setup"
            className="p-4 rounded-lg border border-border hover:border-neon transition-colors group"
          >
            <span className="block text-2xl font-playfair font-bold text-neon">
              {favoriteProfessors.length}
            </span>
            <span className="text-sm opacity-80 group-hover:opacity-100">
              {favoriteProfessors.length === 1 ? 'Professor salvo' : 'Professores salvos'}
            </span>
          </Link>
        </div>
        <p className="text-sm opacity-70">
          Gerencie todos os itens favoritados no{' '}
          <Link href="/meu-setup" className="text-neon font-bold hover:underline">
            Meu Setup
          </Link>
          .
        </p>
      </section>

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