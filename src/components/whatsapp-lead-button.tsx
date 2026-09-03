'use client';

import { useTransition } from 'react';
import { registerLead, type LeadActionType } from '@/actions/leads';

export function WhatsAppLeadButton({
  luthierId,
  whatsapp,
  leadType = 'whatsapp_click',
}: {
  luthierId: string;
  whatsapp: string;
  leadType?: LeadActionType;
}) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    // Fire-and-forget: registra a métrica de forma segura e NEVER bloqueia o
    // redirecionamento do usuário para o WhatsApp (Pensamento de Inversão).
    startTransition(async () => {
      await registerLead(luthierId, leadType);
    });

    const digits = whatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/${digits}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex justify-center py-3 bg-text text-bg rounded-md font-bold transition-all hover:opacity-90 disabled:opacity-50"
    >
      Contatar via WhatsApp
    </button>
  );
}