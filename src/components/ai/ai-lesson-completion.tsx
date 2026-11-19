'use client';

import { useState, useTransition } from 'react';
import { completeAiLesson } from '@/actions/ai-learning';

export function AiLessonCompletion({ lessonId, completed }: { lessonId: string; completed: boolean }) {
  const [isCompleted, setIsCompleted] = useState(completed);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');

  function handleComplete() {
    setMessage('');
    startTransition(async () => {
      const result = await completeAiLesson({ lessonSlug: lessonId });
      if (result.success) {
        setIsCompleted(true);
        setMessage('Progresso salvo.');
      } else {
        setMessage(result.message);
      }
    });
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleComplete}
        disabled={isCompleted || isPending}
        className="rounded-full bg-neon px-4 py-2 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isCompleted ? 'Lição concluída' : isPending ? 'Salvando...' : 'Marcar como concluída'}
      </button>
      {message && <span className="text-sm opacity-75">{message}</span>}
    </div>
  );
}
