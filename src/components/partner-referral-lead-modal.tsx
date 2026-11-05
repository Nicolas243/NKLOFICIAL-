'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitPartnerReferralLead } from '@/actions/partner-programs';

type Props = {
  programId: string;
  programName: string;
  onClose: () => void;
};

type FormState = {
  error: string | null;
  success: boolean;
};

const INITIAL_STATE: FormState = { error: null, success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-md bg-neon px-4 py-2.5 text-sm font-bold text-black disabled:opacity-50">
      {pending ? 'Enviando...' : 'Quero começar'}
    </button>
  );
}

export function PartnerReferralLeadModal({ programId, programName, onClose }: Props) {
  const [state, action] = useActionState(async (_state: FormState, formData: FormData) => {
    try {
      await submitPartnerReferralLead(formData);
      return { error: null, success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Não foi possível enviar a indicação.', success: false };
    }
  }, INITIAL_STATE);

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-label={`Indicar imóveis pelo ${programName}`}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="mt-1 font-playfair text-2xl font-bold">Quero indicar imóveis</h2>
          </div>
          <button type="button" onClick={onClose} className="text-2xl opacity-60 hover:opacity-100" aria-label="Fechar">×</button>
        </div>
        {state.success ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm leading-relaxed">Recebemos os dados para começar a indicação do imóvel.</p>
            <button type="button" onClick={onClose} className="rounded-md bg-neon px-4 py-2.5 text-sm font-bold text-black">Concluir</button>
          </div>
        ) : (
          <form action={action} className="mt-6 space-y-4">
            <input type="hidden" name="programId" value={programId} />
            <p className="text-sm leading-relaxed opacity-75">Conhece alguém com uma casa ou apartamento para alugar ou vender? Indique o imóvel para o QuintoAndar preenchendo os dados da pessoa responsável.</p>
            <label className="block text-sm font-bold">Seu nome
              <input name="contactName" required maxLength={180} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-normal" />
            </label>
            <label className="block text-sm font-bold">Telefone
              <input name="phone" required inputMode="tel" maxLength={30} placeholder="(11) 99999-9999" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-normal" />
            </label>
            {state.error && <p role="alert" className="text-sm text-red-400">{state.error}</p>}
            <SubmitButton />
          </form>
        )}
      </div>
    </div>
  );
}
