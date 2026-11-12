import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPartnerProgramBySlug } from '@/actions/partner-programs';
import { AffiliateDisclaimer } from '@/components/affiliate-disclaimer';
import { ProgramActions } from '@/components/income/program-actions';
import { ProgramFirstWithdrawal } from '@/components/income/program-first-withdrawal';
import { JsonLd } from '@/components/seo/json-ld';
import { ClipboardCopy } from '@/components/ui/clipboard-copy';
import { ProgramSecondaryOffer } from '@/components/income/program-secondary-offer';
import { ProgramStrategies } from '@/components/income/program-strategies';
import { OutboundLink } from '@/components/ui/outbound-link';
import { TrustBadges } from '@/components/ui/trust-badges';
import { SocialEmbed } from '@/components/video/social-embed';
import { PwaInstallButton } from '@/components/pwa';
import { absoluteSiteUrl, SITE_URL } from '@/lib/site';

type Params = Promise<{ slug: string }>;

export const dynamicParams = true;
export const dynamic = 'force-dynamic';
const UTEST_STRATEGIC_TIP = 'Dica: ao responder formulários de novos projetos, informe quando você foi indicado por uma referência experiente, se isso for verdadeiro e puder ser comprovado.';
const UTEST_REFERRAL_URL = 'https://www.utest.com/ref2535825';
const BUY_ME_A_COFFEE_SLUG = 'monetizacao-atencao-web';
const BUY_ME_A_COFFEE_INVITE_URL = 'https://www.buymeacoffee.com/invite/ni2co3san9c';

const loadProgram = unstable_cache(
  async (slug: string) => getPartnerProgramBySlug(slug),
  ['partner-program-detail'],
  { revalidate: 300 },
);

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const { slug } = await props.params;
  const program = await loadProgram(slug);

  if (!program) {
    return { title: 'Oportunidade não encontrada' };
  }

  return {
    title: program.name,
    description: program.shortDescription,
    alternates: { canonical: absoluteSiteUrl(`/programas/${program.slug}`) },
    openGraph: {
      type: 'article',
      title: program.name,
      description: program.shortDescription,
      url: absoluteSiteUrl(`/programas/${program.slug}`),
    },
  };
}

function formatVerifiedDate(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(value));
}

export default async function PartnerProgramDetailsPage(props: { params: Params }) {
  const { slug } = await props.params;
  const program = await loadProgram(slug);

  if (!program) notFound();

  const verifiedDate = formatVerifiedDate(program.lastVerifiedAt);
  const siteUrl = SITE_URL;
  const canonicalUrl = absoluteSiteUrl(`/programas/${program.slug}`);

  return (
    <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-4 md:pb-24 md:pt-10">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: program.name,
        description: program.shortDescription,
        url: canonicalUrl,
        about: {
          '@type': 'Thing',
          name: program.name,
          description: program.longDescription,
        },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Programas', item: `${siteUrl}/programas` },
            { '@type': 'ListItem', position: 2, name: program.name, item: canonicalUrl },
          ],
        },
        ...(program.communityRating !== null && program.communityReviewCount > 0
          ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: program.communityRating,
              bestRating: 10,
              worstRating: 0,
              ratingCount: program.communityReviewCount,
            },
          }
          : {}),
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
            </div>
            <div className="rounded-xl border border-border bg-income-card/80 p-4">
              <p className="text-xs uppercase tracking-wide opacity-55">Dificuldade</p>
              <p className="mt-2 font-bold capitalize">{program.difficulty}</p>
            </div>
          </div>
          {verifiedDate && <p className="mt-4 text-xs opacity-55">Informações verificadas em {verifiedDate}.</p>}
        </header>

        <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <section>
              <h2 className="font-playfair text-3xl font-bold">Como funciona e qual é o passo a passo?</h2>
              <p className="mt-4 whitespace-pre-line text-base leading-relaxed opacity-80">{program.longDescription}</p>
              <ProgramSecondaryOffer programSlug={program.slug} currentPage={1} />
              {program.slug === BUY_ME_A_COFFEE_SLUG && (
                <section className="mt-5 rounded-xl border border-neon/25 bg-neon/5 p-5">
                  <p className="text-sm leading-relaxed">Convide outras pessoas para conhecer esta oportunidade.</p>
                  <OutboundLink
                    href={BUY_ME_A_COFFEE_INVITE_URL}
                    trackingId="buy-me-a-coffee-invite"
                    sponsored
                    className="mt-3 inline-flex min-h-11 items-center rounded-md bg-neon px-4 py-2 text-sm font-bold text-black hover:opacity-90"
                  >
                    Convidar no Buy Me a Coffee
                  </OutboundLink>
                </section>
              )}
              <ProgramFirstWithdrawal slug={program.slug} programName={program.name} defaultOpen />
              <ProgramStrategies slug={program.slug} category={program.category} tags={program.tags} />
              <SocialEmbed youtubeId={program.youtubeVideoId} tiktokId={program.tiktokVideoId} programName={program.name} />
              {program.slug === 'utest' && (
                <section className="mt-6 rounded-xl border border-orange/35 bg-orange/5 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange">Dica para candidatura</p>
                  <h2 className="mt-2 text-xl font-bold">Aumente a clareza do seu cadastro</h2>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/75">{UTEST_STRATEGIC_TIP}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <ClipboardCopy textToCopy={`Nicolas da Costa Santos\nUTest ID: 2535825\n${UTEST_REFERRAL_URL}`} />
                    <OutboundLink href={UTEST_REFERRAL_URL} trackingId="utest-referral" sponsored className="inline-flex min-h-11 items-center rounded-md bg-orange px-4 py-2 text-sm font-bold text-white hover:bg-orange-dark">
                      Inscrever-se no uTest
                    </OutboundLink>
                    <span className="text-xs text-foreground/60">Nome, ID e link de indicação; o e-mail pessoal não é necessário.</span>
                  </div>
                </section>
              )}
            </section>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {program.pros.length > 0 && (
                <section className="rounded-xl border border-emerald-400/25 bg-emerald-400/5 p-5">
                  <h2 className="font-bold text-emerald-300">Pontos positivos</h2>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed opacity-80">
                    {program.pros.map((item) => <li key={item}>+ {item}</li>)}
                  </ul>
                </section>
              )}
              {program.cons.length > 0 && (
                <section className="rounded-xl border border-amber-400/25 bg-amber-400/5 p-5">
                  <h2 className="font-bold text-amber-200">Pontos de atenção</h2>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed opacity-80">
                    {program.cons.map((item) => <li key={item}>- {item}</li>)}
                  </ul>
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
                <h2 className="font-bold">O que você precisa</h2>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed opacity-75">
                  {program.requirements.map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </section>
            )}
            {program.paymentMethods.length > 0 && (
              <section className="rounded-xl border border-border bg-income-card/80 p-5">
                <h2 className="font-bold">Pagamento</h2>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed opacity-75">
                  {program.paymentMethods.map((item) => <li key={item}>• {item}</li>)}
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
        <div className="border-t border-border p-6 md:p-10">
          <AffiliateDisclaimer />
        </div>
      </article>
    </div>
  );
}
