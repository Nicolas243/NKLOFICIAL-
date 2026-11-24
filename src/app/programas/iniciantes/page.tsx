import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { getPartnerPrograms } from '@/actions/partner-programs';
import { ProgramHub } from '@/components/program-hub';
import { absoluteSiteUrl } from '@/lib/site';

const loadPrograms = unstable_cache(
  async () => getPartnerPrograms(),
  ['program-hub-programs'],
  { revalidate: 300 },
);

export const metadata: Metadata = {
  title: 'Renda extra para iniciantes: oportunidades mais simples',
  description: 'Um caminho editorial para começar com oportunidades de renda extra de menor dificuldade.',
  alternates: { canonical: absoluteSiteUrl('/programas/iniciantes') },
};

export const dynamic = 'force-dynamic';

export default async function BeginnersProgramsPage() {
  const programs = await loadPrograms();
  const selected = programs.filter((program) => ['fácil', 'médio'].includes(program.difficulty));

  return (
    <ProgramHub
      slug="iniciantes"
      title="Por onde começar sem se perder"
      description="Este guia reúne oportunidades com entrada mais simples ou com curva de aprendizado moderada. Comece lendo as regras, teste uma tarefa pequena e não trate nenhuma remuneração como garantia."
      programs={selected}
    />
  );
}
