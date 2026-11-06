import type { Metadata } from 'next';
import { IncomeAnalytics } from '@/components/income-analytics';

export const metadata: Metadata = {
  manifest: '/blog/renda-extra/manifest.webmanifest',
};

export default function IncomeBlogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <IncomeAnalytics />
    </>
  );
}
