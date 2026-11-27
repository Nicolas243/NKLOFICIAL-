import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { AuthorBio } from '@/components/seo/author-bio';
import { BlufSummary } from '@/components/seo/bluf-summary';
import { JsonLd } from '@/components/seo/json-ld';
import { getAllStringsCatalog, type StringCatalogEntry } from '@/lib/seo/string-catalog-all';
import {
  STRING_COMPARISONS,
  buildStringComparisonVerdict,
  findStringEntryByName,
  getStringComparisonBySlug,
} from '@/lib/seo/string-comparisons';
import { SCHEMA_IDS, SITE_CONTENT_LAST_MODIFIED } from '@/lib/seo/schema-graph';
import { absoluteSiteUrl } from '@/lib/site';

type Params = Promise<{ comparison: string }>;

export const revalidate = 3600;

export function generateStaticParams() {
  return STRING_COMPARISONS.map((entry) => ({ comparison: entry.slug }));
}

const loadStringsSafe = cache(async (): Promise<StringCatalogEntry[] | null> => {
  try {
    return await getAllStringsCatalog();
  } catch {
    return null;
  }
});

function formatStringPrice(entry: StringCatalogEntry): string {
  const real = entry.realPrice ? Number(entry.realPrice) : NaN;
  if (Number.isFinite(real) && real > 0) {
    return `R$ ${real.toFixed(2).replace('.', ',')}`;
  }
  const min = entry.priceMin ? Number(entry.priceMin) : NaN;
  const max = entry.priceMax ? Number(entry.priceMax) : NaN;
  if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max > 0) {
    return `R$ ${((min + max) / 2).toFixed(2).replace('.', ',')}`;
  }
  if (Number.isFinite(min) && min > 0) return `R$ ${min.toFixed(2).replace('.', ',')}`;
  if (Number.isFinite(max) && max > 0) return `R$ ${max.toFixed(2).replace('.', ',')}`;
  return 'Consultar ofertas';
}

function formatCommunityScore(score: string | null): string {
  if (!score) return 'Sem nota';
  const parsed = Number(score);
  if (!Number.isFinite(parsed) || parsed <= 0) return 'Sem nota';
  return `${parsed}/10`;
}

function formatVerifiedDate(left: StringCatalogEntry, right: StringCatalogEntry): string {
  const timestamps = [left.updatedAt, right.updatedAt]
    .map((date) => (date instanceof Date ? date.getTime() : Date.parse(String(date))))
    .filter((ms) => Number.isFinite(ms));

  const targetDate =
    timestamps.length > 0
      ? new Date(Math.max(...timestamps))
      : new Date(SITE_CONTENT_LAST_MODIFIED);

  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(targetDate);
}

function buildDescription(left: StringCatalogEntry, right: StringCatalogEntry): string {
  return `Comparativo técnico entre ${left.name} (${left.coreMaterial}, som ${left.soundColor}) e ${right.name} (${right.coreMaterial}, som ${right.soundColor}): projeção, resposta, durabilidade e preço médio no Brasil.`;
}

function StringDecisionBox({
  entry,
  reasons,
}: {
  entry: StringCatalogEntry;
  reasons: string[];
}) {
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon">
          Nível {entry.qualityLevel} · {entry.coreMaterial}
        </p>
        <h2 className="mt-2 font-playfair text-2xl font-bold">Escolha {entry.name} se...</h2>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed opacity-85">
          {reasons.map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>
      </div>
      <div className="mt-6 flex flex-wrap gap-3 pt-2">
        <Link
          href={`/catalogo/${entry.id}`}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-neon px-4 py-2.5 text-center text-sm font-bold text-black transition-opacity hover:opacity-90"
        >
          Ver ficha de {entry.name}
        </Link>
      </div>
    </article>
  );
}

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const { comparison } = await props.params;
  const pair = getStringComparisonBySlug(comparison);

  if (!pair) {
    return { title: 'Comparativo de cordas não encontrado' };
  }

  const strings = await loadStringsSafe();
  const left = strings ? findStringEntryByName(strings, pair.leftName) : null;
  const right = strings ? findStringEntryByName(strings, pair.rightName) : null;
  const canonicalUrl = absoluteSiteUrl(`/comparar/${pair.slug}`);

  if (!left || !right) {
    return {
      title: pair.title,
      alternates: { canonical: canonicalUrl },
    };
  }

  const seoTitle = `${left.name} vs ${right.name}: comparativo de cordas para violino`;
  const seoDescription = buildDescription(left, right);

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'article',
      title: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
    },
  };
}

