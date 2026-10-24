'use client';

import type { ReactNode } from 'react';

type OutboundLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  trackingId: string;
};

export function OutboundLink({ href, children, className, trackingId }: OutboundLinkProps) {
  function handleClick(): void {
    const event = {
      trackingId,
      href,
      timestamp: new Date().toISOString(),
    };

    try {
      sessionStorage.setItem('nkl_last_outbound_click', JSON.stringify(event));
    } catch (error) {
      console.info('[ANALYTICS] Click registrado:', trackingId, error instanceof Error ? error.message : 'storage indisponível');
    }

    console.info('[ANALYTICS] Click registrado:', trackingId);
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
