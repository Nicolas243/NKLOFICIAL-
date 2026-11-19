'use client';

import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useSessionUser } from '@/components/use-session-user';
import {
  getSavedPartnerProgramSlugs,
  toggleSavedPartnerProgram,
} from '@/actions/saved-partner-programs';
import { SAVED_PROGRAMS_KEY } from '@/lib/income-saved';

type Props = {
  slug: string;
  name: string;
  compact?: boolean;
  nextPath?: string;
  isSaved?: boolean;
  onSavedChange?: (slug: string, nextSaved: boolean) => void;
};

function uniqueSlugs(values: string[]): string[] {
  return Array.from(new Set(values.map((item) => item.trim()).filter((item) => item.length > 0)));
}

export function readLocalSavedProgramSlugs(): string[] {
  if (typeof window === 'undefined') return [];
  const stored = window.localStorage.getItem(SAVED_PROGRAMS_KEY);
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return uniqueSlugs(parsed.filter((value): value is string => typeof value === 'string'));
    }
  } catch (error) {
    console.error('[SAVE_PROGRAM] Não foi possível ler oportunidades salvas localmente:', error);
  }
  return [];
}

export function writeLocalSavedProgramSlugs(slugs: string[]): string[] {
  const normalized = uniqueSlugs(slugs);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SAVED_PROGRAMS_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

export function removeLocalSavedProgramSlug(slug: string): string[] {
  const next = readLocalSavedProgramSlugs().filter((item) => item !== slug);
  return writeLocalSavedProgramSlugs(next);
}

export function addLocalSavedProgramSlug(slug: string): string[] {
  const next = uniqueSlugs([...readLocalSavedProgramSlugs(), slug]);
  return writeLocalSavedProgramSlugs(next);
}

let cachedUserId: string | null = null;
let cachedSlugs: string[] | null = null;
let inflightRemoteRequest: Promise<string[]> | null = null;
const savedSlugsListeners = new Set<(slugs: string[]) => void>();

function notifySavedSlugsListeners(slugs: string[]): void {
  const snapshot = uniqueSlugs(slugs);
  cachedSlugs = snapshot;
  for (const listener of savedSlugsListeners) {
    listener(snapshot);
  }
}

export function subscribeSavedProgramSlugs(listener: (slugs: string[]) => void): () => void {
  savedSlugsListeners.add(listener);
  return () => {
    savedSlugsListeners.delete(listener);
  };
}

export function publishSavedProgramSlugs(slugs: string[]): void {
  notifySavedSlugsListeners(slugs);
}

export async function loadSavedProgramSlugsShared(userId: string | null): Promise<string[]> {
  if (!userId) {
    const localSlugs = readLocalSavedProgramSlugs();
    cachedUserId = null;
    notifySavedSlugsListeners(localSlugs);
    return localSlugs;
  }

  if (cachedUserId === userId && cachedSlugs !== null) {
    return cachedSlugs;
  }

  if (cachedUserId === userId && inflightRemoteRequest !== null) {
    return inflightRemoteRequest;
  }

  cachedUserId = userId;
  inflightRemoteRequest = (async () => {
    try {
      const remoteSlugs = await getSavedPartnerProgramSlugs();
      const localSlugs = readLocalSavedProgramSlugs();
      const remoteSet = new Set(remoteSlugs);
      const localOnly = localSlugs.filter((item) => !remoteSet.has(item));
      if (localOnly.length > 0) {
        await Promise.all(localOnly.map((item) => toggleSavedPartnerProgram(item)));
      }
      const merged = uniqueSlugs([...remoteSlugs, ...localSlugs]);
      writeLocalSavedProgramSlugs(merged);
      notifySavedSlugsListeners(merged);
      return merged;
    } finally {
      inflightRemoteRequest = null;
    }
  })();

  return inflightRemoteRequest;
}

export function useSavedProgramSlugs() {
  const { user, loading: sessionLoading } = useSessionUser();
  const [savedSlugs, setSavedSlugs] = useState<string[]>(() => cachedSlugs ?? readLocalSavedProgramSlugs());

  useEffect(() => {
    const unsubscribe = subscribeSavedProgramSlugs(setSavedSlugs);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (sessionLoading) return;
    let active = true;
    void loadSavedProgramSlugsShared(user?.id ?? null)
      .then((slugs) => {
        if (active) setSavedSlugs(slugs);
      })
      .catch((error) => {
        console.error('[SAVE_PROGRAM] Não foi possível sincronizar oportunidades salvas:', error);
        if (active) setSavedSlugs(readLocalSavedProgramSlugs());
      });
    return () => {
      active = false;
    };
  }, [sessionLoading, user?.id]);

  const toggleSlug = useCallback(async (targetSlug: string): Promise<boolean> => {
    const current = cachedSlugs ?? readLocalSavedProgramSlugs();
    const currentlySaved = current.includes(targetSlug);
    const nextSaved = !currentlySaved;
    const optimistic = nextSaved
      ? addLocalSavedProgramSlug(targetSlug)
      : removeLocalSavedProgramSlug(targetSlug);
    notifySavedSlugsListeners(optimistic);

    if (!user?.id) {
      return nextSaved;
    }

    try {
      const result = await toggleSavedPartnerProgram(targetSlug);
      const synced = result.saved
        ? addLocalSavedProgramSlug(targetSlug)
        : removeLocalSavedProgramSlug(targetSlug);
      notifySavedSlugsListeners(synced);
      return result.saved;
    } catch (error) {
      const rolledBack = currentlySaved
        ? addLocalSavedProgramSlug(targetSlug)
        : removeLocalSavedProgramSlug(targetSlug);
      notifySavedSlugsListeners(rolledBack);
      throw error;
    }
  }, [user?.id]);

  return {
    savedSlugs,
    sessionLoading,
    user,
    toggleSlug,
  };
}

export function SaveProgramButton({
  slug,
  name,
  compact = false,
  isSaved,
  onSavedChange,
}: Props) {
  const { user, loading: sessionLoading } = useSessionUser();
  const [internalSaved, setInternalSaved] = useState<boolean>(() => {
    if (typeof isSaved === 'boolean') return isSaved;
    return (cachedSlugs ?? readLocalSavedProgramSlugs()).includes(slug);
  });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const saved = typeof isSaved === 'boolean' ? isSaved : internalSaved;

  useEffect(() => {
    if (typeof isSaved === 'boolean') return;
    return subscribeSavedProgramSlugs((slugs) => {
      setInternalSaved(slugs.includes(slug));
    });
  }, [isSaved, slug]);

  useEffect(() => {
    if (typeof isSaved === 'boolean' || sessionLoading) return;
    let active = true;
    void loadSavedProgramSlugsShared(user?.id ?? null)
      .then((slugs) => {
        if (active) setInternalSaved(slugs.includes(slug));
      })
      .catch((error) => {
        console.error('[SAVE_PROGRAM] Não foi possível sincronizar oportunidade salva:', error);
        if (active) setMessage('Não foi possível sincronizar agora.');
      });
    return () => {
      active = false;
    };
  }, [isSaved, sessionLoading, slug, user?.id]);

  async function toggleSaved(): Promise<void> {
    if (pending || sessionLoading) return;

    const previousSaved = saved;
    const nextSaved = !previousSaved;
    setPending(true);
    setInternalSaved(nextSaved);
    onSavedChange?.(slug, nextSaved);

    const optimisticSlugs = nextSaved
      ? addLocalSavedProgramSlug(slug)
      : removeLocalSavedProgramSlug(slug);
    notifySavedSlugsListeners(optimisticSlugs);

    if (!user?.id) {
      setMessage(nextSaved ? 'Oportunidade salva.' : 'Oportunidade removida dos salvos.');
      setPending(false);
      window.setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      const result = await toggleSavedPartnerProgram(slug);
      const confirmedSlugs = result.saved
        ? addLocalSavedProgramSlug(slug)
        : removeLocalSavedProgramSlug(slug);
      notifySavedSlugsListeners(confirmedSlugs);
      setInternalSaved(result.saved);
      onSavedChange?.(slug, result.saved);
      setMessage(result.saved ? 'Oportunidade salva.' : 'Oportunidade removida dos salvos.');
    } catch (error) {
      const revertedSlugs = previousSaved
        ? addLocalSavedProgramSlug(slug)
        : removeLocalSavedProgramSlug(slug);
      notifySavedSlugsListeners(revertedSlugs);
      setInternalSaved(previousSaved);
      onSavedChange?.(slug, previousSaved);
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
        aria-label={`${saved ? 'Remover' : 'Salvar'} ${name}`}
        title={saved ? 'Remover dos salvos' : 'Salvar oportunidade'}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border font-bold transition-colors hover:border-neon hover:text-neon disabled:cursor-not-allowed disabled:opacity-50 ${compact ? 'h-11 w-11 px-2' : 'px-3 py-2 text-sm'}`}
      >
        {saved ? <BookmarkCheck size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />}
        {!compact && <span>{saved ? 'Salvo' : 'Salvar'}</span>}
      </button>
      {!compact && message && <span role="status" className="max-w-56 text-xs opacity-70">{message}</span>}
    </span>
  );
}