export default async function StringComparisonPage(props: { params: Params }) {
  const { comparison } = await props.params;
  const pair = getStringComparisonBySlug(comparison);

  if (!pair) {
    notFound();
  }

  const strings = await loadStringsSafe();
  if (!strings) {
    notFound();
  }

  const left = findStringEntryByName(strings, pair.leftName);
  const right = findStringEntryByName(strings, pair.rightName);

  if (!left || !right) {
    notFound();
  }

  const verdict = buildStringComparisonVerdict(left, right);
  const verifiedAt = formatVerifiedDate(left, right);
  const canonicalUrl = absoluteSiteUrl(`/comparar/${pair.slug}`);
  const headline = `${left.name} vs ${right.name}: comparativo de cordas para violino`;
  const description = buildDescription(left, right);

  const comparisonRows: Array<{ label: string; leftValue: string; rightValue: string }> = [
    {
      label: 'Material do Núcleo',
      leftValue: left.coreMaterial || '—',
      rightValue: right.coreMaterial || '—',
    },
    {
      label: 'Nível',
      leftValue: left.qualityLevel || '—',
      rightValue: right.qualityLevel || '—',
    },
    {
      label: 'Cor do Som',
      leftValue: left.soundColor || '—',
      rightValue: right.soundColor || '—',
    },
    {
      label: 'Projeção',
      leftValue: left.projection || '—',
      rightValue: right.projection || '—',
    },
    {
      label: 'Velocidade de Resposta',
      leftValue: left.responseSpeed || '—',
      rightValue: right.responseSpeed || '—',
    },
    {
      label: 'Durabilidade',
      leftValue: left.durability || '—',
      rightValue: right.durability || '—',
    },
    {
      label: 'Sensibilidade Climática',
      leftValue: left.climateSensitivity || '—',
      rightValue: right.climateSensitivity || '—',
    },
    {
      label: 'Tolerância de Arco',
      leftValue: left.arcTolerance || '—',
      rightValue: right.arcTolerance || '—',
    },
    {
      label: 'Ambiente',
      leftValue: left.environment || '—',
      rightValue: right.environment || '—',
    },
    {
      label: 'Preço médio no Brasil',
      leftValue: formatStringPrice(left),
      rightValue: formatStringPrice(right),
    },
    {
      label: 'Nota da Comunidade',
      leftValue: formatCommunityScore(left.communityScore),
      rightValue: formatCommunityScore(right.communityScore),
    },
  ];

  const siblingComparisons = STRING_COMPARISONS.filter((entry) => entry.slug !== pair.slug);

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl px-4 pb-16 pt-8 md:pb-24">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Article',
              headline,
              description,
              url: canonicalUrl,
              mainEntityOfPage: canonicalUrl,
              inLanguage: 'pt-BR',
              dateModified: SITE_CONTENT_LAST_MODIFIED,
              author: { '@id': SCHEMA_IDS.author },
              publisher: { '@id': SCHEMA_IDS.organization },
              isPartOf: { '@id': SCHEMA_IDS.website },
              about: [
                {
                  '@type': 'Product',
                  name: left.name,
                  url: absoluteSiteUrl(`/catalogo/${left.id}`),
                },
                {
                  '@type': 'Product',
                  name: right.name,
                  url: absoluteSiteUrl(`/catalogo/${right.id}`),
                },
              ],
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Início', item: absoluteSiteUrl('/') },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Comparar Cordas',
                  item: absoluteSiteUrl('/comparar'),
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: `${left.name} vs ${right.name}`,
                  item: canonicalUrl,
                },
              ],
            },
          ],
        }}
      />

      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-xs opacity-70">
        <Link href="/" className="hover:text-neon hover:underline">
          Início
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/comparar" className="hover:text-neon hover:underline">
          Comparar Cordas
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-semibold opacity-100">{left.name} vs {right.name}</span>
      </nav>

      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">
          Comparativo técnico de cordas
        </p>
        <h1 className="mt-2 font-playfair text-3xl font-bold leading-tight md:text-5xl">
          {left.name} vs {right.name}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed opacity-75">
          Análise lado a lado de núcleo, cor sonora, projeção, velocidade de resposta, durabilidade e faixa de preço para violino.
        </p>
      </header>

      <BlufSummary
        eyebrow="Resumo técnico"
        title={`${left.name} ou ${right.name}: qual combina melhor com seu violino?`}
        summary={verdict.bluf}
        facts={[
          { label: left.name, value: `${left.soundColor} · ${formatStringPrice(left)}` },
          { label: right.name, value: `${right.soundColor} · ${formatStringPrice(right)}` },
          { label: `Núcleo (${left.name})`, value: left.coreMaterial },
          { label: `Núcleo (${right.name})`, value: right.coreMaterial },
        ]}
        verifiedAt={verifiedAt}
        verificationNotes={`Catálogo conferido com ${strings.length} encordoamentos.`}
        methodologyHref="/metodologia"
      />

      <section aria-label="Tabela técnica comparativa" className="mt-8">
        <h2 className="font-playfair text-2xl font-bold md:text-3xl">
          Especificações lado a lado
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th scope="col" className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider opacity-70">
                  Critério
                </th>
                <th scope="col" className="px-4 py-3.5 font-playfair text-base font-bold text-neon">
                  {left.name}
                </th>
                <th scope="col" className="px-4 py-3.5 font-playfair text-base font-bold text-neon">
                  {right.name}
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.label} className="border-b border-border last:border-0">
                  <th scope="row" className="px-4 py-3.5 font-medium">
                    {row.label}
                  </th>
                  <td className="px-4 py-3.5 opacity-90">{row.leftValue}</td>
                  <td className="px-4 py-3.5 opacity-90">{row.rightValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="Critérios de escolha" className="mt-8 grid gap-6 md:grid-cols-2">
        <StringDecisionBox entry={left} reasons={verdict.chooseLeft} />
        <StringDecisionBox entry={right} reasons={verdict.chooseRight} />
      </section>

      <section aria-label="Ferramentas e metodologia" className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/comparar"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-neon px-5 py-2.5 text-sm font-bold text-neon transition-colors hover:bg-neon hover:text-black"
        >
          Abrir comparador interativo de cordas
        </Link>
        <Link
          href="/metodologia"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-5 py-2.5 text-sm font-bold transition-colors hover:border-neon hover:text-neon"
        >
          Ver critérios e metodologia
        </Link>
      </section>

      <section aria-label="Outros comparativos de cordas" className="mt-10 rounded-xl border border-border bg-surface p-6">
        <h2 className="font-playfair text-2xl font-bold">Outros comparativos de cordas</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {siblingComparisons.map((item) => (
            <Link
              key={item.slug}
              href={`/comparar/${item.slug}`}
              className="rounded-lg border border-border bg-background/60 p-4 text-sm font-semibold transition-colors hover:border-neon hover:text-neon"
            >
              {item.title}
            </Link>
          ))}
        </div>
      </section>

      <AuthorBio updatedLabel={`Comparativo conferido em ${verifiedAt}`} />
    </div>
  );
}
