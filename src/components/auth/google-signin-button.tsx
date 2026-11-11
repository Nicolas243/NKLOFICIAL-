'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getLoginErrorMessage } from '@/lib/auth/errors';
import { safeNextPath } from '@/lib/auth/oauth';
import type { GuideResumeIntent } from '@/lib/auth/return-intent';

export function GoogleSignInButton({
  nextPath = '/',
  resumeIntent = null,
}: {
  nextPath?: string;
  resumeIntent?: GuideResumeIntent | null;
}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsPending(true);
    setError(null);

    const supabase = createClient();
    const callbackUrl = new URL('/auth/callback', window.location.origin);
    callbackUrl.searchParams.set('next', safeNextPath(nextPath));
    if (resumeIntent) callbackUrl.searchParams.set('resume', resumeIntent);
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (signInError) {
      console.error('[AUTH] Falha no login Google:', signInError.message);
      setError(getLoginErrorMessage(signInError));
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
