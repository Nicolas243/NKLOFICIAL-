import type { Metadata } from 'next';
import Link from 'next/link';
import { CatalogClient } from './catalog-client';
import { AdBanner } from '@/components/ads/ad-banner';
import { BlufSummary } from '@/components/seo/bluf-summary';
import { JsonLd } from '@/components/seo/json-ld';
import {
  buildStringsDatasetNode,
  SCHEMA_IDS,
  SITE_CONTENT_LAST_MODIFIED,
} from '@/lib/seo/schema-graph';
import { getAllStringsCatalog, type StringCatalogEntry } from '@/lib/seo/string-catalog-all';
import { STRING_COMPARISONS } from '@/lib/seo/string-comparisons';
import { absoluteSiteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Catálogo de Cordas',
  description: 'Explore e filtre encordoamentos para violino por núcleo, projeção, brilho, durabilidade e avaliações da comunidade.',
  alternates: { canonical: absoluteSiteUrl('/catalogo') },
};

export const dynamic = 'force-dynamic';

function getLatestUpdatedIso(items: StringCatalogEntry[]): string {
  let latest = SITE_CONTENT_LAST_MODIFIED;
  for (const item of items) {
    if (item.updatedAt instanceof Date && !Number.isNaN(item.updatedAt.getTime())) {
      const iso = item.updatedAt.toISOString();
      if (iso > latest) latest = iso;
    }
  }
  return latest;
}

function formatStringPrice(item: Pick<StringCatalogEntry, 'realPrice' | 'priceMin' | 'priceMax'>): string {
  if (item.realPrice) return `R$ ${item.realPrice}`;
  const min = item.priceMin ? Number(item.priceMin) : null;
  const max = item.priceMax ? Number(item.priceMax) : null;
  if (min !== null && max !== null && Number.isFinite(min) && Number.isFinite(max)) {
    return `R$ ${((min + max) / 2).toFixed(2)}`;
  }
  if (min !== null && Number.isFinite(min)) return `R$ ${min.toFixed(2)}`;
  if (max !== null && Number.isFinite(max)) return `R$ ${max.toFixed(2)}`;
  return 'Consulte ofertas';
}

const CORE_MATERIAL_CLIMATE_ROWS = [
  {
    core: 'Núcleo Sintético (Perlon e compostos)',
    responseProjection: 'Resposta equilibrada e projeção consistente para estudo, câmara e orquestra',
    soundColor: 'Timbre complexo e encorpado, próximo ao da tripa natural',
    brazilClimate: 'Boa estabilidade na umidade e no calor do Brasil após curto assentamento inicial',
    maintenance: 'Durabilidade média-alta e menor variação de afinação entre ensaios',
  },
  {
    core: 'Núcleo de Aço (sólido ou trançado)',
    responseProjection: 'Resposta imediata ao arco e projeção direta com ataque rápido',
    soundColor: 'Som brilhante, focado e direto, com menor complexidade de harmônicos médios',
    brazilClimate: 'Estabilidade elevada no litoral úmido e em variações térmicas intensas',
    maintenance: 'Maior durabilidade entre os três materiais e manutenção simples',
  },
  {
    core: 'Núcleo de Tripa (natural ou revestida)',
    responseProjection: 'Resposta orgânica e sensível à velocidade do arco',
    soundColor: 'Som quente, aberto e rico em harmônicos sem aspereza metálica',
    brazilClimate: 'Sensível à umidade elevada e ao calor, exigindo ajustes frequentes de afinação',
    maintenance: 'Durabilidade menor e necessidade de controle constante de tensão',
  },
] as const;

