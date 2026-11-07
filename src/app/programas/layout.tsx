import type { Metadata } from 'next';
import { IncomeAnalytics } from '@/components/income/income-analytics';

export const metadata: Metadata = {
  manifest: '/programas/manifest.webmanifest',
};

export default function ProgramsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <IncomeAnalytics />
    </>
  );
}
