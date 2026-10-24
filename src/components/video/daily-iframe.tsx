'use client';

import { useEffect, useRef } from 'react';
import DailyIframeFactory, { type DailyCall } from '@daily-co/daily-js';

type DailyIframeProps = {
  url: string;
};

export function DailyIframe({ url }: DailyIframeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const call = DailyIframeFactory.createFrame({
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: '0',
        borderRadius: '0.75rem',
      },
    });
    const dailyCall: DailyCall = call;
    dailyCall.join({ url }).catch((error: unknown) => {
      console.error('[DAILY_IFRAME] Falha ao entrar na sala:', error instanceof Error ? error.message : 'erro desconhecido');
    });
    const iframe = dailyCall.iframe();
    if (iframe) {
      containerRef.current.appendChild(iframe);
    }

    return () => {
      void dailyCall.destroy();
    };
  }, [url]);

  return <div ref={containerRef} className="min-h-[28rem] w-full overflow-hidden rounded-xl bg-black" />;
}
