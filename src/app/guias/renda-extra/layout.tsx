import { IncomeAnalytics } from '@/components/income-analytics';

export default function IncomeGuideLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <IncomeAnalytics />
    </>
  );
}
