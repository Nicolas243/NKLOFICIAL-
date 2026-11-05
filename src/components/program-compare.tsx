'use client';

import { useMemo, useState } from 'react';
import type { PartnerProgramCard } from '@/actions/partner-programs';

type Props = {
  programs: PartnerProgramCard[];
};

const MAX_COMPARE_PROGRAMS = 3;
const COMPARISON_ROWS: Array<{ label: string; value: (program: PartnerProgramCard) => string }> = [
  { label: 'Remuneração', value: (program) => program.averageEarning },
  { label: 'Idioma', value: (program) => program.languages.join(' · ') },
  { label: 'Dificuldade', value: (program) => program.difficulty },
  { label: 'Nota', value: (program) => `${program.finalRating}/10` },
  { label: 'Requisitos', value: (program) => program.requirements.join(' · ') || 'Confira na página' },
];

export function ProgramCompare({ programs }: Props) {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const selectedPrograms = useMemo(
    () => selectedSlugs.map((slug) => programs.find((program) => program.slug === slug)).filter((program): program is PartnerProgramCard => Boolean(program)),
    [programs, selectedSlugs],
  );

  function toggleProgram(slug: string): void {
    setSelectedSlugs((current) => {
      if (current.includes(slug)) return current.filter((item) => item !== slug);
      if (current.length >= MAX_COMPARE_PROGRAMS) return current;
      return [...current, slug];
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 md:p-6" aria-labelledby="compare-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Ferramenta de decisão</p>
          <h2 id="compare-title" className="mt-1 font-playfair text-2xl font-bold">Compare até 3 caminhos</h2>
        </div>
        <p className="text-xs opacity-60">{selectedPrograms.length}/{MAX_COMPARE_PROGRAMS} selecionadas</p>
      </div>
      <details className="mt-4 rounded-xl border border-border bg-background/40 p-4">
        <summary className="cursor-pointer text-sm font-bold">Escolher oportunidades</summary>
        <div className="mt-4 grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <label key={program.slug} className="flex min-h-11 items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={selectedSlugs.includes(program.slug)}
                disabled={!selectedSlugs.includes(program.slug) && selectedPrograms.length >= MAX_COMPARE_PROGRAMS}
                onChange={() => toggleProgram(program.slug)}
              />
              <span>{program.name}</span>
            </label>
          ))}
        </div>
      </details>
      {selectedPrograms.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="p-3 opacity-60">Critério</th>
                {selectedPrograms.map((program) => <th scope="col" key={program.slug} className="p-3 font-bold">{program.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.label} className="border-b border-border/70 align-top">
                  <th scope="row" className="p-3 font-medium opacity-60">{row.label}</th>
                  {selectedPrograms.map((program) => <td key={program.slug} className="p-3 leading-relaxed">{row.value(program)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
