import { redirect } from 'next/navigation';
import Link from 'next/link';
import { and, desc, eq, or } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { guidePurchases, guideSubscriptions, userProfiles } from '@/db/schema';
import { GuideAssetDownloads } from '@/components/sales/guide-asset-downloads';
import { GUIDE_ASSETS, getGuideAssetsForOffer, type GuideAsset } from '@/lib/guide-assets';
import { upsertLuthierProfile } from '@/actions/profile';
import { signout } from '@/actions/auth';
import { ProfileOnboardingForm } from '@/components/profile-onboarding-form';
import { hasCompletedOnboarding, includesMusic, parseOnboardingContext } from '@/lib/auth/onboarding';
import { parseGuideResumeIntent } from '@/lib/auth/return-intent';
import { safeNextPath } from '@/lib/auth/oauth';
import {
  getFavoriteStrings,
  getFavoriteLuthiers,
  getFavoriteBusinesses,
  getFavoriteProfessors,
} from '@/actions/favorites';
import { loadOptionalProfileData } from '@/lib/profile-optional-data';
import { getPartnerPrograms, type PartnerProgramCard } from '@/actions/partner-programs';
import { getSavedPartnerPrograms } from '@/actions/saved-partner-programs';
import { SavedProgramsProfile } from '@/components/income/saved-programs-profile';

export const metadata = {
  title: 'Meu Perfil',
};

type ProfileSearchParams = Promise<{
  onboarding?: string;
  next?: string;
  resume?: string;
}>;

