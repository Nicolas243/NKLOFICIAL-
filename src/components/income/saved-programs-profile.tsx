'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { PartnerProgramCard } from '@/actions/partner-programs';
import {
  getSavedPartnerProgramSlugs,
  toggleSavedPartnerProgram,
} from '@/actions/saved-partner-programs';
import { SAVED_PROGRAMS_KEY } from '@/lib/income-saved';

type Props = {
  initialPrograms: PartnerProgramCard[];
  allPrograms: PartnerProgramCard[];
};

function uniqueSlugs(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.length > 0)));
}

export function SavedProgramsProfile({ initialPrograms, allPrograms }: Props) {
  const [savedSlugs, setSavedSlugs] = useState(() => initialPrograms.map((program) => program.slug));
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const savedPrograms = useMemo(() => {
    const programsBySlug = new Map(allPrograms.map((program) => [program.slug, program]));
    return savedSlugs
      .map((slug) => programsBySlug.get(slug))
      .filter((program): program is PartnerProgramCard => Boolean(program));
  }, [allPrograms, savedSlugs]);

  useEffect(() => {
    let active = true;

    async function syncLocalSaves(): Promise<void> {
      let localSlugs: string[] = [];
      const stored = window.localStorage.getItem(SAVED_PROGRAMS_KEY);
      if (stored) {
        try {
          const parsed: unknown = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            localSlugs = parsed.filter((value): value is string => typeof value === 'string');
          }
        } catch (error) {
          console.error('[PROFILE] Não foi possível ler oportunidades salvas:', error);
        }
      }

      try {
        const remoteSlugs = await getSavedPartnerProgramSlugs();
        const mergedSlugs = uniqueSlugs([...remoteSlugs, ...localSlugs]);
        const remoteSet = new Set(remoteSlugs);
        const localOnly = localSlugs.filter((slug) => !remoteSet.has(slug));

        if (active) setSavedSlugs(mergedSlugs);
        if (localOnly.length > 0) {
          setIsSyncing(true);
          await Promise.all(localOnly.map((slug) => toggleSavedPartnerProgram(slug)));
          window.localStorage.setItem(SAVED_PROGRAMS_KEY, JSON.stringify(mergedSlugs));
        }
        if (active && localOnly.length > 0) setSyncMessage('Suas oportunidades salvas foram sincronizadas nesta conta.');
      } catch (error) {
        if (active && localSlugs.length === 0) {
          setSyncMessage('Entre novamente pelo catálogo para sincronizar suas oportunidades salvas.');
        }
        console.error('[PROFILE] Falha ao sincronizar oportunidades salvas:', error);
      } finally {
        if (active) setIsSyncing(false);
      }
    }

    void syncLocalSaves();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="rounded-[1.5rem] border border-orange/30 bg-income-surface/90 p-5 shadow-[0_20px_60px_rgba(70,55,35,0.12)] md:p-7" aria-labelledby="saved-income-programs">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Seu mapa pessoal</p>
          <h2 id="saved-income-programs" className="mt-2 font-playfair text-3xl font-bold">Oportunidades salvas</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed opacity-70">
            Guarde plataformas para comparar com calma e voltar ao próximo passo quando estiver pronto.
          </p>
        </div>
        <span className="rounded-full border border-orange/30 bg-orange/10 px-3 py-1 text-sm font-bold text-orange">
          {savedPrograms.length} {savedPrograms.length === 1 ? 'salva' : 'salvas'}
        </span>
      </div>

      {savedPrograms.length > 0 ? (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {savedPrograms.map((program) => (
            <article key={program.slug} className="flex min-h-32 flex-col justify-between rounded-xl border border-border bg-income-card/80 p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-orange">{program.category}</p>
                <h3 className="mt-1 font-playfair text-xl font-bold">{program.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed opacity-70">{program.shortDescription}</p>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold opacity-60">{program.averageEarning}</span>
                <Link href={`/programas/${program.slug}`} className="text-sm font-bold text-neon hover:underline">
                  Continuar lendo →
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-orange/35 bg-orange/5 p-5">
          <p className="font-bold">Seu mapa ainda está vazio.</p>
          <p className="mt-1 text-sm leading-relaxed opacity-70">
            Explore o catálogo, responda ao guia e salve as plataformas que fizerem sentido para você.
          </p>
          <Link href="/programas" className="mt-4 inline-flex min-h-11 items-center rounded-md bg-orange px-4 py-2 text-sm font-bold text-white hover:bg-orange-dark">
            Explorar oportunidades
          </Link>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-sm">
        <Link href="/programas" className="font-bold text-neon hover:underline">Ver catálogo completo</Link>
        <Link href="/programas#income-wizard-trigger" className="font-bold text-neon hover:underline">Refazer meu guia</Link>
        {isSyncing && <span className="text-xs opacity-60" role="status">Sincronizando salvos...</span>}
        {syncMessage && !isSyncing && <span className="text-xs opacity-60" role="status">{syncMessage}</span>}
      </div>
    </section>
  );
}
