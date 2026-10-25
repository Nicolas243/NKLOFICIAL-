'use client';

import { useActionState } from 'react';
import { submitEntityReportAction, type ModerationActionState } from '@/actions/moderation-and-reviews';

type ReportEntityModalProps = {
  targetType: 'student' | 'teacher' | 'store' | 'luthier';
  targetUserId?: string;
  targetDirectoryId?: string;
  bookingId?: string;
};

export function ReportEntityModal(props: ReportEntityModalProps) {
  const [state, action] = useActionState<ModerationActionState, FormData>(submitEntityReportAction, { success: false, message: '' });
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-red-400">Denunciar</summary>
      <form action={action} className="mt-3 space-y-2 rounded-lg border border-border p-3">
        <input type="hidden" name="targetType" value={props.targetType} />
        {props.targetUserId && <input type="hidden" name="targetUserId" value={props.targetUserId} />}
        {props.targetDirectoryId && <input type="hidden" name="targetDirectoryId" value={props.targetDirectoryId} />}
        {props.bookingId && <input type="hidden" name="bookingId" value={props.bookingId} />}
        <select name="reason" required className="w-full rounded-md border border-border bg-background p-2">
          <option value="">Selecione o motivo</option>
          <option value="fraud">Fraude</option>
          <option value="harassment">Assédio</option>
          <option value="no_show">Não comparecimento</option>
          <option value="inappropriate_content">Conteúdo inadequado</option>
          <option value="commercial_violation">Violação comercial</option>
          <option value="other">Outro</option>
        </select>
        <textarea name="details" minLength={10} maxLength={1500} required placeholder="Descreva o ocorrido" className="w-full rounded-md border border-border bg-background p-2" />
        <button type="submit" className="rounded-md border border-red-400 px-3 py-2 text-red-400">Enviar denúncia</button>
        {state.message && <p role="status">{state.message}</p>}
      </form>
    </details>
  );
}
