'use client';

import { useEffect, useRef } from 'react';

const SCROLL_DELTA = 5;

/**
 * Smart Header: oculta ao rolar para baixo (>80px), reaparece ao rolar para cima.
 * Matemática e lógica do script.js legado.
 */
export function useSmartHeader(headerSelector: string) {
  const lastScroll = useRef(0);

  useEffect(() => {
    const header = document.querySelector(headerSelector);
    if (!header) return;

    const onScroll = () => {
      const current = window.pageYOffset || document.documentElement.scrollTop;

      if (Math.abs(lastScroll.current - current) <= SCROLL_DELTA) return;

      if (current > lastScroll.current && current > 80) {
        header.classList.add('hide');
      } else if (current < lastScroll.current) {
        header.classList.remove('hide');
      }

      lastScroll.current = current <= 0 ? 0 : current;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [headerSelector]);
}