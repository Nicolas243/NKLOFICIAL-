import type { Metadata } from 'next';
import { INCOME_PORTAL_ROUTES } from '@/lib/income-portal';

export const metadata: Metadata = {
  manifest: `${INCOME_PORTAL_ROUTES.legacyCatalog}/manifest.webmanifest`,
};

export default function IncomeBlogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
