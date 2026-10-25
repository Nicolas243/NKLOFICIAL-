'use client';

import { useActionState } from 'react';
import { submitTeacherReviewAction, type ModerationActionState } from '@/actions/moderation-and-reviews';

export function TeacherReviewForm({ bookingId }: { bookingId: string }) {
  const [state, action] = useActionState<ModerationActionState, FormData>(submitTeacherReviewAction, { success: false, message: '' });
  return (
    <form action={action} className="mt-4 space-y-3 rounded-xl border border-border p-4">
      <h3 className="font-bold">Avalie esta aula</h3>
      <input type="hidden" name="bookingId" value={bookingId} />
      <label className="block text-sm">Nota
        <select name="rating" defaultValue="5" className="mt-1 block w-full rounded-md border border-border bg-background p-2">
          {[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} de 5</option>)}
        </select>
      </label>
      <textarea name="comment" minLength={10} maxLength={1500} required placeholder="Compartilhe sua experiência" className="w-full rounded-md border border-border bg-background p-2 text-sm" />
      <select name="visibility" defaultValue="public" className="w-full rounded-md border border-border bg-background p-2 text-sm">
        <option value="public">Público (Visível no perfil do professor para todos)</option>
        <option value="teacher_only">Apenas Professor (Feedback privado direto ao professor)</option>
        <option value="admin_only">Apenas Administração (Confidencial para a equipe NKL)</option>
      </select>
      <button type="submit" className="rounded-md bg-neon px-4 py-2 font-bold text-black">Enviar avaliação</button>
      {state.message && <p className="text-sm text-neon" role="status">{state.message}</p>}
    </form>
  );
}
