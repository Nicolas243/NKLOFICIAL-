import Link from 'next/link';
import { getRecentNewsFeed } from '@/actions/news';
import { getLuthiersDirectory } from '@/actions/directory';

export const metadata = {
  title: 'Portal NKL | Especialistas em Violino',
  description: 'O melhor portal de violino do Brasil.',
};

function buildWhatsAppUrl(whatsapp: string): string {
  const digits = whatsapp.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}

export default async function HomePage() {
  const [news, directory] = await Promise.all([
    getRecentNewsFeed(3),
    getLuthiersDirectory(),
  ]);

  const featured = directory.slice(0, 3);

  return (
    <div className="max-w-7xl w-full mx-auto px-4 flex flex-col gap-16">
      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row items-center gap-10 pt-10">
        <div className="flex-1">
          <h1 className="font-playfair text-4xl md:text-5xl font-bold leading-tight mb-4">
            Portal NKL · Especialistas em Violino
          </h1>
          <p className="text-base opacity-80 max-w-xl mb-6">
            O acervo mais completo sobre lutheria, acústica e performance.
            Descubra as nuances do seu instrumento e compare cordas com precisão.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/comparar"
              className="px-6 py-3 bg-text text-bg rounded-md font-bold transition-all hover:opacity-90"
            >
              Comparar Cordas
            </Link>
            <Link
              href="/catalogo"
              className="px-6 py-3 border border-neon text-neon rounded-md font-bold transition-all hover:bg-neon hover:text-black"
            >
              Acessar Catálogo
            </Link>
          </div>
        </div>
        <div className="flex-1">
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <img
              src="/NKL/violinfoto1.jpg"
              alt="Violino"
              className="w-full h-72 object-cover"
            />
          </div>
        </div>
      </section>
      {/* Últimas Notícias */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-playfair text-2xl md:text-3xl font-bold">Últimas Notícias</h2>
          <Link href="/noticias" className="text-sm text-neon font-medium hover:underline">
            Ver todas
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {news.map((item) => (
            <article
              key={item.id}
              className="p-6 bg-surface border border-border rounded-xl hover:border-neon transition-colors"
            >
              <div className="text-xs opacity-70 mb-2">
                {new Date(item.createdAt).toLocaleDateString('pt-BR')}
              </div>
              <h3 className="font-playfair font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-sm opacity-80 line-clamp-3">{item.content}</p>
            </article>
          ))}
          {news.length === 0 && (
            <p className="col-span-full text-center opacity-60 py-8 border border-dashed border-border rounded-lg">
              Nenhuma notícia publicada ainda.
            </p>
          )}
        </div>
      </section>

      {/* Luthiers em Destaque */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-playfair text-2xl md:text-3xl font-bold">Luthiers em Destaque</h2>
          <Link href="/luthiers" className="text-sm text-neon font-medium hover:underline">
            Ver todos
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {featured.map((luthier) => (
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

              {luthier.whatsapp ? (
                <a
                  href={buildWhatsAppUrl(luthier.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex justify-center py-3 bg-text text-bg rounded-md font-bold transition-all hover:opacity-90"
                >
                  Falar no WhatsApp
                </a>
              ) : (
                <p className="mt-auto text-center text-sm opacity-60 border border-dashed border-border rounded-md py-3">
                  WhatsApp não disponível
                </p>
              )}
            </article>
          ))}
          {featured.length === 0 && (
            <p className="col-span-full text-center opacity-60 py-8 border border-dashed border-border rounded-lg">
              Nenhum luthier destacado ainda. Volte em breve!
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

