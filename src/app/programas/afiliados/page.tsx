import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { getPartnerPrograms } from '@/actions/partner-programs';
import { ProgramHub } from '@/components/program-hub';
import { filterProgramsForHub, getProgramHub, PROGRAM_HUBS } from '@/lib/program-hubs';
import { absoluteSiteUrl } from '@/lib/site';

const hub = getProgramHub('afiliados') ?? PROGRAM_HUBS.afiliados;

const loadPrograms = unstable_cache(
  async () => getPartnerPrograms(),
  ['program-hub-programs'],
  { revalidate: 300 },
);

export const metadata: Metadata = {
  title: `${hub.title}: Marketplaces, SaaS e Comissões Reais`,
  description: hub.description,
  alternates: { canonical: absoluteSiteUrl('/programas/afiliados') },
  openGraph: {
    type: 'website',
    title: `${hub.title} | Portal NKL`,
    description: hub.description,
    url: absoluteSiteUrl('/programas/afiliados'),
    images: [{ url: absoluteSiteUrl('/images/areas/renda-extra.jpg'), width: 960, height: 540 }],
  },
};

export const revalidate = 300;

export default async function AffiliatesIncomeHubPage() {
  const programs = await loadPrograms();
  return (
    <ProgramHub
      slug={hub.slug}
      title={hub.title}
      description={hub.description}
      intro={hub.intro}
      criteria={hub.criteria}
      relatedHubs={hub.relatedHubs.map((slug) => PROGRAM_HUBS[slug])}
      programs={filterProgramsForHub(programs, hub.slug)}
    />
  );
}
