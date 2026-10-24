import type { Metadata } from 'next';
import Link from 'next/link';
import { getPartnerAdminData, updatePartnerProgram, approvePartnerSuggestion, rejectPartnerSuggestion } from '@/actions/partner-programs';

export const metadata: Metadata = {
  title: 'Administração de Programas | Portal NKL',
};

export default async function PartnerProgramsAdminPage() {
  const { programs, suggestions } = await getPartnerAdminData();

  return (
    <div className="max-w-7xl mx-auto px-4 pt-[120px] pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-neon uppercase tracking-[0.24em] text-xs font-bold mb-3">Administração</p>
          <h1 className="font-playfair text-4xl font-bold">Programas de parceria</h1>
          <p className="mt-2 opacity-70">Links sem afiliado aparecem destacados para revisão.</p>
        </div>
        <Link href="/programas" className="text-neon text-sm font-bold hover:underline">Ver catálogo público</Link>
      </div>

      <section className="space-y-4">
        {programs.map((program) => (
          <form key={program.id} action={updatePartnerProgram} className={`grid grid-cols-1 lg:grid-cols-[1.3fr_1.8fr_0.7fr_0.8fr_auto] items-center gap-4 rounded-xl border p-5 ${program.affiliateUrl ? 'border-border bg-surface' : 'border-amber-500/70 bg-amber-500/5'}`}>
            <div>
              <input type="hidden" name="id" value={program.id} />
              <h2 className="font-bold">{program.name}</h2>
              <p className="text-xs opacity-60">{program.category} · {program.reviewCount} avaliações</p>
            </div>
            <label className="text-xs font-bold uppercase tracking-wide">
              Link de afiliado
              <input name="affiliateUrl" defaultValue={program.affiliateUrl ?? ''} placeholder="Ainda não cadastrado" className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal" />
            </label>
            <label className="text-xs font-bold uppercase tracking-wide">
              Nota editorial
              <input name="editorialRating" type="number" min="0" max="10" defaultValue={program.editorialRating} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal" />
            </label>
            <label className="text-xs font-bold uppercase tracking-wide">
              Status
              <select name="status" defaultValue={program.status} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal">
                <option value="published">Publicado</option>
                <option value="draft">Rascunho</option>
              </select>
            </label>
            <button type="submit" className="rounded-md bg-neon px-4 py-2 text-sm font-bold text-black">Salvar</button>
          </form>
        ))}
      </section>

      <section className="mt-14 space-y-4">
        <h2 className="font-playfair text-2xl font-bold">Sugestões pendentes ({suggestions.length})</h2>
        {suggestions.length === 0 ? <p className="opacity-60">Nenhuma sugestão aguardando análise.</p> : suggestions.map((suggestion) => (
          <article key={suggestion.id} className="rounded-xl border border-border bg-surface p-5">
            <h3 className="font-bold">{suggestion.name}</h3>
            {suggestion.websiteUrl && <a href={suggestion.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-neon hover:underline">{suggestion.websiteUrl}</a>}
            <p className="mt-3 text-sm opacity-75">{suggestion.reason}</p>
            <div className="mt-4 flex gap-3">
              <form action={approvePartnerSuggestion}><input type="hidden" name="id" value={suggestion.id} /><button type="submit" className="rounded-md bg-neon px-4 py-2 text-sm font-bold text-black">Marcar analisada</button></form>
              <form action={rejectPartnerSuggestion}><input type="hidden" name="id" value={suggestion.id} /><button type="submit" className="rounded-md border border-red-500/50 px-4 py-2 text-sm font-bold text-red-400">Arquivar</button></form>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
