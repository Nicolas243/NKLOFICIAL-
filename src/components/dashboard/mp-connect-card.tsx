'use client';

import { MP_AFFILIATE_SIGNUP_URL } from '@/lib/pricing';
import { OutboundLink } from '@/components/ui/outbound-link';

type MpConnectCardProps = {
  isConnected: boolean;
  collectorId: string | null;
  connectedAt: string | null;
  isDevMode: boolean;
  statusMessage?: string | null;
};

export function MpConnectCard({ isConnected, collectorId, connectedAt, isDevMode, statusMessage }: MpConnectCardProps) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Recebimentos</p>
      <h2 className="mt-2 font-playfair text-2xl font-bold">
        {isConnected ? 'Conta Mercado Pago Conectada (Split Ativo)' : 'Conexão Obrigatória Pendente'}
      </h2>
      <p className="mt-3 text-sm opacity-75">
        A conexão permite receber automaticamente 95% do valor base de cada aula diretamente na sua conta.
      </p>
      {isConnected ? (
        <p className="mt-4 text-sm text-neon">Conta {collectorId} conectada em {connectedAt ? new Date(connectedAt).toLocaleDateString('pt-BR') : 'data não informada'}.</p>
      ) : (
        <div className="mt-5 flex flex-wrap gap-3">
          <a href="/api/payments/mp-connect" className="rounded-md bg-neon px-4 py-3 font-bold text-black">Vincular minha conta Mercado Pago</a>
          <OutboundLink href={MP_AFFILIATE_SIGNUP_URL} trackingId="mp-teacher-signup-affiliate" className="rounded-md border border-neon px-4 py-3 font-bold text-neon">
            Crie sua conta agora
          </OutboundLink>
          {isDevMode && <span className="basis-full text-xs opacity-60">Homologação local: o vínculo real depende das credenciais OAuth.</span>}
        </div>
      )}
      {statusMessage && <p className="mt-4 text-sm text-neon">{statusMessage}</p>}
    </section>
  );
}
