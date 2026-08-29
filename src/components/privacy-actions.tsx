'use client';

import { useRef, useState, useTransition } from 'react';
import { exportUserData, deleteUserAccount } from '@/actions/compliance';

function downloadJson(content: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'meus-dados.json';
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Portabilidade de dados (LGPD Art. 18): download do snapshot JSON via Blob. */
export function ExportDataButton() {
  const [isExporting, startExportTransition] = useTransition();
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = (): void => {
    setExportError(null);
    startExportTransition(async () => {
      try {
        const data = await exportUserData();
        downloadJson(data);
      } catch {
        setExportError('Falha ao exportar os dados. Tente novamente.');
      }
    });
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        className="w-full py-3 bg-neon text-black font-bold rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? 'Gerando arquivo...' : 'Exportar meus dados (JSON)'}
      </button>
      {exportError && <p className="text-xs text-red-400">{exportError}</p>}
    </div>
  );
}

/** Direito ao esquecimento (LGPD Art. 16): exclusão com double-check via <dialog>. */
export function DeleteAccountButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="w-full py-3 border border-red-500 text-red-500 font-bold rounded-md hover:bg-red-500/10 transition-colors"
      >
        Excluir minha conta permanentemente
      </button>

      <dialog ref={dialogRef} className="backdrop:bg-black/70 p-0 rounded-xl bg-transparent m-auto">
        <div className="p-6 bg-surface border border-border rounded-xl max-w-sm space-y-4">
          <h3 className="font-playfair text-lg font-bold text-red-500">
            Confirmar exclusão da conta
          </h3>
          <p className="text-sm opacity-80">
            Esta ação anonimiza definitivamente seus dados pessoais e encerra sua sessão. Seu
            histórico de avaliações será preservado de forma anônima e{' '}
            <strong>não poderá ser desfeito</strong>.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="px-4 py-2 text-sm border border-border rounded-md"
            >
              Cancelar
            </button>
            <form
              action={() => {
                dialogRef.current?.close();
                startDeleteTransition(async () => {
                  await deleteUserAccount();
                });
              }}
            >
              <button
                type="submit"
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-bold bg-red-500 text-white rounded-md disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo...' : 'Sim, excluir tudo'}
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
