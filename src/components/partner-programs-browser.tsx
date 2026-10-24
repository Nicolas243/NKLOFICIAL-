'use client';

import { useMemo, useState } from 'react';
import type { PartnerProgramCard } from '@/actions/partner-programs';
import { submitPartnerReview, submitPartnerSuggestion } from '@/actions/partner-programs';
import { ClipboardCopy } from '@/components/ui/clipboard-copy';

type Props = {
  programs: PartnerProgramCard[];
};

const REVIEW_TAGS = ['fácil', 'médio', 'difícil', 'boa remuneração', 'flexível', 'exige experiência'];

function extractReferralCode(description: string): string | null {
  const match = description.match(/(?:código|codigo)\s+(?:de\s+indicação|de\s+indicacao)?\s*[:\-]?\s*[`'"]?([A-Z0-9]{6,})/iu);
  return match?.[1] ?? null;
}

export function PartnerProgramsBrowser({ programs }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('todas');
  const [difficulty, setDifficulty] = useState('todas');
  const [sort, setSort] = useState('relevancia');
  const [selectedProgram, setSelectedProgram] = useState<PartnerProgramCard | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(programs.map((program) => program.category))).sort(),
    [programs]
  );

  const filteredPrograms = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    const filtered = programs.filter((program) => {
      const searchable = [
        program.name,
        program.category,
        program.shortDescription,
        ...program.tags,
        ...program.communityTags,
      ].join(' ').toLocaleLowerCase('pt-BR');

      return (!normalizedQuery || searchable.includes(normalizedQuery))
        && (category === 'todas' || program.category === category)
        && (difficulty === 'todas' || program.difficulty === difficulty);
    });

    return [...filtered].sort((left, right) => {
      if (sort === 'nome') return left.name.localeCompare(right.name, 'pt-BR');
      if (sort === 'nota') return right.finalRating - left.finalRating;
      return left.name.localeCompare(right.name, 'pt-BR');
    });
  }, [category, difficulty, programs, query, sort]);

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr_1fr_1fr] gap-3 p-4 bg-surface border border-border rounded-xl">
        <label className="text-sm">
          <span className="block text-xs font-bold uppercase tracking-wide opacity-60 mb-2">Pesquisar</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome, categoria ou tag"
            className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-neon"
          />
        </label>
        <label className="text-sm">
          <span className="block text-xs font-bold uppercase tracking-wide opacity-60 mb-2">Categoria</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2">
            <option value="todas">Todas</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-xs font-bold uppercase tracking-wide opacity-60 mb-2">Dificuldade</span>
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2">
            <option value="todas">Todas</option>
            <option value="fácil">Fácil</option>
            <option value="médio">Médio</option>
            <option value="difícil">Difícil</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-xs font-bold uppercase tracking-wide opacity-60 mb-2">Ordenar</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2">
            <option value="relevancia">Relevância</option>
            <option value="nota">Nota</option>
            <option value="nome">Nome</option>
          </select>
        </label>
      </section>

      <p className="text-sm opacity-60">{filteredPrograms.length} oportunidades encontradas</p>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredPrograms.map((program) => {
          const rating = program.finalRating;
          const ratingLabel = program.communityRating === null ? 'nota editorial' : `${program.communityReviewCount} avaliações`;
          const visibleTags = program.communityTags.length >= 1 ? program.communityTags : program.tags;

          return (
            <article key={program.id} className="flex flex-col gap-5 p-6 bg-surface border border-border rounded-xl hover:border-neon transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-neon font-bold">{program.category}</p>
                  <h2 className="font-playfair text-2xl font-bold mt-1">{program.name}</h2>
                </div>
                <button type="button" onClick={() => setSelectedProgram(program)} className="shrink-0 rounded-full border border-neon px-3 py-2 text-sm font-bold hover:bg-neon hover:text-black transition-colors" aria-label={`Avaliar ${program.name}`}>
                  {rating.toFixed(1)}/10
                </button>
              </div>
              <p className="text-sm opacity-75 leading-relaxed">{program.shortDescription}</p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold">{program.difficulty}</span>
                {visibleTags.slice(0, 5).map((tag) => <span key={tag} className="rounded-full border border-border px-2.5 py-1 text-xs opacity-75">{tag}</span>)}
              </div>
              <p className="text-xs opacity-50">{ratingLabel} · Clique na nota para avaliar</p>
              <div className="mt-auto flex flex-wrap gap-3">
                <button type="button" onClick={() => setSelectedProgram(program)} className="rounded-md border border-border px-4 py-2 text-sm font-bold hover:border-neon">Ler mais e avaliar</button>
                <a href={program.affiliateUrl ?? program.websiteUrl} target="_blank" rel="noopener noreferrer" className="rounded-md bg-neon px-4 py-2 text-sm font-bold text-black hover:opacity-90">Acessar plataforma</a>
              </div>
            </article>
          );
        })}
      </section>

      {filteredPrograms.length === 0 && <p className="rounded-xl border border-border bg-surface p-8 text-center opacity-70">Nenhum programa corresponde aos filtros.</p>}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        <form id="sugestao" action={submitPartnerSuggestion} className="space-y-4 rounded-xl border border-border bg-surface p-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-neon font-bold">Ajude a ampliar o catálogo</p>
            <h2 className="font-playfair text-2xl font-bold mt-1">Sugira uma oportunidade</h2>
          </div>
          <input name="name" required placeholder="Nome do site ou serviço" className="w-full rounded-md border border-border bg-background px-3 py-2" />
          <input name="websiteUrl" type="url" placeholder="Link do site (opcional)" className="w-full rounded-md border border-border bg-background px-3 py-2" />
          <textarea name="reason" required minLength={40} rows={4} placeholder="Por que esta oportunidade deveria entrar? (mínimo de 10 palavras)" className="w-full rounded-md border border-border bg-background px-3 py-2" />
          <button type="submit" className="rounded-md bg-neon px-5 py-3 font-bold text-black">Enviar sugestão</button>
        </form>
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="text-xs uppercase tracking-wide text-neon font-bold">Como funciona</p>
          <h2 className="font-playfair text-2xl font-bold mt-1">Notas transparentes</h2>
          <p className="mt-3 text-sm opacity-70 leading-relaxed">A nota editorial é uma referência inicial. Depois de cinco avaliações da comunidade, as tags exibidas passam a refletir exclusivamente a experiência de quem usou o serviço.</p>
          <p className="mt-3 text-sm opacity-70 leading-relaxed">As avaliações são anônimas para o público. Para reduzir duplicidade, o sistema usa um identificador técnico protegido em cookie.</p>
        </div>
      </section>

      {selectedProgram && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label={`Detalhes de ${selectedProgram.name}`}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-surface p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-neon font-bold">{selectedProgram.category}</p>
                <h2 className="font-playfair text-3xl font-bold">{selectedProgram.name}</h2>
              </div>
              <button type="button" onClick={() => setSelectedProgram(null)} className="text-2xl opacity-60 hover:opacity-100" aria-label="Fechar">×</button>
            </div>
            <p className="mt-5 text-sm leading-relaxed opacity-80">{selectedProgram.longDescription}</p>
            {extractReferralCode(selectedProgram.longDescription) && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide opacity-60">Código de indicação</p>
                  <code className="text-base font-bold tracking-wider">{extractReferralCode(selectedProgram.longDescription)}</code>
                </div>
                <ClipboardCopy textToCopy={extractReferralCode(selectedProgram.longDescription) ?? ''} />
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {(selectedProgram.communityTags.length >= 1 ? selectedProgram.communityTags : selectedProgram.tags).map((tag) => <span key={tag} className="rounded-full border border-border px-2.5 py-1 text-xs">{tag}</span>)}
            </div>
            <form action={submitPartnerReview} className="mt-8 space-y-4 border-t border-border pt-6">
              <input type="hidden" name="programId" value={selectedProgram.id} />
              <h3 className="font-playfair text-xl font-bold">Avalie esta oportunidade</h3>
              <label className="block text-sm font-bold">Nota de 0 a 10
                <input name="rating" type="number" min="0" max="10" required className="mt-2 block w-28 rounded-md border border-border bg-background px-3 py-2" />
              </label>
              <label className="block text-sm font-bold">Tags da sua experiência
                <select name="tags" multiple className="mt-2 min-h-32 w-full rounded-md border border-border bg-background px-3 py-2 font-normal">
                  {REVIEW_TAGS.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
                </select>
              </label>
              <label className="block text-sm font-bold">Por que você deu esta nota?
                <textarea name="reason" required minLength={100} rows={6} placeholder="Escreva pelo menos 20 palavras sobre sua experiência." className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 font-normal" />
              </label>
              <p className="text-xs opacity-60">Sua avaliação será anônima. O texto precisa ter pelo menos 20 palavras.</p>
              <button type="submit" className="rounded-md bg-neon px-5 py-3 font-bold text-black">Publicar avaliação</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
