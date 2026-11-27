import Link from 'next/link';
import type { PartnerProgramCard } from '@/actions/partner-programs';
import { OutboundLink } from '@/components/ui/outbound-link';
import { JsonLd } from '@/components/seo/json-ld';
import { BlufSummary } from '@/components/seo/bluf-summary';
import { CatalogStatsBox } from '@/components/seo/catalog-stats-box';
import type { ProgramHubDefinition } from '@/lib/program-hubs';
import { EditorialSupportOffers } from '@/components/income/editorial-support-offers';
import { SCHEMA_IDS, SITE_CONTENT_LAST_MODIFIED } from '@/lib/seo/schema-graph';
import { absoluteSiteUrl } from '@/lib/site';

type Props = {
  slug?: string;
  title: string;
  description: string;
  programs: PartnerProgramCard[];
  intro?: string;
  criteria?: string[];
  relatedHubs?: ProgramHubDefinition[];
};

function buildHubSummary(title: string, programs: PartnerProgramCard[]): {
  summary: string;
  zeroInvestmentPct: number;
  languagesLabel: string;
} {
  const total = programs.length;
  const zeroInvestmentCount = programs.filter((program) => program.zeroInvestmentRequired).length;
  const zeroInvestmentPct = total > 0 ? Math.round((zeroInvestmentCount / total) * 100) : 0;
  const languages = Array.from(new Set(programs.flatMap((program) => program.languages)));
  const languagesLabel = languages.length > 0 ? languages.join(', ') : 'Português e Inglês';

  if (total === 0) {
    return {
      summary: `Este guia para ${title.toLocaleLowerCase('pt-BR')} não possui oportunidades ativas listadas no momento. Consulte o catálogo completo para comparar alternativas atualizadas e seus requisitos antes de começar.`,
      zeroInvestmentPct,
      languagesLabel,
    };
  }

  return {
    summary: `Este guia reúne ${total} oportunidades verificadas para ${title.toLocaleLowerCase('pt-BR')}. Do total listado, ${zeroInvestmentPct}% dispensam investimento inicial, com opções disponíveis em ${languagesLabel}. Compare na tabela abaixo remuneração estimada, idioma, dificuldade e nota editorial antes de se cadastrar.`,
    zeroInvestmentPct,
    languagesLabel,
  };
}

