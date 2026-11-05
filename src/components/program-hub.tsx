import Link from 'next/link';
import type { PartnerProgramCard } from '@/actions/partner-programs';
import { OutboundLink } from '@/components/ui/outbound-link';

type Props = {
  title: string;
  description: string;
  programs: PartnerProgramCard[];
};

export function ProgramHub({ title, description, programs }: Props) {
  return (
    <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-4 md:pb-24 md:pt-10">
      <Link href="/programas" className="text-sm font-bold text-neon hover:underline">← Ver catálogo completo</Link>
      <header className="mt-5 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Guia de escolha</p>
        <h1 className="mt-3 font-playfair text-4xl font-bold leading-tight md:text-6xl">{title}</h1>
        <p className="mt-5 text-lg leading-relaxed opacity-75">{description}</p>
      </header>
      <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Oportunidades selecionadas">
        {programs.length === 0 ? (
          <p className="rounded-xl border border-border p-6 opacity-70">Nenhuma oportunidade corresponde a este guia no momento.</p>
        ) : programs.map((program) => (
          <article key={program.id} className="flex flex-col rounded-xl border border-border bg-surface p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-neon">{program.category}</p>
            <h2 className="mt-2 font-playfair text-2xl font-bold">{program.name}</h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed opacity-75">{program.shortDescription}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <span className="rounded-md border border-border px-3 py-2">{program.averageEarning}</span>
              <span className="rounded-md border border-border px-3 py-2">{program.languages.join(' · ')}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/programas/${program.slug}`} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-border px-3 py-2 text-sm font-bold hover:border-neon hover:text-neon">
                Ler detalhes
              </Link>
              <OutboundLink href={program.affiliateUrl ?? program.websiteUrl} trackingId={`${program.slug}-hub`} sponsored={Boolean(program.affiliateUrl)} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-neon px-3 py-2 text-center text-sm font-bold text-black hover:opacity-90">
                Começar
              </OutboundLink>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
