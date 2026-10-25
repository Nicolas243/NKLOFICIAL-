import { getLuthiersDirectory } from '@/actions/directory';
import { getFavoriteLuthiers, toggleFavoriteLuthier } from '@/actions/favorites';
import { DirectoryCardView } from '@/components/directory-card';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/json-ld';

export const metadata = {
  title: 'Diretório de Luthiers | Portal NKL',
  description: 'Encontre luthiers verificados e profissionais do mercado.',
};

export default async function LuthiersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let directory = await getLuthiersDirectory();
  if (directory.length === 0) {
    directory = [
      { id: 'demo-luthier-1', name: 'Ateliê Arco Vivo', city: 'São Paulo', state: 'SP', planType: 'free', whatsapp: null, bio: 'Manutenção e ajustes para instrumentos de arco.', imageUrl: null, instrumentTypes: 'Violino e viola', repairTypes: 'Ajustes e restauração' },
      { id: 'demo-luthier-2', name: 'Oficina Harmonia', city: 'Curitiba', state: 'PR', planType: 'free', whatsapp: null, bio: 'Serviços de luthieria para músicos e estudantes.', imageUrl: null, instrumentTypes: 'Violoncelo', repairTypes: 'Revisão e regulagem' },
      { id: 'demo-luthier-3', name: 'Casa do Som', city: 'Belo Horizonte', state: 'MG', planType: 'free', whatsapp: null, bio: 'Consultoria e manutenção especializada.', imageUrl: null, instrumentTypes: 'Cordas friccionadas', repairTypes: 'Restauração e conservação' },
    ];
  }
  const [favorites] = await Promise.all([
    user?.id ? getFavoriteLuthiers(user.id) : Promise.resolve([]),
  ]);
  const favoriteIds = new Set(favorites.map((fav) => fav.id));

  return (
    <div className="max-w-7xl w-full mx-auto px-4 pt-8">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: directory.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name })) }} />
      <h1 className="font-playfair text-3xl font-bold mb-2">Diretório de Luthiers</h1>
      <p className="text-sm opacity-70 mb-8">
        Conecte-se com profissionais do mercado.
        {user
          ? ' Fale direto pelo WhatsApp.'
          : ' Entre na sua conta para ver os contatos diretos.'}
      </p>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {directory.map((luthier) => (
          <DirectoryCardView
            key={luthier.id}
            item={luthier}
            isAuthenticated={Boolean(user)}
            profileHref={`/luthiers/${luthier.id}`}
            favorite={{
              action: toggleFavoriteLuthier,
              initialSaved: favoriteIds.has(luthier.id),
            }}
          />
        ))}
      </section>

      {directory.length === 0 && (
        <p className="text-center opacity-60 py-8 border border-dashed border-border rounded-lg">
          Nenhum luthier cadastrado ainda. Volte em breve!
        </p>
      )}

      {!user && directory.length > 0 && (
        <p className="mt-8 text-center text-sm opacity-70">
          <Link href="/login" className="text-neon font-bold hover:underline">
            Faça login
          </Link>{' '}
          para desbloquear os contatos de WhatsApp dos profissionais.
        </p>
      )}
    </div>
  );
}