async function readUserGuideAccessAndAssets(userId: string): Promise<{
  access: { downloadCount: number; maxDownloads: number } | null;
  assets: readonly GuideAsset[];
}> {
  try {
    const [guidePurchaseRows, guideSubscriptionRows] = await Promise.all([
      db.select({
        offerVariant: guidePurchases.offerVariant,
        downloadCount: guidePurchases.downloadCount,
        maxDownloads: guidePurchases.maxDownloads,
      }).from(guidePurchases).where(and(
        eq(guidePurchases.userId, userId),
        eq(guidePurchases.status, 'approved'),
      )).orderBy(desc(guidePurchases.createdAt)),
      db.select({
        offerVariant: guideSubscriptions.offerVariant,
        downloadCount: guideSubscriptions.downloadCount,
        maxDownloads: guideSubscriptions.maxDownloads,
      }).from(guideSubscriptions).where(and(
        eq(guideSubscriptions.userId, userId),
        eq(guideSubscriptions.status, 'active'),
      )).orderBy(desc(guideSubscriptions.createdAt)),
    ]);
    const accessRows = [...guidePurchaseRows, ...guideSubscriptionRows];
    if (accessRows.length === 0) {
      return { access: null, assets: [] };
    }
    const unlockedIds = new Set<string>();
    for (const row of accessRows) {
      for (const asset of getGuideAssetsForOffer(row.offerVariant)) unlockedIds.add(asset.id);
    }
    return {
      access: {
        downloadCount: accessRows.reduce((total, row) => total + row.downloadCount, 0),
        maxDownloads: accessRows.reduce((total, row) => total + row.maxDownloads, 0),
      },
      assets: GUIDE_ASSETS.filter((asset) => unlockedIds.has(asset.id)),
    };
  } catch (error) {
    console.error('[PROFILE] Falha ao carregar guide access:', error);
    return { access: null, assets: [] };
  }
}

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: ProfileSearchParams;
}) {
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
    .where(or(eq(userProfiles.id, user.id), eq(userProfiles.email, user.email ?? '')))
    .limit(1);
  const params = await searchParams;

  if (!hasCompletedOnboarding(user.user_metadata)) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 pt-10">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-neon">Antes de continuar</p>
          <h1 className="mt-2 font-playfair text-3xl font-bold">Vamos personalizar seu Portal NKL</h1>
          <p className="mt-3 text-sm leading-relaxed opacity-75">
            Sua conta Google foi criada, mas ainda precisamos saber quais espaços você quer usar.
            Isso evita criar um perfil musical ou de luthier sem sua escolha.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface/80 p-5 shadow-xl sm:p-8">
          <ProfileOnboardingForm
            nextPath={safeNextPath(params.next ?? '/perfil')}
            resume={parseGuideResumeIntent(params.resume ?? null) ?? ''}
          />
        </div>
      </div>
    );
  }

  const context = parseOnboardingContext(user.user_metadata?.nkl_context);
  const hasIncomeContext = profile
    ? profile.incomeProfileEnabled
    : (context ? (context === 'income' || context === 'both') : true);
  const hasMusicContext = profile
    ? profile.musicProfileEnabled
    : (context ? includesMusic(context) : false);
  const profileRoles = profile?.papel
    ?.split(',')
    .map((role) => (role.trim() === 'Musico' ? 'Músico' : role.trim()))
    .filter(Boolean) ?? [];
  const isLuthier = profile?.role === 'luthier' || profileRoles.includes('Luthier');
  const guideAccessPromise = readUserGuideAccessAndAssets(user.id);
  const [profileData, { assets: unlockedAssets }] = await Promise.all([
    loadOptionalProfileData({
      readGuideAccess: async () => (await guideAccessPromise).access,
      readFavoriteStrings: hasMusicContext ? () => getFavoriteStrings(user.id) : async () => [],
      readFavoriteLuthiers: hasMusicContext ? () => getFavoriteLuthiers(user.id) : async () => [],
      readFavoriteBusinesses: hasMusicContext ? () => getFavoriteBusinesses(user.id) : async () => [],
      readFavoriteProfessors: hasMusicContext ? () => getFavoriteProfessors(user.id) : async () => [],
      onError: (section, error) => {
        console.error(`[PROFILE] Falha ao carregar ${section}:`, error);
      },
    }),
    guideAccessPromise,
  ]);
  const {
    guideAccess,
    favoriteStrings,
    favoriteLuthiers,
    favoriteBusinesses,
    favoriteProfessors,
  } = profileData;

  let incomePrograms: PartnerProgramCard[] = [];
  let savedIncomePrograms: PartnerProgramCard[] = [];
  if (hasIncomeContext) {
    try {
      incomePrograms = await getPartnerPrograms();
    } catch (error) {
      console.error('[PROFILE] Falha ao carregar oportunidades da Renda Extra:', error);
    }

    try {
      savedIncomePrograms = await getSavedPartnerPrograms(incomePrograms);
    } catch (error) {
      console.error('[PROFILE] Falha ao carregar oportunidades salvas:', error);
    }
  }

  // Tarefa 11 — UX que incentiva o preenchimento completo do perfil.
  const missingFields: string[] = [];
  if (hasMusicContext && isLuthier && !profile?.fullName) missingFields.push('Nome completo');
  if (hasMusicContext && isLuthier && !profile?.bio) missingFields.push('Biografia (About me)');
  if (hasMusicContext && isLuthier && (!profile?.city || !profile?.state)) missingFields.push('Cidade e Estado');
  const isProfileIncomplete = hasMusicContext && isLuthier && missingFields.length > 0;
  const profileTitle = profile?.role === 'admin' ? 'Perfil de administrador' : 'Meu Perfil';
  const profileDescription = profile?.role === 'admin'
    ? 'Gerencie sua conta e os recursos administrativos do Portal NKL.'
    : hasIncomeContext && hasMusicContext
      ? 'Gerencie seus dados, suas oportunidades de renda extra e sua área musical em um só lugar.'
    : hasIncomeContext
      ? 'Acompanhe suas oportunidades, materiais e preferências em um só lugar.'
    : hasMusicContext
      ? 'Gerencie suas preferências e sua presença na comunidade musical.'
      : 'Gerencie sua conta, materiais e preferências do Portal NKL.';

  return (
    <div className={`w-full mx-auto px-4 pt-8 ${hasIncomeContext ? 'max-w-6xl' : 'max-w-2xl'}`}>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-playfair text-3xl font-bold mb-2">{profileTitle}</h1>
          <p className="text-sm opacity-70">{profileDescription}</p>
        </div>
        <form action={signout}>
          <button type="submit" className="rounded-md border border-border px-4 py-2 text-sm font-bold transition-colors hover:border-neon hover:text-neon">
            Sair da conta
          </button>
        </form>
      </div>

      <div className="mb-8 flex flex-wrap gap-2 text-xs">
        {profile?.role === 'admin' && <span className="rounded-full border border-orange/50 bg-orange/10 px-3 py-1 font-bold text-orange">Administrador</span>}
        {hasIncomeContext && <span className="rounded-full border border-border px-3 py-1">Renda Extra</span>}
        {hasMusicContext && <span className="rounded-full border border-border px-3 py-1">Área musical</span>}
        {hasMusicContext && profileRoles.map((role) => <span key={role} className="rounded-full border border-border px-3 py-1">{role}</span>)}
      </div>

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

      {hasIncomeContext && (
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-orange/30 bg-income-surface/90 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange">Acompanhamento</p>
            <p className="mt-3 font-playfair text-3xl font-bold">{savedIncomePrograms.length}</p>
            <p className="mt-1 text-sm opacity-65">oportunidades salvas para revisar</p>
          </div>
          <div className="rounded-2xl border border-border bg-income-surface/70 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-neon">Catálogo</p>
            <p className="mt-3 font-playfair text-3xl font-bold">{incomePrograms.length}</p>
            <p className="mt-1 text-sm opacity-65">caminhos editoriais disponíveis</p>
          </div>
          <div className="rounded-2xl border border-border bg-income-surface/70 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-neon">Próximo passo</p>
            <p className="mt-3 font-playfair text-xl font-bold">{savedIncomePrograms.length > 0 ? 'Compare com calma' : 'Escolha um ponto de partida'}</p>
            <Link href="/programas" className="mt-2 inline-flex text-sm font-bold text-neon hover:underline">
              Abrir catálogo →
            </Link>
          </div>
        </div>
      )}

      {hasIncomeContext && (
        <div className="mb-8">
          <SavedProgramsProfile initialPrograms={savedIncomePrograms} allPrograms={incomePrograms} />
        </div>
      )}

      {guideAccess && unlockedAssets.length > 0 && (
        <section className="mb-8 rounded-xl border border-orange/30 bg-orange/5 p-6">
          <h2 className="font-playfair text-xl font-bold">Meus materiais NKL</h2>
          <p className="mt-2 text-sm leading-relaxed opacity-75">
            Cada arquivo é personalizado no momento do download com seus dados de acesso. O original permanece protegido.
          </p>
          <GuideAssetDownloads
            assets={unlockedAssets}
            initialRemainingDownloads={Math.max(guideAccess.maxDownloads - guideAccess.downloadCount, 0)}
          />
        </section>
      )}

      {hasMusicContext && <section className="mb-8 p-6 bg-surface border border-border rounded-xl flex flex-col gap-4">
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
      </section>}

      <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-2">
        {hasIncomeContext && (
          <>
            <Link
              href="/programas/notificacoes"
              className="inline-flex items-center gap-2 text-sm font-bold text-neon hover:underline"
            >
              → Notificações da Renda Extra
            </Link>
            <Link
              href="/guias/renda-extra"
              className="inline-flex items-center gap-2 text-sm font-bold text-neon hover:underline"
            >
              → Meu Guia NKL
            </Link>
          </>
        )}
        {hasMusicContext && (
          <>
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
          </>
        )}
        {!hasMusicContext && (
          <Link
            href="/perfil/privacidade"
            className="inline-flex items-center gap-2 text-sm font-bold text-neon hover:underline"
          >
            → Privacidade e Dados
          </Link>
        )}
      </div>

      <form
        action={upsertLuthierProfile}
        className="flex flex-col gap-5 bg-surface border border-border rounded-xl p-6 shadow-sm"
      >
        <input type="hidden" name="profileRole" value={hasMusicContext && isLuthier ? 'luthier' : 'user'} />

        <div className="space-y-1">
          <h2 className="font-playfair text-xl font-bold">Dados da conta</h2>
          <p className="text-sm opacity-70">Atualize suas informações básicas e escolha quais áreas deseja exibir no seu perfil.</p>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          <span>Nome completo</span>
          <input
            type="text"
            name="fullName"
            defaultValue={profile?.fullName ?? ''}
            placeholder="Nome completo"
            className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          <span>Data de nascimento</span>
          <input
            type="date"
            name="birthDate"
            defaultValue={profile?.birthDate ?? ''}
            className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
          />
          <span className="text-xs font-normal opacity-65">
            Usada para mensagens de aniversário e personalização no Portal NKL.
          </span>
        </label>

        <fieldset className="rounded-xl border border-border bg-background/60 p-4 space-y-3">
          <legend className="px-1 text-xs font-bold uppercase tracking-[0.14em] text-neon">
            Áreas do meu perfil
          </legend>
          <label className="flex items-start gap-3 text-sm cursor-pointer">
            <input
              type="checkbox"
              name="musicProfileEnabled"
              defaultChecked={hasMusicContext}
              className="mt-0.5 h-4 w-4 accent-neon"
            />
            <span>
              <strong className="block">Ativar lado musical do meu perfil</strong>
              <span className="text-xs opacity-70">
                Exibe instrumento, papel musical, cordas salvas, avaliações e dados de luthier ou professor.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm cursor-pointer">
            <input
              type="checkbox"
              name="incomeProfileEnabled"
              defaultChecked={hasIncomeContext}
              className="mt-0.5 h-4 w-4 accent-neon"
            />
            <span>
              <strong className="block">Ativar lado renda extra do meu perfil</strong>
              <span className="text-xs opacity-70">
                Exibe suas oportunidades salvas, guias e acompanhamento de renda extra.
              </span>
            </span>
          </label>
        </fieldset>

        {hasMusicContext && (
          <div className="space-y-4 rounded-xl border border-border bg-background/50 p-4">
            <h3 className="font-playfair text-lg font-bold">Preferências musicais</h3>
            <fieldset>
              <legend className="text-sm font-medium mb-2">Papel na comunidade</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(['Músico', 'Luthier', 'Professor', 'Lojista', 'Aluno'] as const).map((roleOption) => (
                  <label
                    key={roleOption}
                    className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      name="papel"
                      value={roleOption}
                      defaultChecked={profileRoles.includes(roleOption)}
                      className="h-4 w-4 accent-neon"
                    />
                    <span>{roleOption}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                <span>Instrumento principal</span>
                <input
                  type="text"
                  name="instrumento"
                  defaultValue={profile?.instrumento ?? ''}
                  placeholder="Ex.: Violino"
                  className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                <span>Anos de experiência</span>
                <input
                  type="number"
                  name="anosExperiencia"
                  min={0}
                  max={80}
                  defaultValue={profile?.anosExperiencia ?? 0}
                  className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
                />
              </label>
            </div>

            {isLuthier && (
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                <span>Nome do ateliê / loja</span>
                <input
                  type="text"
                  name="businessName"
                  defaultValue={profile?.businessName ?? ''}
                  placeholder="Nome do ateliê / loja"
                  className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
                />
              </label>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
        <textarea
          name="bio"
          defaultValue={profile?.bio ?? ''}
          placeholder={hasMusicContext ? 'Conte um pouco sobre seu trabalho (biografia pública)' : 'Conte um pouco sobre você e seus objetivos (opcional)'}
          rows={4}
          className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none resize-none"
        />
        <button
          type="submit"
          className="py-3 bg-foreground text-background rounded-md font-bold transition-all hover:opacity-90"
        >
          {hasMusicContext && isLuthier ? 'Salvar perfil de luthier' : 'Salvar dados do perfil'}
        </button>
      </form>
    </div>
  );
}