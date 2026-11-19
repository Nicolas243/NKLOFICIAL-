'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getLoginErrorMessage } from '@/lib/auth/errors';
import { safeNextPath } from '@/lib/auth/oauth';
import type { GuideResumeIntent, LoginArea } from '@/lib/auth/return-intent';

export function GoogleSignInButton({
  nextPath = '/',
  resumeIntent = null,
  area = 'music',
}: {
  nextPath?: string;
  resumeIntent?: GuideResumeIntent | null;
  area?: LoginArea;
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
    if (area === 'income') callbackUrl.searchParams.set('area', area);
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
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/10 py-3 transition-all hover:bg-white/20 disabled:opacity-50"
        aria-label="Entrar com Google"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
          <path fill="#4285F4" d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.26Z" />
          <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.29v2.53A9.74 9.74 0 0 0 12 21.75Z" />
          <path fill="#FBBC05" d="M6.53 13.83a5.85 5.85 0 0 1 0-3.66V7.64H3.29a9.75 9.75 0 0 0 0 8.72l3.24-2.53Z" />
          <path fill="#EA4335" d="M12 6.14c1.43 0 2.72.49 3.74 1.46l2.8-2.8C16.84 3.2 14.63 2.25 12 2.25a9.74 9.74 0 0 0-8.71 5.39l3.24 2.53C7.3 7.86 9.46 6.14 12 6.14Z" />
        </svg>
        <span className="text-sm font-medium text-text">{isPending ? 'Conectando...' : 'Continuar com Google'}</span>
      </button>
      {error && <p role="alert" className="text-center text-xs text-red-400">{error}</p>}
    </div>
  );
}
