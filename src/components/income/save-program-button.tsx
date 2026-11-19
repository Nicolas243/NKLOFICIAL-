'use client';

import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSessionUser } from '@/components/use-session-user';
import {
  getSavedPartnerProgramSlugs,
  toggleSavedPartnerProgram,
} from '@/actions/saved-partner-programs';
import { buildLoginPath } from '@/lib/auth/return-intent';

type Props = {
  slug: string;
  name: string;
  compact?: boolean;
  nextPath?: string;
};

export function SaveProgramButton({ slug, name, compact = false, nextPath = `/programas/${slug}` }: Props) {
  const { user, loading: sessionLoading } = useSessionUser();
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading || !user) return;
    let active = true;

    async function loadRemoteState(): Promise<void> {
      try {
        const remoteSlugs = await getSavedPartnerProgramSlugs();
        if (active && remoteSlugs.includes(slug)) setSaved(true);
      } catch (error) {
        console.error('[SAVE_PROGRAM] Não foi possível sincronizar oportunidade salva:', error);
        if (active) setMessage('Não foi possível sincronizar agora.');
      }
    }

    void loadRemoteState();
    return () => {
      active = false;
    };
  }, [sessionLoading, slug, user]);

  async function toggleSaved(): Promise<void> {
    if (pending || sessionLoading) return;
    if (!user) {
      window.location.assign(buildLoginPath(nextPath, null, 'income'));
      return;
    }

    const nextSaved = !saved;
    setPending(true);
    setSaved(nextSaved);

    try {
      await toggleSavedPartnerProgram(slug);
      setMessage(nextSaved ? 'Oportunidade salva.' : 'Oportunidade removida dos salvos.');
    } catch (error) {
      setSaved(!nextSaved);
      setMessage(error instanceof Error ? error.message : 'Não foi possível salvar agora.');
    } finally {
      setPending(false);
      window.setTimeout(() => setMessage(null), 3000);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => void toggleSaved()}
        disabled={pending || sessionLoading}
        aria-pressed={saved}
        aria-label={user ? `${saved ? 'Remover' : 'Salvar'} ${name}` : `Entrar para salvar ${name}`}
        title={user ? (saved ? 'Remover dos salvos' : 'Salvar oportunidade') : 'Entre para salvar oportunidade'}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border font-bold transition-colors hover:border-neon hover:text-neon disabled:cursor-not-allowed disabled:opacity-50 ${compact ? 'h-11 w-11 px-2' : 'px-3 py-2 text-sm'}`}
      >
        {saved ? <BookmarkCheck size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />}
        {!compact && <span>{saved ? 'Salvo' : 'Salvar'}</span>}
      </button>
      {!compact && message && <span role="status" className="max-w-56 text-xs opacity-70">{message}</span>}
    </span>
  );
}
