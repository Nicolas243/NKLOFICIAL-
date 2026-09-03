'use client';

import { useState } from 'react';

type FormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const INITIAL_STATE: FormState = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

/**
 * Formulário de troca de senha (Tarefa 11).
 * A regra de 1 troca / 12h + backoff exponencial é aplicada no servidor
 * (rota /api/auth/change-password + tabela password_change_attempts);
 * aqui apenas refletimos as mensagens de erro/cooldown retornadas.
 */
export function ChangePasswordForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const update = (field: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (form.newPassword !== form.confirmPassword) {
      setError('A confirmação não corresponde à nova senha.');
      return;
    }

    setPending(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      const data: { ok?: boolean; error?: string } = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error ?? 'Não foi possível alterar a senha.');
        return;
      }

      setForm(INITIAL_STATE);
      setSuccess(true);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setPending(false);
    }
  };

  const inputCls =
    'p-3 bg-background border border-border rounded-md focus:border-neon outline-none';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="password"
        value={form.currentPassword}
        onChange={(e) => update('currentPassword')(e.target.value)}
        placeholder="Senha atual"
        required
        autoComplete="current-password"
        className={inputCls}
      />
      <input
        type="password"
        value={form.newPassword}
        onChange={(e) => update('newPassword')(e.target.value)}
        placeholder="Nova senha (mín. 8 caracteres)"
        required
        minLength={8}
        autoComplete="new-password"
        className={inputCls}
      />
      <input
        type="password"
        value={form.confirmPassword}
        onChange={(e) => update('confirmPassword')(e.target.value)}
        placeholder="Confirmar nova senha"
        required
        minLength={8}
        autoComplete="new-password"
        className={inputCls}
      />

      {error && (
        <p role="alert" className="text-sm text-red-500 font-medium">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-sm text-neon font-medium">
          Senha alterada com sucesso! Por segurança, uma nova troca só será
          permitida em até 12 horas.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="py-3 bg-text text-bg rounded-md font-bold transition-all hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Alterando...' : 'Alterar senha'}
      </button>
    </form>
  );
}
