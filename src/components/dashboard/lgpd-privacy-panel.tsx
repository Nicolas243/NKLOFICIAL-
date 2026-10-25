'use client';

import { useActionState, useState } from 'react';
import { anonymizeOwnAccountAction, exportUserPersonalDataAction } from '@/actions/lgpd-privacy';

export function LgpdPrivacyPanel() {
  const [state, action] = useActionState(anonymizeOwnAccountAction, { success: false, message: '' });
  const [exportMessage, setExportMessage] = useState('');
  async function exportData() {
    try {
      const data = await exportUserPersonalDataAction();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'meus-dados-nkl.json';
      anchor.click();
      URL.revokeObjectURL(url);
      setExportMessage('Exportação concluída.');
    } catch {
      setExportMessage('Não foi possível exportar seus dados.');
    }
  }
  return (
    <section className="mt-10 rounded-2xl border border-border bg-surface p-6">
      <h2 className="font-playfair text-2xl font-bold">Privacidade e controle dos dados</h2>
      <button type="button" onClick={exportData} className="mt-4 rounded-md border border-neon px-4 py-3 font-bold text-neon">Exportar Meus Dados (JSON - Art. 18 LGPD)</button>
      {exportMessage && <p className="mt-2 text-sm" role="status">{exportMessage}</p>}
      <details className="mt-6">
        <summary className="cursor-pointer font-bold">Zona de Privacidade e Encerramento de Conta</summary>
        <form action={action} className="mt-4 space-y-3">
          <p className="text-sm opacity-75">Esta ação anonimiza seus dados pessoais e encerra sua sessão.</p>
          <input name="confirmation" required placeholder="CONFIRMAR EXCLUSAO" className="w-full rounded-md border border-border bg-background p-3" />
          <button type="submit" className="rounded-md border border-red-400 px-4 py-3 text-red-400">Anonimizar conta</button>
          {state.message && <p className="text-sm" role="status">{state.message}</p>}
        </form>
      </details>
    </section>
  );
}
