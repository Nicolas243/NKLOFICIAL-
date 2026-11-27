import type { Metadata } from 'next';
import Link from 'next/link';
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
import { CompararClient, type StringComparisonItem } from './comparar-client';

export const metadata: Metadata = {
  title: 'Comparador de Cordas',
  description: 'Compare cordas de violino lado a lado por preço, núcleo, resposta, projeção, durabilidade e avaliações da comunidade.',
  alternates: {
    canonical: absoluteSiteUrl('/comparar'),
  },
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

const CORE_MATERIAL_CLIMATE_ROWS = [
  {
    core: 'Núcleo Sintético (Perlon e compostos)',
    responseProjection: 'Resposta equilibrada e projeção consistente em sala e orquestra',
    soundColor: 'Timbre complexo e encorpado, próximo ao da tripa natural',
    brazilClimate: 'Boa estabilidade na umidade e no calor do Brasil após curto assentamento inicial',
    maintenance: 'Durabilidade média-alta e menor variação de afinação entre ensaios',
  },
  {
    core: 'Núcleo de Aço (sólido ou trançado)',
    responseProjection: 'Resposta imediata ao arco e projeção direta com ataque rápido',
    soundColor: 'Som brilhante, focado e direto, com menor complexidade de harmônicos médios',
    brazilClimate: 'Estabilidade elevada no litoral úmido e em variações térmicas intensas',
    maintenance: 'Maior durabilidade entre os três tipos e manutenção simples',
  },
  {
    core: 'Núcleo de Tripa (natural ou revestida)',
    responseProjection: 'Resposta orgânica e sensível à velocidade do arco',
    soundColor: 'Som quente, aberto e rico em harmônicos sem aspereza metálica',
    brazilClimate: 'Sensível à umidade elevada e ao calor, exigindo ajustes frequentes de afinação',
    maintenance: 'Durabilidade menor e necessidade de controle constante de tensão',
  },
] as const;

export default async function CompararPage() {
  const allStrings = await getAllStringsCatalog().catch(() => [] as StringCatalogEntry[]);
  const latestUpdatedIso = getLatestUpdatedIso(allStrings);
  const pageUrl = absoluteSiteUrl('/comparar');

  const initialItems: StringComparisonItem[] = allStrings.map((row) => ({
    id: row.id,
    name: row.name,
    coreMaterial: row.coreMaterial,
    qualityLevel: row.qualityLevel,
    realPrice: row.realPrice,
    communityScore: row.communityScore,
    responseSpeed: row.responseSpeed,
    projection: row.projection,
    soundColor: row.soundColor,
    durability: row.durability,
    environment: row.environment,
    climateSensitivity: row.climateSensitivity,
    coating: row.coating,
    fixation: row.fixation,
    arcTolerance: row.arcTolerance,
    affiliateLinks: row.affiliateLinks,
  }));

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebPage',
              '@id': `${pageUrl}#webpage`,
              name: 'Comparador de Cordas para Violino',
              description:
                'Compare cordas de violino lado a lado por preço, núcleo, resposta, projeção, durabilidade e avaliações da comunidade.',
              url: pageUrl,
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
                { '@type': 'ListItem', position: 2, name: 'Catálogo de Cordas', item: absoluteSiteUrl('/catalogo') },
                { '@type': 'ListItem', position: 3, name: 'Comparador de Cordas', item: pageUrl },
              ],
            },
          ],
        }}
      />

      <CompararClient initialItems={initialItems} />

      <div className="max-w-5xl w-full mx-auto px-4 pb-16 space-y-8">
        <BlufSummary
          summary={`O comparador lado a lado cruza ${allStrings.length} encordoamentos de violino em 13 critérios objetivos: nível, preço real em reais, nota da comunidade, material do núcleo, cor do som, velocidade de resposta, projeção, durabilidade, ambiente, sensibilidade climática, revestimento, fixação e tolerância de arco.`}
          facts={[
            { label: 'Modelos disponíveis', value: String(allStrings.length) },
            { label: 'Critérios comparados', value: '13 atributos técnicos' },
            { label: 'Comparativos curados', value: String(STRING_COMPARISONS.length) },
          ]}
          methodologyHref="/metodologia"
        />

        <details open className="rounded-2xl border border-border bg-surface p-6">
          <summary className="cursor-pointer font-playfair text-2xl font-bold">
            Comparativos diretos de cordas e guia de núcleo no clima brasileiro
          </summary>

          <div className="mt-6 space-y-10">
            {STRING_COMPARISONS.length > 0 && (
              <section aria-labelledby="comparativos-diretos-comparar">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Comparativos diretos de cordas</p>
                <h2 id="comparativos-diretos-comparar" className="mt-1 font-playfair text-xl font-bold">
                  Duelos prontos para consulta
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

            <section aria-labelledby="tabela-nucleo-clima-comparar">
              <h2 id="tabela-nucleo-clima-comparar" className="font-playfair text-xl font-bold">
                Núcleo Sintético vs Aço vs Tripa no clima úmido e quente do Brasil
              </h2>
              <p className="mt-2 text-sm opacity-75">
                Comparação rápida entre materiais de núcleo considerando resposta acústica, timbre e estabilidade sob calor e umidade.
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
          </div>
        </details>
      </div>
    </>
  );
}
