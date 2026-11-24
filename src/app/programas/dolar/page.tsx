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
  title: 'Oportunidades pagas em dólar para brasileiros',
  description: 'Compare oportunidades do Portal NKL que exibem remuneração de referência em dólar.',
  alternates: { canonical: absoluteSiteUrl('/programas/dolar') },
};

export const revalidate = 300;

export default async function DollarProgramsPage() {
  const programs = await loadPrograms();
  const selected = programs.filter((program) => program.averageEarning.includes('US$'));

  return (
    <ProgramHub
      slug="dolar"
      title="Oportunidades com referência em dólar"
      description="A moeda ajuda a entender a proposta, mas não garante disponibilidade, aprovação ou conversão final. Confira o país elegível, o método de pagamento e as regras da plataforma."
      programs={selected}
    />
  );
}
