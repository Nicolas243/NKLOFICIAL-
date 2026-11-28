import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPartnerProgramBySlug, getPartnerPrograms } from '@/actions/partner-programs';
import { AffiliateDisclaimer } from '@/components/affiliate-disclaimer';
import { AuthorBio } from '@/components/seo/author-bio';
import { BlufSummary } from '@/components/seo/bluf-summary';
import { ProgramActions } from '@/components/income/program-actions';
import { ProgramFirstWithdrawal } from '@/components/income/program-first-withdrawal';
import { JsonLd } from '@/components/seo/json-ld';
import { ProgramSecondaryOffer } from '@/components/income/program-secondary-offer';
import { EditorialSupportOffers } from '@/components/income/editorial-support-offers';
import { ProgramStrategies } from '@/components/income/program-strategies';
import { OutboundLink } from '@/components/ui/outbound-link';
import { TrustBadges } from '@/components/ui/trust-badges';
import { SocialEmbed } from '@/components/video/social-embed';
import { PwaInstallButton } from '@/components/pwa';
import { Micro1OpportunitiesSection } from '@/components/micro1-opportunities-section';
import { MultiProjectSection } from '@/components/income/multi-project-section';
import { getMicro1Opportunities } from '@/lib/micro1-opportunities';
import { getMatchingProgramHubs } from '@/lib/program-hubs';
import { getProgramComparisonsForSlug } from '@/lib/seo/program-comparisons';
import { SCHEMA_IDS, SITE_CONTENT_LAST_MODIFIED } from '@/lib/seo/schema-graph';
import { absoluteSiteUrl, SITE_URL } from '@/lib/site';

type Params = Promise<{ slug: string }>;

export const dynamicParams = true;
export const dynamic = 'force-dynamic';
const BUY_ME_A_COFFEE_SLUG = 'monetizacao-atencao-web';
const BUY_ME_A_COFFEE_INVITE_URL = 'https://www.buymeacoffee.com/invite/ni2co3san9c';

const loadProgram = unstable_cache(
  async (slug: string) => getPartnerProgramBySlug(slug),
  ['partner-program-detail'],
  { revalidate: 300 },
);

