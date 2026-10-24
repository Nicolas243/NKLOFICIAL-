import type { Metadata } from 'next';
import { getPartnerPrograms } from '@/actions/partner-programs';
import { PartnerProgramsBrowser } from '@/components/partner-programs-browser';

export const metadata: Metadata = {
  title: 'Programas de Parceria e Renda Extra | Portal NKL',
  description: 'Catálogo pesquisável de oportunidades de trabalho, freelancing e afiliação.',
};

export default async function PartnerProgramsPage() {
  const programs = await getPartnerPrograms();

  return (
    <div className="relative max-w-7xl mx-auto px-4 pt-[120px] pb-16">
      <header className="max-w-4xl mx-auto text-center mb-12">
        <p className="text-emerald-300 uppercase tracking-[0.24em] text-xs font-bold mb-4">Blog NKL · oportunidades</p>
        <h1 className="font-playfair text-4xl md:text-6xl font-bold leading-tight">Programas de Parceria e Renda Extra</h1>
        <p className="mt-5 text-base md:text-lg opacity-70 leading-relaxed">Uma base editorial independente para descobrir, comparar e avaliar plataformas de trabalho remoto, freelancing, inteligência artificial, criação de conteúdo e afiliados. Leia os detalhes, pesquise por tags e confira as condições de cada oportunidade antes de se cadastrar.</p>
      </header>
      <PartnerProgramsBrowser programs={programs} />
    </div>
  );
}
