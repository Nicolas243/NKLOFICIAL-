import type { Metadata } from 'next';
import { getPartnerPrograms } from '@/actions/partner-programs';
import { ProgramHub } from '@/components/program-hub';

export const metadata: Metadata = {
  title: 'Oportunidades para iniciantes',
  description: 'Um caminho editorial para começar com oportunidades de renda extra de menor dificuldade.',
};

export const dynamic = 'force-dynamic';

export default async function BeginnersProgramsPage() {
  const programs = await getPartnerPrograms();
  const selected = programs.filter((program) => ['fácil', 'médio'].includes(program.difficulty));

  return (
    <ProgramHub
      title="Por onde começar sem se perder"
      description="Este guia reúne oportunidades com entrada mais simples ou com curva de aprendizado moderada. Comece lendo as regras, teste uma tarefa pequena e não trate nenhuma remuneração como garantia."
      programs={selected}
    />
  );
}
