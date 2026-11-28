'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';

function RouteProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const barRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(0);
  const activeRef = useRef(false);
  const intervalRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const bar = barRef.current;
    if (activeRef.current && bar) {
      activeRef.current = false;
      progressRef.current = 100;
      bar.style.width = '100%';
      bar.style.opacity = '1';

      hideTimerRef.current = window.setTimeout(() => {
        if (!barRef.current) return;
        barRef.current.style.opacity = '0';
        window.setTimeout(() => {
          if (!barRef.current || activeRef.current) return;
          progressRef.current = 0;
          barRef.current.style.width = '0%';
        }, 200);
      }, 160);
    }

    return () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    function handleClick(event: MouseEvent): void {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const rawHref = anchor.getAttribute('href');
      if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) return;

      try {
        const nextUrl = new URL(anchor.href, window.location.href);
        if (nextUrl.origin !== window.location.origin) return;
        const current = `${window.location.pathname}${window.location.search}`;
        const next = `${nextUrl.pathname}${nextUrl.search}`;
        if (current === next) return;
      } catch {
        return;
      }

      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      const bar = barRef.current;
      if (!bar) return;

      activeRef.current = true;
      progressRef.current = 28;
      bar.style.opacity = '1';
      bar.style.width = '28%';

      intervalRef.current = window.setInterval(() => {
        if (!barRef.current || !activeRef.current) return;
        if (progressRef.current < 86) {
          progressRef.current = Math.min(86, progressRef.current + Math.max(2, (88 - progressRef.current) * 0.18));
          barRef.current.style.width = `${Math.round(progressRef.current)}%`;
        }
      }, 180);
    }

    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 right-0 top-0 z-[400] h-[3px] overflow-hidden bg-transparent"
    >
      <div
        ref={barRef}
        className="h-full bg-neon shadow-[0_0_10px_rgba(34,211,238,0.85)] transition-[width,opacity] duration-200 ease-out"
        style={{ width: '0%', opacity: 0 }}
      />
    </div>
  );
}

export function RouteProgressBar() {
  return (
    <Suspense fallback={null}>
      <RouteProgressBarInner />
    </Suspense>
  );
}
