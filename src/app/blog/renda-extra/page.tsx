import type { Metadata } from 'next';
import PartnerProgramsPage from '@/app/programas/page';
import { INCOME_PORTAL_ROUTES } from '@/lib/income-portal';
import { absoluteSiteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Renda extra: oportunidades e plataformas | Portal NKL',
  description: 'Encontre plataformas para renda extra, pesquisas, conteúdo, indicações e trabalho remoto com contexto para decidir melhor.',
  alternates: {
    canonical: absoluteSiteUrl(INCOME_PORTAL_ROUTES.catalog),
  },
};

export const dynamic = 'force-dynamic';

export default PartnerProgramsPage;
