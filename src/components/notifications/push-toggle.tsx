'use client';

import { useState } from 'react';

function decodeBase64Url(value: string): ArrayBuffer {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const binary = window.atob(`${value.replaceAll('-', '+').replaceAll('_', '/')}${padding}`);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export function PushToggle() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'enabled' | 'unavailable' | 'error'>('idle');

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
        body: JSON.stringify(subscription.toJSON()),
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
      <p className="font-bold">Notificações no dispositivo</p>
      <p className="mt-1 text-sm opacity-70">Receba avisos quando houver uma atualização importante para você.</p>
      <button
        type="button"
        onClick={() => void enablePush()}
        disabled={status === 'loading' || status === 'enabled'}
        className="mt-3 min-h-11 rounded-md border border-neon px-4 py-2 text-sm font-bold text-neon hover:bg-neon hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'loading' ? 'Ativando...' : status === 'enabled' ? 'Notificações ativadas' : 'Ativar notificações'}
      </button>
      {status === 'unavailable' && <p className="mt-2 text-xs opacity-70">Push ainda não está configurado neste ambiente ou não é compatível com este navegador. A central continua disponível.</p>}
      {status === 'error' && <p className="mt-2 text-xs text-orange">Não foi possível ativar agora. Verifique a permissão do navegador e tente novamente.</p>}
    </div>
  );
}
