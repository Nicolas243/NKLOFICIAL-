import { getBusinessesDirectory, type DirectoryCard } from '@/actions/directory';
import { BusinessCard } from '@/components/directory/business-card';
import { JsonLd } from '@/components/seo/json-ld';

export const metadata = {
  title: 'Lojas | Portal NKL',
  description: 'Encontre lojas de instrumentos e acessórios.',
};

const fallbackStores: DirectoryCard[] = [
  {
    id: 'demo-store-1',
    name: 'Casa do Arco Musical',
    city: 'São Paulo',
    state: 'SP',
    planType: 'free',
    whatsapp: null,
    bio: 'Cordas, acessórios e itens de manutenção para instrumentos de arco.',
    imageUrl: null,
    instrumentTypes: 'Violino, viola, violoncelo',
    repairTypes: 'Acessórios e manutenção básica',
  },
  {
    id: 'demo-store-2',
    name: 'Sonora Instrumentos',
    city: 'Brasília',
    state: 'DF',
    planType: 'free',
    whatsapp: null,
    bio: 'Instrumentos musicais e acessórios para estudantes e conjuntos.',
    imageUrl: null,
    instrumentTypes: 'Violino, viola, violoncelo',
    repairTypes: 'Acessórios e encomendas',
  },
  {
    id: 'demo-store-3',
    name: 'Arco Norte Musical',
    city: 'Belém',
    state: 'PA',
    planType: 'free',
    whatsapp: null,
    bio: 'Curadoria de instrumentos de arco e materiais de estudo.',
    imageUrl: null,
    instrumentTypes: 'Violino, viola',
    repairTypes: 'Acessórios, cordas e revisão',
  },
];

export default async function LojasPage() {
  let directory: DirectoryCard[] = [];
  try {
    directory = await getBusinessesDirectory();
  } catch (error) {
    console.error('[lojas] Diretório indisponível:', error instanceof Error ? error.message : 'erro desconhecido');
  }
  const stores = directory.length > 0 ? directory : fallbackStores;

  return (
    <main className="min-h-screen pt-[120px] pb-12 flex flex-col max-w-7xl mx-auto px-4">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: stores.map((store, index) => ({ '@type': 'ListItem', position: index + 1, name: store.name })) }} />
      <div className="mb-10">
        <h1 className="font-playfair text-4xl font-bold text-foreground">Lojas</h1>
        <p className="text-neutral-500 mt-2">
          Descubra lojas de instrumentos, arcos, cordas e acessórios perto de você.
          {' Encontre fornecedores e serviços para instrumentos de arco.'}
        </p>
      </div>

      {stores.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {stores.map((store) => (
            <BusinessCard
              key={store.id}
              name={store.name}
              specialty={store.instrumentTypes ?? 'Instrumentos e acessórios'}
              location={store.city && store.state ? `${store.city} · ${store.state}` : store.city ?? store.state ?? 'Atendimento nacional'}
              avatarUrl={store.imageUrl}
              contactUrl="/contatos"
              reportTargetType="store"
              reportTargetId={store.id}
            />
          ))}
        </section>
      ) : (
        <div className="bg-surface/50 border border-dashed border-border rounded-xl p-12 text-center text-neutral-400">
          <p className="text-lg font-medium mb-2">Diretório em sincronização</p>
          <p>Nenhuma loja encontrada no momento. Novos estabelecimentos estarão disponíveis em breve.</p>
        </div>
      )}
    </main>
  );
}