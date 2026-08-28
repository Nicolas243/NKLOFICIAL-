'use client';

import { useOptimistic, useTransition } from 'react';

type FavoriteButtonProps = {
  action: (targetId: string) => Promise<void>;
  targetId: string;
  initialSaved: boolean;
  savedLabel?: string;
  unsavedLabel?: string;
};

export function FavoriteButton({
  action,
  targetId,
  initialSaved,
  savedLabel = 'Salvo no Meu Setup',
  unsavedLabel = 'Salvar no Meu Setup',
}: FavoriteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(
    initialSaved,
    (_, newSaved: boolean) => newSaved
  );

  const handleToggle = () => {
    const nextState = !optimisticSaved;
    startTransition(async () => {
      setOptimisticSaved(nextState);
      try {
        await action(targetId);
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : 'Não foi possível atualizar os favoritos.'
        );
      }
    });
  };

  const styles = optimisticSaved
    ? 'bg-text text-bg hover:opacity-90'
    : 'border border-neon text-neon hover:bg-neon hover:text-black';

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex justify-center py-3 rounded-md font-bold transition-all disabled:opacity-50 ${styles}`}
    >
      {optimisticSaved ? savedLabel : unsavedLabel}
    </button>
  );
}