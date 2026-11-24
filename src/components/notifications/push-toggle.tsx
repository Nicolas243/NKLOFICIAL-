'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

function decodeBase64Url(value: string): ArrayBuffer {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const binary = window.atob(`${value.replaceAll('-', '+').replaceAll('_', '/')}${padding}`);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

type AppScope = 'portal' | 'renda-extra' | 'musica' | 'idiomas' | 'ia';

function detectAppScope(pathname: string): AppScope {
  if (pathname.startsWith('/musica') || pathname.startsWith('/catalogo') || pathname.startsWith('/luthiers')) {
    return 'musica';
  }
  if (pathname.startsWith('/programas') || pathname.startsWith('/guias/renda-extra') || pathname.startsWith('/blog/renda-extra')) {
    return 'renda-extra';
  }
  if (pathname.startsWith('/blog/aprender') || pathname.startsWith('/guias/')) {
    return 'idiomas';
  }
  if (pathname.startsWith('/ia')) {
    return 'ia';
  }
  return 'portal';
}

const subscribeNoop = () => () => undefined;

export function PushToggle() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'enabled' | 'unavailable' | 'error'>('idle');
  const appScope = useSyncExternalStore(
    subscribeNoop,
    () => detectAppScope(window.location.pathname),
    () => 'portal' as AppScope,
  );

  useEffect(() => {
    void navigator.serviceWorker?.ready.then(async (registration) => {
      const subscription = await registration.pushManager?.getSubscription();
      if (subscription) setStatus('enabled');
    }).catch(() => undefined);
  }, []);

  async function disablePush(): Promise<void> {
    setStatus('loading');
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch('/api/notifications/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus('idle');
    } catch (error) {
      console.error('[push] Falha ao desativar notificações:', error);
      setStatus('error');
    }
  }

  async function enablePush(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setStatus('unavailable');
      return;
    }

    setStatus('loading');
    try {
      const configuration = await fetch('/api/notifications/push/config').then(async (response) => {
        if (!response.ok) throw new Error('Falha ao carregar configuração de push.');
        return response.json() as Promise<{ enabled: boolean; publicKey: string | null }>;
      });
      if (!configuration.enabled || !configuration.publicKey) {
        setStatus('unavailable');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus('error');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeBase64Url(configuration.publicKey),
      });
      const response = await fetch('/api/notifications/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...subscription.toJSON(),
          appScope,
        }),
      });
      if (!response.ok) throw new Error('Falha ao registrar inscrição de push.');
      setStatus('enabled');
    } catch (error) {
      console.error('[push] Falha ao ativar notificações:', error);
      setStatus('error');
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold">Notificações no dispositivo</p>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/70">
          App: {appScope}
        </span>
      </div>
      <p className="mt-1 text-sm opacity-70">Receba avisos quando houver uma atualização importante na área deste app.</p>
      <button
        type="button"
        onClick={() => void (status === 'enabled' ? disablePush() : enablePush())}
        disabled={status === 'loading'}
        className="mt-3 min-h-11 rounded-md border border-neon px-4 py-2 text-sm font-bold text-neon hover:bg-neon hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'loading' ? 'Atualizando...' : status === 'enabled' ? 'Desativar notificações' : 'Ativar notificações'}
      </button>
      {status === 'unavailable' && <p className="mt-2 text-xs opacity-70">Push ainda não está configurado neste ambiente ou não é compatível com este navegador. A central continua disponível.</p>}
      {status === 'error' && <p className="mt-2 text-xs text-orange">Não foi possível ativar agora. Verifique a permissão do navegador e tente novamente.</p>}
    </div>
  );
}