const loadAllPrograms = unstable_cache(
  async () => getPartnerPrograms(),
  ['partner-program-detail-all'],
  { revalidate: 300 },
);

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const { slug } = await props.params;
  const program = await loadProgram(slug);

  if (!program) {
    return { title: 'Oportunidade não encontrada' };
  }

  const seoTitle = `${program.name}: como funciona, quanto paga e se vale a pena`;
  const seoDescription = `${program.shortDescription} Veja requisitos, remuneração (${program.averageEarning}), pontos positivos e como começar na ${program.name}.`;

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: { canonical: absoluteSiteUrl(`/programas/${program.slug}`) },
    openGraph: {
      type: 'article',
      title: seoTitle,
      description: seoDescription,
      url: absoluteSiteUrl(`/programas/${program.slug}`),
      images: [
        {
          url: absoluteSiteUrl('/images/areas/renda-extra.jpg'),
          width: 960,
          height: 540,
          alt: `${program.name} — Renda Extra Portal NKL`,
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

function formatVerifiedDate(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(value));
}

function buildProgramBlufSummary(program: NonNullable<Awaited<ReturnType<typeof getPartnerProgramBySlug>>>): string {
  const languagesText = program.languages.length > 0 ? program.languages.join(', ') : 'Português e Inglês';
  const investmentText = program.zeroInvestmentRequired
    ? 'não exige investimento inicial'
    : 'pode exigir investimento ou custo operacional';
  const paymentsText = program.paymentMethods.length > 0
    ? program.paymentMethods.join(', ')
    : 'meios definidos na plataforma';

  return `${program.name} atua na categoria ${program.category}, com referência de ganho de ${program.averageEarning}, nível de dificuldade ${program.difficulty} e operação em ${languagesText}. O acesso ${investmentText} e os repasses ocorrem via ${paymentsText}. Confira elegibilidade no Brasil e saque mínimo antes do cadastro.`;
}

export default async function PartnerProgramDetailsPage(props: { params: Params }) {
  const { slug } = await props.params;
  const [program, allPrograms] = await Promise.all([
    loadProgram(slug),
    loadAllPrograms().catch(() => []),
  ]);

  if (!program) notFound();

  const matchingHubs = getMatchingProgramHubs(program);
  const comparisons = getProgramComparisonsForSlug(program.slug);
  const tagSet = new Set(program.tags.map((tag) => tag.toLowerCase()));
  const relatedPrograms = allPrograms
    .filter((item) => item.slug !== program.slug)
    .map((item) => {
      let score = item.category === program.category ? 3 : 0;
      for (const tag of item.tags) {
        if (tagSet.has(tag.toLowerCase())) score += 1;
      }
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.item.finalRating - a.item.finalRating)
    .slice(0, 4)
    .map((entry) => entry.item);

  const verifiedDate = formatVerifiedDate(program.lastVerifiedAt);
  const siteUrl = SITE_URL;
  const canonicalUrl = absoluteSiteUrl(`/programas/${program.slug}`);
  const dateModified = program.lastVerifiedAt ?? SITE_CONTENT_LAST_MODIFIED;
  const aggregateRatingNode = program.communityRating !== null && program.communityReviewCount > 0
    ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: program.communityRating,
        bestRating: 10,
        worstRating: 0,
        ratingCount: program.communityReviewCount,
      },
    }
    : {};
  const micro1Result = program.slug === 'micro1'
    ? await getMicro1Opportunities()
      .then((opportunities) => ({ opportunities, error: null as string | null }))
      .catch((error: unknown) => {
        console.error('[PROGRAM_DETAIL] Falha ao carregar oportunidades da Micro1:', error);
        return {
          opportunities: [],
          error: error instanceof Error ? error.message : 'Não foi possível consultar a fonte pública.',
        };
      })
    : { opportunities: [], error: null as string | null };

  return (
    <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-4 md:pb-24 md:pt-10">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebPage',
            '@id': `${canonicalUrl}#webpage`,
            name: program.name,
            description: program.shortDescription,
            url: canonicalUrl,
            inLanguage: 'pt-BR',
            dateModified,
            isPartOf: { '@id': SCHEMA_IDS.website },
            author: { '@id': SCHEMA_IDS.author },
            publisher: { '@id': SCHEMA_IDS.organization },
            about: {
              '@type': 'Thing',
              name: program.name,
              description: program.longDescription,
              ...aggregateRatingNode,
            },
            ...aggregateRatingNode,
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Portal NKL', item: siteUrl },
              { '@type': 'ListItem', position: 2, name: 'Programas', item: `${siteUrl}/programas` },
              { '@type': 'ListItem', position: 3, name: program.name, item: canonicalUrl },
            ],
          },
        ],
      }} />

      <Link
        href="/programas"
        aria-label="Voltar para a lista de oportunidades"
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-neon/40 bg-income-card/70 px-4 py-2 text-sm font-bold text-neon shadow-sm transition hover:-translate-y-0.5 hover:border-neon hover:bg-neon/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        ← Ver outras oportunidades
      </Link>
      <article className="mt-5 overflow-hidden rounded-[1.5rem] border border-border bg-income-surface/90 md:rounded-[2rem]">
        <header className="border-b border-border p-6 md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">{program.category}</p>
          <h1 className="mt-3 font-playfair text-4xl font-bold leading-tight md:text-6xl">{program.name}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed opacity-75">{program.shortDescription}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ProgramActions name={program.name} slug={program.slug} url={canonicalUrl} />
            <PwaInstallButton kind="income" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-income-card/80 p-4">
              <p className="text-xs uppercase tracking-wide opacity-55">Remuneração de referência</p>
              <p className="mt-2 font-bold text-neon">{program.averageEarning}</p>
            </div>
            <div className="rounded-xl border border-border bg-income-card/80 p-4">
              <p className="text-xs uppercase tracking-wide opacity-55">Nota</p>
              <p className="mt-2 font-bold">{program.finalRating}/10</p>
              <p className="text-xs opacity-55">{program.communityReviewCount > 0 ? `${program.communityReviewCount} avaliações` : 'nota editorial'}</p>
            </div>
            <div className="rounded-xl border border-border bg-income-card/80 p-4">
              <p className="text-xs uppercase tracking-wide opacity-55">Idioma</p>
              <p className="mt-2 font-bold">{program.languages.join(' · ')}</p>
              {program.languages.some((language) => language !== 'Português') && (
                <Link
                  href="/idiomas"
                  className="mt-2 inline-flex rounded-full border border-orange/45 bg-orange/10 px-2.5 py-0.5 text-xs font-bold text-orange-700 transition hover:bg-orange hover:text-white dark:text-orange-300"
                >
                  Tem dificuldade com idioma?
                </Link>
              )}
            </div>
            <div className="rounded-xl border border-border bg-income-card/80 p-4">
              <p className="text-xs uppercase tracking-wide opacity-55">Dificuldade</p>
              <p className="mt-2 font-bold capitalize">{program.difficulty}</p>
            </div>
          </div>
          {verifiedDate && <p className="mt-4 text-xs opacity-55">Informações verificadas em {verifiedDate}.</p>}
        </header>

        <div className="border-b border-border px-6 py-6 md:px-10">
          <BlufSummary
            summary={buildProgramBlufSummary(program)}
            facts={[
              { label: 'Categoria', value: program.category },
              { label: 'Ganho de referência', value: program.averageEarning },
              {
                label: 'Investimento inicial',
                value: program.zeroInvestmentRequired ? 'Sem investimento inicial' : 'Pode exigir investimento',
              },
              {
                label: 'Formas de saque',
                value: program.paymentMethods.length > 0 ? program.paymentMethods.join(', ') : 'Conforme plataforma',
              },
            ]}
            verifiedAt={verifiedDate}
            verificationNotes="Requisitos, elegibilidade e formas de saque conferidos na curadoria editorial do Portal NKL."
          />
        </div>

        <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <section>
              <h2 className="font-playfair text-3xl font-bold">Como funciona e qual é o passo a passo?</h2>
              {program.slug === 'micro1' && (
                <div className="mt-5">
                  <Micro1OpportunitiesSection
                    opportunities={micro1Result.opportunities}
                    error={micro1Result.error}
                    variant="full"
                  />
                </div>
              )}
              {program.slug !== 'micro1' && (
                <MultiProjectSection slug={program.slug} programName={program.name} />
              )}
              {program.slug === BUY_ME_A_COFFEE_SLUG && (
                <section className="mt-5 rounded-xl border border-neon/25 bg-neon/5 p-5">
                  <p className="text-sm leading-relaxed">Convide outras pessoas para conhecer esta oportunidade.</p>
                  <OutboundLink
                    href={BUY_ME_A_COFFEE_INVITE_URL}
                    trackingId="buy-me-a-coffee-invite"
                    sponsored
                    className="mt-3 inline-flex min-h-11 items-center rounded-md bg-neon px-4 py-2 text-sm font-bold text-black hover:opacity-90"
                  >
                    Convidar no Pague um Café
                  </OutboundLink>
                </section>
              )}
              <ProgramFirstWithdrawal slug={program.slug} programName={program.name} description={program.longDescription} paymentMethods={program.paymentMethods} defaultOpen />
              <ProgramStrategies slug={program.slug} category={program.category} tags={program.tags} />
              <SocialEmbed youtubeId={program.youtubeVideoId} tiktokId={program.tiktokVideoId} programName={program.name} />
              <ProgramSecondaryOffer programSlug={program.slug} currentPage={1} />
            </section>
            <div className="mt-8">
              {(program.pros.length > 0 || program.cons.length > 0) && (
                <section className="rounded-xl border border-border bg-income-card/80 p-5">
                  <h2 className="font-bold">Resumo para decidir</h2>
                  <div className="mt-3 grid gap-5 sm:grid-cols-2">
                    {program.pros.length > 0 && <div><h3 className="font-bold text-emerald-300">Pontos positivos</h3><ul className="mt-2 space-y-2 text-sm leading-relaxed opacity-80">{program.pros.map((item) => <li key={item}>+ {item}</li>)}</ul></div>}
                    {program.cons.length > 0 && <div><h3 className="font-bold text-amber-200">Pontos de atenção</h3><ul className="mt-2 space-y-2 text-sm leading-relaxed opacity-80">{program.cons.map((item) => <li key={item}>- {item}</li>)}</ul></div>}
                  </div>
                </section>
              )}
            </div>
          </div>
          <aside className="space-y-5">
            <TrustBadges
              isZeroInvestment={program.zeroInvestmentRequired}
              tags={program.tags}
              requirements={program.requirements}
              paymentMethods={program.paymentMethods}
            />
            {program.requirements.length > 0 && (
              <section className="rounded-xl border border-border bg-income-card/80 p-5">
                <h2 className="font-bold">Requisitos e perfil</h2>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed opacity-75">
                  {program.requirements.map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </section>
            )}
            <div className="grid gap-3">
              <OutboundLink href={program.affiliateUrl ?? program.websiteUrl} trackingId={`${program.slug}-detail`} sponsored={Boolean(program.affiliateUrl)} className="inline-flex min-h-12 items-center justify-center rounded-md bg-neon px-5 py-3 text-center text-sm font-bold text-black hover:opacity-90">
                Acessar plataforma
              </OutboundLink>
              <Link href="/programas" className="inline-flex min-h-12 items-center justify-center rounded-md border border-border px-5 py-3 text-center text-sm font-bold hover:border-neon hover:text-neon">
                ← Ver outras oportunidades
              </Link>
            </div>
          </aside>
        </div>
        <div className="border-t border-border p-6 md:p-10 space-y-6">
          {comparisons.length > 0 && (
            <section aria-label={`Comparativos diretos com ${program.name}`}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon">Comparativos diretos</p>
              <h2 className="mt-1 font-playfair text-2xl font-bold">Compare {program.name} lado a lado</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {comparisons.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/programas/comparar/${item.slug}`}
                    className="rounded-xl border border-border bg-income-card/80 p-4 transition-colors hover:border-neon"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wider text-neon">{item.focusKeyword}</p>
                    <p className="mt-1 font-bold">{item.title}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {(matchingHubs.length > 0 || program.averageEarning.includes('US$')) && (
            <section aria-label="Categorias e guias relacionados">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon">Guias desta trilha</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {matchingHubs.map((hub) => (
                  <Link
                    key={hub.slug}
                    href={`/programas/${hub.slug}`}
                    className="rounded-full border border-border bg-income-card/80 px-3 py-1.5 text-xs font-bold transition-colors hover:border-neon hover:text-neon"
                  >
                    {hub.title}
                  </Link>
                ))}
                {program.averageEarning.includes('US$') && (
                  <Link
                    href="/programas/dolar"
                    className="rounded-full border border-border bg-income-card/80 px-3 py-1.5 text-xs font-bold transition-colors hover:border-neon hover:text-neon"
                  >
                    Oportunidades em dólar
                  </Link>
                )}
              </div>
            </section>
          )}
          {relatedPrograms.length > 0 && (
            <section aria-label="Outras oportunidades parecidas de renda extra">
              <h2 className="font-playfair text-2xl font-bold">Outras oportunidades parecidas de renda extra</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {relatedPrograms.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/programas/${related.slug}`}
                    className="rounded-xl border border-border bg-income-card/80 p-4 transition-colors hover:border-neon"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wider text-neon">{related.category}</p>
                    <p className="mt-1 font-bold">{related.name}</p>
                    <p className="mt-1 text-xs opacity-70">{related.averageEarning}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
          <AffiliateDisclaimer />
          <AuthorBio updatedLabel={verifiedDate ? `Ficha conferida em ${verifiedDate}` : 'Ficha editorial Portal NKL'} />
        </div>
      </article>
      <EditorialSupportOffers />
    </div>
  );
}
