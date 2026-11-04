import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/db';
import { stringsCatalog, userProfiles, businessDirectory, newsFeed } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { RadialMenu } from '@/components/radial-menu';
import { HomeMenuFallback } from '@/components/home-menu-fallback';
import { PwaInstallButton } from '@/components/pwa';

export const dynamic = 'force-dynamic';

type TopStringRow = Pick<
  typeof stringsCatalog.$inferSelect,
  'id' | 'name' | 'communityScore' | 'qualityLevel'
>;

type FeaturedLuthierRow = {
  id: string;
  name: string | null;
  city: string | null;
  state: string | null;
  planType: string;
  whatsapp: string | null;
};

type NewsRow = Pick<
  typeof newsFeed.$inferSelect,
  'id' | 'title' | 'content' | 'imageUrl' | 'createdAt'
>;

export default async function HomePage() {
  const [topStrings, featuredLuthiers, latestNews] = await Promise.all([
    db
      .select({
        id: stringsCatalog.id,
        name: stringsCatalog.name,
        communityScore: stringsCatalog.communityScore,
        qualityLevel: stringsCatalog.qualityLevel,
      })
      .from(stringsCatalog)
      .orderBy(desc(stringsCatalog.communityScore))
      .limit(4) as Promise<TopStringRow[]>,

    db
      .select({
        id: userProfiles.id,
        name: userProfiles.fullName,
        city: businessDirectory.city,
        state: businessDirectory.state,
        planType: businessDirectory.planType,
        whatsapp: businessDirectory.whatsapp,
      })
      .from(userProfiles)
      .innerJoin(businessDirectory, eq(userProfiles.id, businessDirectory.userId))
      .where(eq(businessDirectory.planType, 'premium'))
      .limit(4) as Promise<FeaturedLuthierRow[]>,

    db
      .select({
        id: newsFeed.id,
        title: newsFeed.title,
        content: newsFeed.content,
        imageUrl: newsFeed.imageUrl,
        createdAt: newsFeed.createdAt,
      })
      .from(newsFeed)
      .orderBy(desc(newsFeed.createdAt))
      .limit(4) as Promise<NewsRow[]>,
  ]);
return (
    <div className="max-w-7xl w-full mx-auto px-4 flex flex-col gap-20">
      {/* Tarefa 4 — hambúrguer de fallback no canto superior esquerdo da Home */}
      <HomeMenuFallback />

      {/* Radial Menu — PRIMEIRO após o header (Landing Page style) */}
      <section className="relative flex items-center justify-center pt-2">
        <div className="absolute right-2 top-2 z-20">
          <PwaInstallButton />
        </div>
        <RadialMenu />
      </section>

      {/* HERO — abaixo da pizza */}
      <section className="flex flex-col lg:flex-row items-center gap-10">
        <div className="flex-1 space-y-6">
          <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            O Cuidado Oculto por tras da Voz do Instrumento
          </h1>
          <p className="text-base md:text-lg opacity-80 max-w-xl leading-relaxed">
            Cada nota carrega a alma de quem constroi. Descubra as cordas certas,
            encontre o luthier ideal e eleve sua performance ao proximo patamar.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/catalogo"
              className="inline-flex px-8 py-4 bg-neon text-black rounded-md font-bold text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-neon/30"
            >
              Explorar Catalogo
            </Link>
            <Link
              href="/luthiers"
              className="px-8 py-4 border-2 border-neon text-neon rounded-md font-bold text-lg transition-all hover:bg-neon hover:text-black"
            >
              Encontrar Luthier
            </Link>
          </div>
        </div>
        <div className="flex-1 relative w-full max-w-lg aspect-[4/3] rounded-xl overflow-hidden bg-surface border border-border">
          <Image
            src="/NKL/Violino_foto_princial.webp"
            alt="Violino em destaque"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            className="object-cover"
          />
                </div>
      </section>

      {/* ICEBERG 1: As Melhores Cordas */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-playfair text-2xl md:text-3xl font-bold">As Melhores Cordas</h2>
            <p className="text-sm opacity-60 mt-1">Mais bem avaliadas pela comunidade.</p>
          </div>
          <Link href="/catalogo" className="text-neon font-medium text-sm hover:underline">
            Ver catalogo completo →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {topStrings.map((item) => (
            <Link
              key={item.id}
              href={`/catalogo/${item.id}`}
              className="group p-6 bg-surface border border-border rounded-xl hover:border-neon transition-all duration-200 flex flex-col gap-3"
            >
              <h3 className="font-playfair font-bold text-lg group-hover:text-neon transition-colors">
                {item.name}
              </h3>
              <div className="text-3xl font-bold text-neon">
                {item.communityScore ? Number(item.communityScore).toFixed(1) : '-'}
              </div>
              <p className="text-xs opacity-50 mt-auto">Nota da comunidade</p>
            </Link>
          ))}
          {topStrings.length === 0 && (
            <p className="col-span-full text-center opacity-60 py-12 border border-dashed border-border rounded-lg">
              Nenhuma corda catalogada ainda.
            </p>
          )}
        </div>
      </section>
{/* ICEBERG 2: Profissionais de Confianca */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-playfair text-2xl md:text-3xl font-bold">Profissionais de Confianca</h2>
            <p className="text-sm opacity-60 mt-1">Luthiers Premium verificados pela plataforma.</p>
          </div>
          <Link href="/luthiers" className="text-neon font-medium text-sm hover:underline">
            Ver diretorio completo →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {featuredLuthiers.map((luthier) => (
            <Link
              key={luthier.id}
              href={`/luthiers/${luthier.id}`}
              className="group p-6 bg-surface border border-border rounded-xl hover:border-neon transition-all duration-200 flex flex-col gap-3"
            >
              <h3 className="font-playfair font-bold text-lg group-hover:text-neon transition-colors">
                {luthier.name ?? 'Profissional'}
              </h3>
              <p className="text-sm opacity-70">
                {luthier.city && luthier.state
                  ? `${luthier.city} - ${luthier.state}`
                  : luthier.city ?? luthier.state ?? 'Localizacao nao informada'}
              </p>
              <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neon">
                <span className="w-2 h-2 rounded-full bg-neon" />
                Premium
              </span>
            </Link>
          ))}
          {featuredLuthiers.length === 0 && (
            <p className="col-span-full text-center opacity-60 py-12 border border-dashed border-border rounded-lg">
              Nenhum luthier Premium ainda. Seja o primeiro!
            </p>
          )}
        </div>
      </section>

      {/* ICEBERG 3: Ultimas do Portal */}
      <section className="pb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-playfair text-2xl md:text-3xl font-bold">Ultimas do Portal</h2>
            <p className="text-sm opacity-60 mt-1">Noticias e novidades do universo da lutheria.</p>
          </div>
          <Link href="/noticias" className="text-neon font-medium text-sm hover:underline">
            Ver todas as noticias →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {latestNews.map((item) => (
            <article
              key={item.id}
              className="p-6 bg-surface border border-border rounded-xl hover:border-neon transition-all duration-200 flex flex-col gap-3"
            >
              <div className="text-xs opacity-50 uppercase tracking-wider">
                {new Date(item.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
              <h3 className="font-playfair font-bold leading-snug">{item.title}</h3>
              <p className="text-sm opacity-75 line-clamp-2">{item.content}</p>
              <span className="mt-auto text-xs text-neon font-medium">Ler mais →</span>
            </article>
          ))}
          {latestNews.length === 0 && (
            <p className="col-span-full text-center opacity-60 py-12 border border-dashed border-border rounded-lg">
              Nenhuma noticia publicada ainda.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}