import type { Metadata } from 'next';
import { getPartnerPrograms } from '@/actions/partner-programs';
import { ProgramHub } from '@/components/program-hub';
import { filterProgramsForHub, getProgramHub, PROGRAM_HUBS } from '@/lib/program-hubs';
import { absoluteSiteUrl } from '@/lib/site';

const hub = getProgramHub('celular') ?? PROGRAM_HUBS.celular;

export const metadata: Metadata = {
  title: hub.title,
  description: hub.description,
  alternates: { canonical: absoluteSiteUrl('/programas/celular') },
};

export const dynamic = 'force-dynamic';

export default async function MobileIncomeHubPage() {
  const programs = await getPartnerPrograms();
  return (
    <ProgramHub
      title={hub.title}
      description={hub.description}
      intro={hub.intro}
      criteria={hub.criteria}
      relatedHubs={hub.relatedHubs.map((slug) => PROGRAM_HUBS[slug])}
      programs={filterProgramsForHub(programs, hub.slug)}
    />
  );
}
