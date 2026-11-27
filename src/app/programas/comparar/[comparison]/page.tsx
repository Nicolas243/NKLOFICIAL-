import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import {
  getPartnerProgramBySlug,
  getPartnerPrograms,
  type PartnerProgramCard,
} from '@/actions/partner-programs';
import { AuthorBio } from '@/components/seo/author-bio';
import { BlufSummary } from '@/components/seo/bluf-summary';
import { JsonLd } from '@/components/seo/json-ld';
import {
  PROGRAM_COMPARISONS,
  buildProgramComparisonVerdict,
  getProgramComparisonBySlug,
} from '@/lib/seo/program-comparisons';
import { SCHEMA_IDS, SITE_CONTENT_LAST_MODIFIED } from '@/lib/seo/schema-graph';
import { absoluteSiteUrl } from '@/lib/site';

type Params = Promise<{ comparison: string }>;

export const revalidate = 3600;

export function generateStaticParams() {
  return PROGRAM_COMPARISONS.map((entry) => ({ comparison: entry.slug }));
}

const loadProgramSafe = cache(async (slug: string): Promise<PartnerProgramCard | null> => {
  try {
    return await getPartnerProgramBySlug(slug);
  } catch {
    return null;
  }
});

const loadAllProgramsSafe = cache(async (): Promise<PartnerProgramCard[]> => {
  return getPartnerPrograms().catch(() => []);
});

function formatVerifiedDate(left: PartnerProgramCard, right: PartnerProgramCard): string {
  const candidates = [left.lastVerifiedAt, right.lastVerifiedAt]
    .filter((value): value is string => typeof value === 'string' && value.trim() !== '')
    .map((value) => Date.parse(value))
    .filter((ms) => Number.isFinite(ms));

  const targetDate =
    candidates.length > 0
      ? new Date(Math.max(...candidates))
      : new Date(SITE_CONTENT_LAST_MODIFIED);

  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(targetDate);
}

function buildPageDescription(left: PartnerProgramCard, right: PartnerProgramCard): string {
  return `Comparativo direto entre ${left.name} (${left.averageEarning}, nota ${left.finalRating}/10) e ${right.name} (${right.averageEarning}, nota ${right.finalRating}/10): requisitos, idiomas, meios de pagamento e quando escolher cada plataforma.`;
}

