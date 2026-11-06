import type { Metadata } from 'next';

export const metadata: Metadata = {
  manifest: '/programas/manifest.webmanifest',
};

export default function ProgramsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