export default async function CatalogoPage() {
  const allStrings = await getAllStringsCatalog();
  const latestUpdatedIso = getLatestUpdatedIso(allStrings);
  const catalogUrl = absoluteSiteUrl('/catalogo');
  const totalMaterials = new Set(allStrings.map((item) => item.coreMaterial).filter(Boolean)).size;

  const topCuratedStrings = [...allStrings]
    .sort((a, b) => {
      const scoreDiff = Number(b.communityScore ?? 0) - Number(a.communityScore ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return a.name.localeCompare(b.name, 'pt-BR');
    })
    .slice(0, 24);

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 pt-8 pb-16">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'CollectionPage',
              '@id': `${catalogUrl}#webpage`,
              name: 'Catálogo Avançado de Cordas para Violino',
              description:
                'Explore e filtre encordoamentos para violino por núcleo, projeção, brilho, durabilidade e avaliações da comunidade.',
              url: catalogUrl,
              inLanguage: 'pt-BR',
              dateModified: latestUpdatedIso,
              isPartOf: { '@id': SCHEMA_IDS.website },
              publisher: { '@id': SCHEMA_IDS.organization },
              mainEntity: { '@id': SCHEMA_IDS.stringsDataset },
            },
            buildStringsDatasetNode(allStrings.length, latestUpdatedIso),
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Portal NKL', item: absoluteSiteUrl('/') },
                { '@type': 'ListItem', position: 2, name: 'Catálogo de Cordas', item: catalogUrl },
              ],
            },
          ],
        }}
      />

      <h1 className="font-playfair text-3xl font-bold mb-4">Catálogo Avançado de Cordas</h1>
      <div className="mb-8">
        <BlufSummary
          summary={`O catálogo de cordas para violino reúne ${allStrings.length} encordoamentos organizados por ${totalMaterials} tipos de núcleo, nível de qualidade, cor sonora, projeção, durabilidade, sensibilidade climática e faixa de preço real no Brasil. Use os filtros abaixo ou acesse os comparativos diretos para escolher o jogo adequado ao seu instrumento e clima.`}
          facts={[
            { label: 'Encordoamentos catalogados', value: String(allStrings.length) },
            { label: 'Critérios técnicos', value: 'Núcleo, projeção, cor e clima' },
            { label: 'Comparador direto', value: `${STRING_COMPARISONS.length} duelos curados` },
          ]}
          methodologyHref="/metodologia"
        />
      </div>

      <div className="mb-8">
        <AdBanner placement="in-feed" />
      </div>

      <CatalogClient
        initialData={allStrings}
        initialPage={1}
        initialTotalPages={1}
      />

      <details open className="mt-12 rounded-2xl border border-border bg-surface p-6">
        <summary className="cursor-pointer font-playfair text-2xl font-bold">
          Guia técnico, comparativos diretos e tabela completa das principais cordas
        </summary>

        <div className="mt-6 space-y-10">
          {STRING_COMPARISONS.length > 0 && (
            <section aria-labelledby="comparativos-cordas-catalogo">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Comparativos diretos de cordas</p>
              <h2 id="comparativos-cordas-catalogo" className="mt-1 font-playfair text-xl font-bold">
                Duelos lado a lado mais buscados
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {STRING_COMPARISONS.map((pair) => (
                  <Link
                    key={pair.slug}
                    href={`/comparar/${pair.slug}`}
                    className="rounded-xl border border-border bg-background p-4 transition-colors hover:border-neon"
                  >
                    <p className="text-xs font-bold text-neon">
                      {pair.leftName} vs {pair.rightName}
                    </p>
                    <p className="mt-1 text-sm font-bold">{pair.title}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="tabela-nucleo-clima-catalogo">
            <h2 id="tabela-nucleo-clima-catalogo" className="font-playfair text-xl font-bold">
              Núcleo Sintético vs Aço vs Tripa no clima úmido e quente do Brasil
            </h2>
            <p className="mt-2 text-sm opacity-75">
              Resumo prático de resposta, cor do som e estabilidade de afinação considerando calor e umidade regional.
            </p>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-background">
              <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                <thead className="border-b border-border bg-surface text-xs uppercase tracking-wider opacity-80">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-bold">Núcleo</th>
                    <th scope="col" className="px-4 py-3 font-bold">Resposta e projeção</th>
                    <th scope="col" className="px-4 py-3 font-bold">Cor do som</th>
                    <th scope="col" className="px-4 py-3 font-bold">Clima úmido/quente no Brasil</th>
                    <th scope="col" className="px-4 py-3 font-bold">Manutenção</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {CORE_MATERIAL_CLIMATE_ROWS.map((row) => (
                    <tr key={row.core}>
                      <th scope="row" className="px-4 py-3 font-bold">{row.core}</th>
                      <td className="px-4 py-3">{row.responseProjection}</td>
                      <td className="px-4 py-3">{row.soundColor}</td>
                      <td className="px-4 py-3">{row.brazilClimate}</td>
                      <td className="px-4 py-3">{row.maintenance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="tabela-curada-cordas">
            <h2 id="tabela-curada-cordas" className="font-playfair text-xl font-bold">
              Especificações das cordas em destaque no catálogo
            </h2>
            <p className="mt-2 text-sm opacity-75">
              Índice técnico direto para consulta de núcleo, nível, cor do som, projeção, durabilidade, preço e nota.
            </p>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-background">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="border-b border-border bg-surface text-xs uppercase tracking-wider opacity-80">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-bold">Corda</th>
                    <th scope="col" className="px-4 py-3 font-bold">Núcleo</th>
                    <th scope="col" className="px-4 py-3 font-bold">Nível</th>
                    <th scope="col" className="px-4 py-3 font-bold">Cor do Som</th>
                    <th scope="col" className="px-4 py-3 font-bold">Projeção</th>
                    <th scope="col" className="px-4 py-3 font-bold">Durabilidade</th>
                    <th scope="col" className="px-4 py-3 font-bold">Preço real</th>
                    <th scope="col" className="px-4 py-3 font-bold">Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {topCuratedStrings.map((item) => (
                    <tr key={item.id} className="hover:bg-surface/60">
                      <td className="px-4 py-3 font-bold">
                        <Link href={`/catalogo/${item.id}`} className="text-neon hover:underline">
                          {item.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{item.coreMaterial}</td>
                      <td className="px-4 py-3">{item.qualityLevel}</td>
                      <td className="px-4 py-3">{item.soundColor}</td>
                      <td className="px-4 py-3">{item.projection}</td>
                      <td className="px-4 py-3">{item.durability ?? '—'}</td>
                      <td className="px-4 py-3">{formatStringPrice(item)}</td>
                      <td className="px-4 py-3 font-bold">{item.communityScore ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </details>
    </div>
  );
}