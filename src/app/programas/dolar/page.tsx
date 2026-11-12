import type { Metadata } from 'next';
import { getPartnerPrograms } from '@/actions/partner-programs';
import { ProgramHub } from '@/components/program-hub';
import { absoluteSiteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Oportunidades pagas em dólar',
  description: 'Compare oportunidades do Portal NKL que exibem remuneração de referência em dólar.',
  alternates: { canonical: absoluteSiteUrl('/programas/dolar') },
};

export const dynamic = 'force-dynamic';

export default async function DollarProgramsPage() {
  const programs = await getPartnerPrograms();
  const selected = programs.filter((program) => program.averageEarning.includes('US$'));

  return (
    <ProgramHub
      title="Oportunidades com referência em dólar"
      description="A moeda ajuda a entender a proposta, mas não garante disponibilidade, aprovação ou conversão final. Confira o país elegível, o método de pagamento e as regras da plataforma."
      programs={selected}
    />
  );
}
