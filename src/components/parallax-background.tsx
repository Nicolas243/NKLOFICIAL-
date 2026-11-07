'use client';

import { usePathname } from 'next/navigation';
import { isIncomePortalPath } from '@/lib/income-portal';

export function ParallaxBackground() {
  const pathname = usePathname();
  const isPartnerPortal = isIncomePortalPath(pathname);

  return (
    <>
      <div className={`fixed inset-0 z-0 pointer-events-none ${isPartnerPortal ? 'bg-white/90 dark:bg-black/90' : 'bg-background/70'}`} />
      <div className={`site-texture fixed inset-0 z-0 pointer-events-none ${isPartnerPortal ? 'site-texture-partner' : 'site-texture-music'}`} aria-hidden="true" />
    </>
  );
}
