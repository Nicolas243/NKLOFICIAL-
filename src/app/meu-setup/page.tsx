import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  getFavoriteStrings,
  getFavoriteLuthiers,
  getFavoriteBusinesses,
  getFavoriteProfessors,
  toggleFavoriteString,
  toggleFavoriteLuthier,
  toggleFavoriteBusiness,
} from '@/actions/favorites';
import { FavoriteButton } from '@/components/favorite-button';

export const metadata = {
  title: 'Meu Setup | Portal NKL',
};

function buildWhatsAppUrl(whatsapp: string): string {
  const digits = whatsapp.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}

function formatAveragePrice(realPrice: string | null, priceMin: string | null, priceMax: string | null): string {
  if (realPrice) return `R$ ${realPrice}`;
  const prices = [priceMin, priceMax]
    .map((value) => (value ? Number(value) : NaN))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (prices.length === 0) return 'Consulte as ofertas';
  return `R$ ${(prices.reduce((total, value) => total + value, 0) / prices.length).toFixed(2)}`;
}

export default async function MeuSetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect('/login');
  }

  const [savedStrings, savedLuthiers, savedBusinesses, savedProfessors] = await Promise.all([
    getFavoriteStrings(user.id),
    getFavoriteLuthiers(user.id),
    getFavoriteBusinesses(user.id),
    getFavoriteProfessors(user.id),
  ]);

  return (
    <div className="max-w-7xl w-full mx-auto px-4 pt-8 flex flex-col gap-14">
      <section>
        <h1 className="font-playfair text-3xl font-bold mb-2">Meu Setup</h1>
        <p className="text-sm opacity-70">
          Seu acervo pessoal de cordas e sua rede de luthiers de confiança.
        </p>
      </section>

      {/* Cordas Salvas */}
      <section>
        <h2 className="font-playfair text-2xl font-bold mb-6">Cordas Salvas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {savedStrings.map((item) => (
            <article
              key={item.id}
              className="p-6 bg-surface border border-border rounded-lg hover:border-neon transition-colors flex flex-col gap-4"
            >
              <h3 className="font-playfair font-bold text-lg">
                <Link href={`/catalogo/${item.id}`} className="hover:text-neon transition-colors">
                  {item.name}
                </Link>
              </h3>
              <div className="flex justify-between text-sm opacity-80">
                <span>Nível: {item.qualityLevel || 'N/A'}</span>
                <span>Nota: {item.communityScore || 'N/A'}</span>
              </div>
              <div className="text-neon font-bold">
                {formatAveragePrice(item.realPrice, item.priceMin, item.priceMax)}
              </div>
              <div className="mt-auto">
                <FavoriteButton
                  action={toggleFavoriteString}
                  targetId={item.id}
                  initialSaved={true}
                  savedLabel="Remover do Meu Setup"
                  unsavedLabel="Salvar no Meu Setup"
                />
              </div>
            </article>
          ))}
          {savedStrings.length === 0 && (
            <p className="col-span-full text-center opacity-60 py-8 border border-dashed border-border rounded-lg">
              Nenhuma corda salva ainda. Explore o{' '}
              <Link href="/catalogo" className="text-neon font-bold hover:underline">
                catálogo
              </Link>{' '}
              para começar seu setup.
            </p>
          )}
        </div>
      </section>

      {/* Luthiers de Confiança */}
      <section>
        <h2 className="font-playfair text-2xl font-bold mb-6">Luthiers de Confiança</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {savedLuthiers.map((luthier) => (
            <article
              key={luthier.id}
              className="p-6 bg-surface border border-border rounded-xl hover:border-neon transition-colors flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-playfair font-bold text-lg">
                    <Link href={`/luthiers/${luthier.id}`} className="hover:text-neon transition-colors">
                      {luthier.name}
                    </Link>
                  </h3>
                  <p className="text-sm opacity-80">
                    {luthier.city && luthier.state
                      ? `${luthier.city} · ${luthier.state}`
                      : luthier.city ?? luthier.state ?? 'Localização não informada'}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${
                    luthier.planType === 'premium'
                      ? 'bg-neon/10 text-neon border-neon/40'
                      : 'bg-accent/10 text-foreground/70 border-border'
                  }`}
                >
                  {luthier.planType === 'premium' ? 'Premium' : 'Verificado'}
                </span>
              </div>

              <div className="mt-auto flex flex-col gap-3">
                <FavoriteButton
                  action={toggleFavoriteLuthier}
                  targetId={luthier.id}
                  initialSaved={true}
                  savedLabel="Remover do Meu Setup"
                  unsavedLabel="Salvar no Meu Setup"
                />
                {luthier.whatsapp ? (
                  <a
                    href={buildWhatsAppUrl(luthier.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex justify-center py-3 border border-neon text-neon rounded-md font-bold transition-all hover:bg-neon hover:text-black"
                  >
                    Falar no WhatsApp
                  </a>
                ) : (
                  <p className="text-center text-sm opacity-60 border border-dashed border-border rounded-md py-3">
                    WhatsApp não disponível
                  </p>
                )}
              </div>
            </article>
          ))}
          {savedLuthiers.length === 0 && (
            <p className="col-span-full text-center opacity-60 py-8 border border-dashed border-border rounded-lg">
              Nenhum luthier salvo ainda. Conheça o{' '}
              <Link href="/luthiers" className="text-neon font-bold hover:underline">
                diretório
              </Link>{' '}
              de profissionais.
            </p>
          )}
        </div>
      </section>
      {/* Lojas Favoritas */}
      <section>
        <h2 className="font-playfair text-2xl font-bold mb-6">Lojas Favoritas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {savedBusinesses.map((store) => (
            <article
              key={store.id}
              className="p-6 bg-surface border border-border rounded-xl hover:border-neon transition-colors flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-playfair font-bold text-lg">{store.name}</h3>
                  <p className="text-sm opacity-80">
                    {store.city && store.state
                      ? `${store.city} · ${store.state}`
                      : store.city ?? store.state ?? 'Localização não informada'}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${
                    store.planType === 'premium'
                      ? 'bg-neon/10 text-neon border-neon/40'
                      : 'bg-accent/10 text-foreground/70 border-border'
                  }`}
                >
                  {store.planType === 'premium' ? 'Premium' : 'Verificado'}
                </span>
              </div>

              <div className="mt-auto">
                <FavoriteButton
                  action={toggleFavoriteBusiness}
                  targetId={store.id}
                  initialSaved={true}
                  savedLabel="Remover das Favoritas"
                  unsavedLabel="Salvar nas Favoritas"
                />
              </div>
            </article>
          ))}
          {savedBusinesses.length === 0 && (
            <p className="col-span-full text-center opacity-60 py-8 border border-dashed border-border rounded-lg">
              Nenhuma loja favoritada ainda. Explore o{' '}
              <Link href="/lojas" className="text-neon font-bold hover:underline">
                diretório de lojas
              </Link>
              .
            </p>
          )}
        </div>
      </section>
      {/* Meus Professores */}
      <section>
        <h2 className="font-playfair text-2xl font-bold mb-6">Meus Professores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {savedProfessors.map((professor) => (
            <article
              key={professor.id}
              className="p-6 bg-surface border border-border rounded-xl hover:border-neon transition-colors flex flex-col gap-4"
            >
              <div>
                <h3 className="font-playfair font-bold text-lg">
                  <Link
                    href={`/professores/${professor.id}`}
                    className="hover:text-neon transition-colors"
                  >
                    {professor.name}
                  </Link>
                </h3>
                <p className="text-sm opacity-80">
                  {professor.instrumento ?? 'Instrumento não informado'}
                  {professor.city
                    ? ` · ${professor.city}${professor.state ? ` · ${professor.state}` : ''}`
                    : ''}
                </p>
              </div>
              <div className="mt-auto">
                <Link
                  href={`/professores/${professor.id}`}
                  className="inline-flex justify-center w-full py-3 border border-neon text-neon rounded-md font-bold transition-all hover:bg-neon hover:text-black"
                >
                  Abrir aula de vídeo
                </Link>
              </div>
            </article>
          ))}
          {savedProfessors.length === 0 && (
            <p className="col-span-full text-center opacity-60 py-8 border border-dashed border-border rounded-lg">
              Nenhum professor salvo ainda. Conheça o{' '}
              <Link href="/professores" className="text-neon font-bold hover:underline">
                diretório de professores
              </Link>
              .
            </p>
          )}
        </div>
      </section>
    </div>
  );
}