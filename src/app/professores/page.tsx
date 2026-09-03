import { getProfessorsDirectory } from '@/actions/directory';
import { getFavoriteProfessors, toggleFavoriteProfessor } from '@/actions/favorites';
import { FavoriteButton } from '@/components/favorite-button';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const metadata = {
  title: 'Diretório de Professores | Portal NKL',
  description: 'Encontre professores de música e instrumentos.',
};

export default async function ProfessoresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [directory, favorites] = await Promise.all([
    getProfessorsDirectory(),
    user?.id ? getFavoriteProfessors(user.id) : Promise.resolve([]),
  ]);
  const favoriteIds = new Set(favorites.map((fav) => fav.id));

  return (
    <main className="min-h-screen pt-[120px] pb-12 flex flex-col max-w-7xl mx-auto px-4">
      <div className="mb-10">
        <h1 className="font-playfair text-4xl font-bold text-foreground">Professores</h1>
        <p className="text-neutral-500 mt-2">
          Encontre professores de violino, viola, violoncelo e teoria musical.
          {user
            ? ' Agende sua aula de vídeo direto pela plataforma.'
            : ' Entre na sua conta para favoritar e agendar aulas de vídeo.'}
        </p>
      </div>

      {directory.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {directory.map((professor) => (
            <article
              key={professor.id}
              className="p-6 bg-surface border border-border rounded-xl hover:border-neon transition-colors flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-playfair font-bold text-lg truncate">
                    <Link
                      href={`/professores/${professor.id}`}
                      className="hover:text-neon transition-colors"
                    >
                      {professor.name}
                    </Link>
                  </h3>
                  <p className="text-sm opacity-80">
                    {professor.instrumento ?? 'Instrumento não informado'}
                    {professor.city && professor.state
                      ? ` · ${professor.city} · ${professor.state}`
                      : professor.city
                        ? ` · ${professor.city}`
                        : professor.state
                          ? ` · ${professor.state}`
                          : ''}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md border shrink-0 ${
                    professor.planType === 'premium'
                      ? 'bg-neon/10 text-neon border-neon/40'
                      : 'bg-accent/10 text-foreground/70 border-border'
                  }`}
                >
                  {professor.planType === 'premium' ? 'Premium' : 'Verificado'}
                </span>
              </div>

              {professor.bio && (
                <p className="text-sm opacity-90 line-clamp-2">{professor.bio}</p>
              )}

              <div className="mt-auto flex flex-col gap-3">
                {user ? (
                  <FavoriteButton
                    action={toggleFavoriteProfessor}
                    targetId={professor.id}
                    initialSaved={favoriteIds.has(professor.id)}
                    savedLabel="Salvo nos Meus Professores"
                    unsavedLabel="Salvar nos Meus Professores"
                  />
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex justify-center py-3 bg-text text-bg rounded-md font-bold transition-all hover:opacity-90"
                  >
                    Entre para favoritar e agendar
                  </Link>
                )}
                <Link
                  href={`/professores/${professor.id}`}
                  className="inline-flex justify-center py-3 border border-neon text-neon rounded-md font-bold transition-all hover:bg-neon hover:text-black"
                >
                  Ver perfil e aula de vídeo
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="bg-surface/50 border border-dashed border-border rounded-xl p-12 text-center text-neutral-400">
          <p className="text-lg font-medium mb-2">Nenhum professor cadastrado ainda</p>
          <p>Plataforma em fase de expansão. Novas funcionalidades estarão disponíveis em breve.</p>
        </div>
      )}
    </main>
  );
}