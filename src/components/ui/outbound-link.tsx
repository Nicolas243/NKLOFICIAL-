'use client';

import type { CSSProperties, MouseEvent, ReactNode } from 'react';

type OutboundLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  trackingId: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  title?: string;
  style?: CSSProperties;
  sponsored?: boolean;
};

export function OutboundLink({ href, children, className, trackingId, onClick, title, style, sponsored = false }: OutboundLinkProps) {
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
    <a href={href} target="_blank" rel={sponsored ? 'noopener noreferrer sponsored' : 'noopener noreferrer'} className={className} style={style} title={title} onClick={(event) => {
      handleClick();
      onClick?.(event);
    }}>
      {children}
    </a>
  );
}