function ProgramDecisionBox({
  program,
  reasons,
}: {
  program: PartnerProgramCard;
  reasons: string[];
}) {
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-border bg-income-surface/90 p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon">{program.category}</p>
        <h2 className="mt-2 font-playfair text-2xl font-bold">Escolha {program.name} se...</h2>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-foreground/85">
          {reasons.map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>

        {program.pros.length > 0 && (
          <div className="mt-5 border-t border-border/70 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Pontos positivos
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm text-foreground/80">
              {program.pros.slice(0, 3).map((item) => (
                <li key={item}>+ {item}</li>
              ))}
            </ul>
          </div>
        )}

        {program.cons.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-200">
              Pontos de atenção
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm text-foreground/80">
              {program.cons.slice(0, 3).map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-6 pt-2">
        <Link
          href={`/programas/${program.slug}`}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-neon px-4 py-2.5 text-sm font-bold text-black transition-opacity hover:opacity-90"
        >
          Ver ficha completa de {program.name}
        </Link>
      </div>
    </article>
  );
}

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const { comparison } = await props.params;
  const pair = getProgramComparisonBySlug(comparison);

  if (!pair) {
    return { title: 'Comparativo não encontrado' };
  }

  const [left, right] = await Promise.all([
    loadProgramSafe(pair.leftSlug),
    loadProgramSafe(pair.rightSlug),
  ]);

  if (!left || !right) {
    return {
      title: pair.title,
      alternates: { canonical: absoluteSiteUrl(`/programas/comparar/${pair.slug}`) },
    };
  }

  const seoTitle = `${left.name} vs ${right.name}: qual paga melhor e vale mais a pena?`;
  const seoDescription = buildPageDescription(left, right);
  const canonicalUrl = absoluteSiteUrl(`/programas/comparar/${pair.slug}`);

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'article',
      title: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
      images: [
        {
          url: absoluteSiteUrl('/images/areas/renda-extra.jpg'),
          width: 960,
          height: 540,
          alt: `${left.name} vs ${right.name} — Portal NKL`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: [absoluteSiteUrl('/images/areas/renda-extra.jpg')],
    },
  };
}

export default async function ProgramComparisonPage(props: { params: Params }) {
  const { comparison } = await props.params;
  const pair = getProgramComparisonBySlug(comparison);

  if (!pair) {
    notFound();
  }

  const [left, right, allPrograms] = await Promise.all([
    loadProgramSafe(pair.leftSlug),
    loadProgramSafe(pair.rightSlug),
    loadAllProgramsSafe(),
  ]);

  if (!left || !right) {
    notFound();
  }

  const verdict = buildProgramComparisonVerdict(left, right);
  const verifiedAt = formatVerifiedDate(left, right);
  const canonicalUrl = absoluteSiteUrl(`/programas/comparar/${pair.slug}`);
  const headline = `${left.name} vs ${right.name}: qual paga melhor e vale mais a pena?`;
  const description = buildPageDescription(left, right);

  const comparisonRows: Array<{ label: string; leftValue: string; rightValue: string }> = [
    {
      label: 'Categoria',
      leftValue: left.category,
      rightValue: right.category,
    },
    {
      label: 'Ganho estimado',
      leftValue: left.averageEarning,
      rightValue: right.averageEarning,
    },
    {
      label: 'Idiomas',
      leftValue: left.languages.length > 0 ? left.languages.join(', ') : 'Não informado',
      rightValue: right.languages.length > 0 ? right.languages.join(', ') : 'Não informado',
    },
    {
      label: 'Investimento inicial',
      leftValue: left.zeroInvestmentRequired ? 'Zero (sem custo inicial)' : 'Pode exigir investimento',
      rightValue: right.zeroInvestmentRequired ? 'Zero (sem custo inicial)' : 'Pode exigir investimento',
    },
    {
      label: 'Dificuldade',
      leftValue: left.difficulty,
      rightValue: right.difficulty,
    },
    {
      label: 'Meios de pagamento',
      leftValue: left.paymentMethods.length > 0 ? left.paymentMethods.join(', ') : 'Consultar ficha',
      rightValue: right.paymentMethods.length > 0 ? right.paymentMethods.join(', ') : 'Consultar ficha',
    },
    {
      label: 'Requisitos principais',
      leftValue: left.requirements.length > 0 ? left.requirements.slice(0, 3).join('; ') : 'Consultar ficha',
      rightValue: right.requirements.length > 0 ? right.requirements.slice(0, 3).join('; ') : 'Consultar ficha',
    },
    {
      label: 'Nota NKL',
      leftValue: `${left.finalRating}/10`,
      rightValue: `${right.finalRating}/10`,
    },
  ];

  const otherComparisons = PROGRAM_COMPARISONS.filter((entry) => entry.slug !== pair.slug).sort(
    (a, b) => {
      const aRelated =
        a.leftSlug === pair.leftSlug ||
        a.rightSlug === pair.leftSlug ||
        a.leftSlug === pair.rightSlug ||
        a.rightSlug === pair.rightSlug
          ? 1
          : 0;
      const bRelated =
        b.leftSlug === pair.leftSlug ||
        b.rightSlug === pair.leftSlug ||
        b.leftSlug === pair.rightSlug ||
        b.rightSlug === pair.rightSlug
          ? 1
          : 0;
      return bRelated - aRelated;
    },
  );

  const catalogCountLabel =
    allPrograms.length > 0 ? `Base comparada dentro de ${allPrograms.length} programas ativos.` : undefined;

  return (
    <div className="relative mx-auto w-full min-w-0 max-w-5xl px-4 pb-16 pt-4 md:pb-24 md:pt-10">
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
                  '@type': 'Thing',
                  name: left.name,
                  url: absoluteSiteUrl(`/programas/${left.slug}`),
                },
                {
                  '@type': 'Thing',
                  name: right.name,
                  url: absoluteSiteUrl(`/programas/${right.slug}`),
                },
              ],
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Início', item: absoluteSiteUrl('/') },
                { '@type': 'ListItem', position: 2, name: 'Programas', item: absoluteSiteUrl('/programas') },
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

      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-xs text-foreground/70">
        <Link href="/" className="hover:text-neon hover:underline">
          Início
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/programas" className="hover:text-neon hover:underline">
          Programas
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-foreground">{left.name} vs {right.name}</span>
      </nav>

      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">
          Comparativo de plataformas
        </p>
        <h1 className="mt-2 font-playfair text-3xl font-bold leading-tight md:text-5xl">
          {left.name} vs {right.name}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed opacity-75">
          Diferenças práticas de remuneração, requisitos de entrada, idioma, meios de saque e perfil indicado para decidir entre {left.name} e {right.name}.
        </p>
      </header>

      <BlufSummary
        eyebrow="Veredito direto"
        title={`${left.name} ou ${right.name}: qual faz mais sentido?`}
        summary={verdict.bluf}
        facts={[
          { label: left.name, value: `${left.averageEarning} · ${left.finalRating}/10` },
          { label: right.name, value: `${right.averageEarning} · ${right.finalRating}/10` },
          {
            label: `Investimento (${left.name})`,
            value: left.zeroInvestmentRequired ? 'Zero inicial' : 'Exige estrutura',
          },
          {
            label: `Investimento (${right.name})`,
            value: right.zeroInvestmentRequired ? 'Zero inicial' : 'Exige estrutura',
          },
        ]}
        verifiedAt={verifiedAt}
        verificationNotes={catalogCountLabel}
        methodologyHref="/metodologia"
      />

      <section aria-label="Tabela comparativa" className="mt-8">
        <h2 className="font-playfair text-2xl font-bold md:text-3xl">
          Tabela comparativa lado a lado
        </h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-income-surface/90">
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-income-card/90">
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
                <tr key={row.label} className="border-b border-border/70 last:border-0">
                  <th scope="row" className="px-4 py-3.5 font-semibold text-foreground/85">
                    {row.label}
                  </th>
                  <td className="px-4 py-3.5 text-foreground/80">{row.leftValue}</td>
                  <td className="px-4 py-3.5 text-foreground/80">{row.rightValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="Critérios de decisão" className="mt-8 grid gap-6 md:grid-cols-2">
        <ProgramDecisionBox program={left} reasons={verdict.chooseLeft} />
        <ProgramDecisionBox program={right} reasons={verdict.chooseRight} />
      </section>

      <section aria-label="Outros comparativos e catálogo" className="mt-10 rounded-2xl border border-border bg-income-surface/80 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-playfair text-2xl font-bold">Outros comparativos de plataformas</h2>
          <Link
            href="/programas"
            className="rounded-md border border-neon px-4 py-2 text-xs font-bold text-neon transition-colors hover:bg-neon hover:text-black"
          >
            Ver todas as oportunidades
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {otherComparisons.slice(0, 6).map((item) => (
            <Link
              key={item.slug}
              href={`/programas/comparar/${item.slug}`}
              className="rounded-xl border border-border bg-income-card/80 p-4 text-sm font-semibold transition-colors hover:border-neon hover:text-neon"
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
