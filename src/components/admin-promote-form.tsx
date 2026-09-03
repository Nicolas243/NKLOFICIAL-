'use client';

import { useActionState } from 'react';
import {
  promoteToAdmin,
  INITIAL_PROMOTE_STATE,
} from '@/actions/admin-setup';

type AdminPromoteFormProps = {
  isBootstrap: boolean;
};

/**
 * Formulário seguro de promoção a admin:
 * - Bootstrap: exibido apenas quando NENHUM admin existe ainda.
 * - Conta criada: exige o segredo ADMIN_BOOTSTRAP_SECRET (campo `secret`).
 * Usa `useActionState` para exibir erros sem lançar exceção no form action.
 */
export function AdminPromoteForm({ isBootstrap }: AdminPromoteFormProps) {
  const [state, formAction, isPending] = useActionState(
    promoteToAdmin,
    INITIAL_PROMOTE_STATE
  );

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      {!isBootstrap && (
        <input
          type="password"
          name="secret"
          placeholder="Segredo de admin"
          className="px-2 py-1 text-xs bg-background border border-border rounded-md w-40"
        />
      )}
      <button
        type="submit"
        disabled={isPending}
        className={
          isBootstrap
            ? 'px-4 py-2 text-xs font-bold bg-neon text-black rounded-md'
            : 'px-3 py-1 text-xs border border-neon/50 text-neon rounded-md disabled:opacity-50'
        }
      >
        {isPending
          ? 'Promovendo...'
          : isBootstrap
            ? 'Tornar-se Admin (bootstrap)'
            : 'Promover'}
      </button>
      {state.error && (
        <span className="text-xs text-red-400 max-w-56 text-right">{state.error}</span>
      )}
    </form>
  );
}