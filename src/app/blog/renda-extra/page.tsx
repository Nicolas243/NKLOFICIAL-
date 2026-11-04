import type { Metadata } from 'next';
import PartnerProgramsPage from '@/app/programas/page';

export const metadata: Metadata = {
  title: 'Renda extra: oportunidades e plataformas | Blog NKL',
  description: 'Encontre plataformas para renda extra, pesquisas, conteúdo, indicações e trabalho remoto com contexto para decidir melhor.',
  alternates: {
    canonical: '/blog/renda-extra',
  },
};

export const dynamic = 'force-dynamic';

export default PartnerProgramsPage;
