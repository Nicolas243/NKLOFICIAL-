'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function GoogleSignInButton() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsPending(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signInError) {
      console.error('[AUTH] Falha no login Google:', signInError.message);
      setError('Não foi possível iniciar o login com Google.');
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-2">
      <button
        type="button"
        onClick={handleSignIn}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 py-3 transition-all hover:bg-white/20 disabled:opacity-50"
      >
        <span className="text-sm font-medium text-text">{isPending ? 'Conectando...' : 'Google'}</span>
      </button>
      {error && <p role="alert" className="text-center text-xs text-red-400">{error}</p>}
    </div>
  );
}
