import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPartnerProgramBySlug } from '@/actions/partner-programs';
import { PARTNER_PROGRAM_SLUGS } from '@/lib/partner-program-catalog';
import { AffiliateDisclaimer } from '@/components/affiliate-disclaimer';
import { LeadCaptureForm } from '@/components/blog/lead-capture-form';
import { JsonLd } from '@/components/seo/json-ld';
import { OutboundLink } from '@/components/ui/outbound-link';

type Params = Promise<{ slug: string }>;

export const revalidate = 900;
export const dynamicParams = true;

export function generateStaticParams(): Array<{ slug: string }> {
  return PARTNER_PROGRAM_SLUGS.map((slug) => ({ slug }));
}

async function loadProgram(slug: string) {
  return getPartnerProgramBySlug(slug);
}

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const { slug } = await props.params;
  const program = await loadProgram(slug);

  if (!program) {
    return { title: 'Oportunidade não encontrada' };
  }

  return {
    title: program.name,
    description: program.shortDescription,
    alternates: { canonical: `/programas/${program.slug}` },
    openGraph: {
      type: 'article',
      title: program.name,
      description: program.shortDescription,
      url: `/programas/${program.slug}`,
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://nkl.com.br';
  const canonicalUrl = `${siteUrl}/programas/${program.slug}`;

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

      <Link href="/programas" className="text-sm font-bold text-neon hover:underline">← Voltar ao catálogo</Link>
      <article className="mt-5 overflow-hidden rounded-[1.5rem] border border-border bg-surface md:rounded-[2rem]">
        <header className="border-b border-border p-6 md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">{program.category}</p>
          <h1 className="mt-3 font-playfair text-4xl font-bold leading-tight md:text-6xl">{program.name}</h1>
          <AffiliateDisclaimer />
          <p className="mt-5 max-w-3xl text-lg leading-relaxed opacity-75">{program.shortDescription}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <p className="text-xs uppercase tracking-wide opacity-55">Remuneração de referência</p>
              <p className="mt-2 font-bold text-neon">{program.averageEarning}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <p className="text-xs uppercase tracking-wide opacity-55">Nota</p>
              <p className="mt-2 font-bold">{program.finalRating}/10</p>
              <p className="text-xs opacity-55">{program.communityReviewCount > 0 ? `${program.communityReviewCount} avaliações` : 'nota editorial'}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <p className="text-xs uppercase tracking-wide opacity-55">Idioma</p>
              <p className="mt-2 font-bold">{program.languages.join(' · ')}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <p className="text-xs uppercase tracking-wide opacity-55">Dificuldade</p>
              <p className="mt-2 font-bold capitalize">{program.difficulty}</p>
            </div>
          </div>
          {verifiedDate && <p className="mt-4 text-xs opacity-55">Informações verificadas em {verifiedDate}.</p>}
        </header>

        <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <section>
              <h2 className="font-playfair text-3xl font-bold">Como funciona</h2>
              <p className="mt-4 whitespace-pre-line text-base leading-relaxed opacity-80">{program.longDescription}</p>
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
            {program.requirements.length > 0 && (
              <section className="rounded-xl border border-border bg-background/45 p-5">
                <h2 className="font-bold">O que você precisa</h2>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed opacity-75">
                  {program.requirements.map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </section>
            )}
            {program.paymentMethods.length > 0 && (
              <section className="rounded-xl border border-border bg-background/45 p-5">
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
                Comparar com outras oportunidades
              </Link>
            </div>
          </aside>
        </div>
      </article>
      <div className="mt-8">
        <LeadCaptureForm context={`programa-${program.slug}`} />
      </div>
    </div>
  );
}