export function ProgramHub({ slug, title, description, programs, intro, criteria = [], relatedHubs = [] }: Props) {
  const pageUrl = absoluteSiteUrl(slug ? `/programas/${slug}` : '/programas');
  const { summary, zeroInvestmentPct, languagesLabel } = buildHubSummary(title, programs);

  return (
    <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-4 md:pb-24 md:pt-10">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'CollectionPage',
            '@id': `${pageUrl}#webpage`,
            name: title,
            description,
            url: pageUrl,
            inLanguage: 'pt-BR',
            dateModified: SITE_CONTENT_LAST_MODIFIED,
            isPartOf: { '@id': SCHEMA_IDS.website },
            publisher: { '@id': SCHEMA_IDS.organization },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Portal NKL', item: absoluteSiteUrl('/') },
              { '@type': 'ListItem', position: 2, name: 'Renda Extra', item: absoluteSiteUrl('/programas') },
              ...(slug ? [{ '@type': 'ListItem', position: 3, name: title, item: pageUrl }] : []),
            ],
          },
          {
            '@type': 'ItemList',
            name: title,
            numberOfItems: programs.length,
            itemListElement: programs.map((program, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: program.name,
              url: absoluteSiteUrl(`/programas/${program.slug}`),
            })),
          },
        ],
      }} />
      <Link href="/programas" className="text-sm font-bold text-neon hover:underline">← Ver catálogo completo</Link>
      <header className="mt-5 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Guia de escolha</p>
        <h1 className="mt-3 font-playfair text-4xl font-bold leading-tight md:text-6xl">{title}</h1>
        <p className="mt-5 text-lg leading-relaxed opacity-75">{description}</p>
      </header>
      <div className="mt-8 space-y-6">
        <BlufSummary
          title={`Resumo do guia: ${title}`}
          summary={summary}
          facts={[
            { label: 'Oportunidades no guia', value: String(programs.length) },
            { label: 'Sem investimento inicial', value: `${zeroInvestmentPct}%` },
            { label: 'Idiomas presentes', value: languagesLabel },
          ]}
          methodologyHref="/metodologia"
        />
        <CatalogStatsBox programs={programs} compact />
      </div>
      {intro && (
        <section className="mt-8 max-w-4xl rounded-2xl border border-border bg-income-surface/70 p-6 md:p-8">
          <h2 className="font-playfair text-2xl font-bold">Como interpretar este guia</h2>
          <p className="mt-3 text-base leading-relaxed opacity-75">{intro}</p>
          {criteria.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-neon">Antes de começar</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed opacity-75">
                {criteria.map((criterion) => <li key={criterion}>{criterion}</li>)}
              </ul>
            </div>
          )}
        </section>
      )}
      <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Oportunidades selecionadas">
        {programs.length === 0 ? (
          <p className="rounded-xl border border-border p-6 opacity-70">Nenhuma oportunidade corresponde a este guia no momento.</p>
        ) : programs.map((program) => (
          <article key={program.id} className="flex flex-col rounded-xl border border-border bg-surface p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-neon">{program.category}</p>
            <h2 className="mt-2 font-playfair text-2xl font-bold">{program.name}</h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed opacity-75">{program.shortDescription}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <span className="rounded-md border border-border px-3 py-2">{program.averageEarning}</span>
              <span className="rounded-md border border-border px-3 py-2">{program.languages.join(' · ')}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/programas/${program.slug}`} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-border px-3 py-2 text-sm font-bold hover:border-neon hover:text-neon">
                Ler detalhes
              </Link>
              <OutboundLink href={program.affiliateUrl ?? program.websiteUrl} trackingId={`${program.slug}-hub`} sponsored={Boolean(program.affiliateUrl)} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-neon px-3 py-2 text-center text-sm font-bold text-black hover:opacity-90">
                Começar
              </OutboundLink>
            </div>
          </article>
        ))}
      </section>
      {programs.length > 0 && (
        <section className="mt-10" aria-labelledby="tabela-comparativa-hub">
          <h2 id="tabela-comparativa-hub" className="font-playfair text-2xl font-bold">
            Tabela comparativa das oportunidades
          </h2>
          <p className="mt-2 text-sm opacity-75">
            Visão direta de categoria, faixa de ganho, idiomas, exigência de capital inicial, dificuldade e nota editorial.
          </p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead className="border-b border-border bg-income-surface/70 text-xs uppercase tracking-wider text-foreground/75">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold">Plataforma</th>
                  <th scope="col" className="px-4 py-3 font-bold">Categoria</th>
                  <th scope="col" className="px-4 py-3 font-bold">Ganho estimado</th>
                  <th scope="col" className="px-4 py-3 font-bold">Idiomas</th>
                  <th scope="col" className="px-4 py-3 font-bold">Investimento inicial</th>
                  <th scope="col" className="px-4 py-3 font-bold">Dificuldade</th>
                  <th scope="col" className="px-4 py-3 font-bold">Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {programs.map((program) => (
                  <tr key={program.id} className="hover:bg-income-surface/40">
                    <td className="px-4 py-3 font-bold">
                      <Link href={`/programas/${program.slug}`} className="text-neon hover:underline">
                        {program.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{program.category}</td>
                    <td className="px-4 py-3">{program.averageEarning}</td>
                    <td className="px-4 py-3">{program.languages.join(' · ')}</td>
                    <td className="px-4 py-3">
                      {program.zeroInvestmentRequired ? 'Sem investimento inicial' : 'Pode exigir investimento'}
                    </td>
                    <td className="px-4 py-3 capitalize">{program.difficulty}</td>
                    <td className="px-4 py-3 font-bold">{program.finalRating.toFixed(1)}/10</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <p className="mt-8 max-w-4xl text-sm leading-relaxed opacity-65">
        O catálogo é editorial e pode mudar conforme disponibilidade, elegibilidade, regras e demanda de cada plataforma. Links de parceria, quando existirem, são identificados antes da saída do Portal NKL.
      </p>
      {relatedHubs.length > 0 && (
        <section className="mt-10 border-t border-border pt-8" aria-labelledby="outros-guias">
          <h2 id="outros-guias" className="font-playfair text-2xl font-bold">Continue comparando</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {relatedHubs.map((hub) => (
              <Link key={hub.slug} href={`/programas/${hub.slug}`} className="rounded-full border border-border px-4 py-2 text-sm font-bold transition-colors hover:border-neon hover:text-neon">
                {hub.title}
              </Link>
            ))}
          </div>
        </section>
      )}
      <EditorialSupportOffers />
    </div>
  );
}
