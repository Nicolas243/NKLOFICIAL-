import { getBusinessesDirectory } from '@/actions/directory';
import { getFavoriteBusinesses, toggleFavoriteBusiness } from '@/actions/favorites';
import { DirectoryCardView } from '@/components/directory-card';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const metadata = {
  title: 'Lojas | Portal NKL',
  description: 'Encontre lojas de instrumentos e acessórios.',
};

export default async function LojasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [directory, favorites] = await Promise.all([
    getBusinessesDirectory(),
    user?.id ? getFavoriteBusinesses(user.id) : Promise.resolve([]),
  ]);
  const favoriteIds = new Set(favorites.map((fav) => fav.id));

  return (
    <main className="min-h-screen pt-[120px] pb-12 flex flex-col max-w-7xl mx-auto px-4">
      <div className="mb-10">
        <h1 className="font-playfair text-4xl font-bold text-foreground">Lojas</h1>
        <p className="text-neutral-500 mt-2">
          Descubra lojas de instrumentos, arcos, cordas e acessórios perto de você.
          {user
            ? ''
            : ' Entre na sua conta para ver os contatos diretos e favoritar.'}
        </p>
      </div>

      {directory.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {directory.map((store) => (
            <DirectoryCardView
              key={store.id}
              item={store}
              isAuthenticated={Boolean(user)}
              favorite={{
                action: toggleFavoriteBusiness,
                initialSaved: favoriteIds.has(store.id),
              }}
            />
          ))}
        </section>
      ) : (
        <div className="bg-surface/50 border border-dashed border-border rounded-xl p-12 text-center text-neutral-400">
          <p className="text-lg font-medium mb-2">Nenhuma loja cadastrada ainda</p>
          <p>Plataforma em fase de expansão. Novas funcionalidades estarão disponíveis em breve.</p>
        </div>
      )}

      {!user && directory.length > 0 && (
        <p className="mt-8 text-center text-sm opacity-70">
          <Link href="/login" className="text-neon font-bold hover:underline">
            Faça login
          </Link>{' '}
          para desbloquear os contatos das lojas.
        </p>
      )}
    </main>
  );
}