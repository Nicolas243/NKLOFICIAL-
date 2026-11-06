import type { Metadata } from 'next';

export const metadata: Metadata = {
  manifest: '/blog/renda-extra/manifest.webmanifest',
};

export default function IncomeBlogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
