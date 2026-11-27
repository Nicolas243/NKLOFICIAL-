import Link from 'next/link';

export type BlufFact = {
  label: string;
  value: string;
};

type BlufSummaryProps = {
  eyebrow?: string;
  title?: string;
  summary: string;
  facts?: BlufFact[];
  verifiedAt?: string | null;
  verificationNotes?: string;
  methodologyHref?: string;
};

/**
 * Bloco direto no topo da página com síntese objetiva, fatos principais e histórico de verificação.
 */
export function BlufSummary({
  eyebrow = 'Resposta direta',
  title,
  summary,
  facts,
  verifiedAt,
  verificationNotes,
  methodologyHref = '/metodologia',
}: BlufSummaryProps) {
  const hasVerificationDetails = Boolean(verifiedAt || verificationNotes);

  return (
    <section
      aria-label="Resumo direto"
      className="rounded-2xl border border-neon/30 bg-income-surface/85 p-5 md:p-6"
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">{eyebrow}</p>
      {title && (
        <h2 className="mt-2 font-playfair text-xl font-bold text-foreground md:text-2xl">
          {title}
        </h2>
      )}
      <p className="mt-2 text-sm leading-relaxed text-foreground/85 md:text-base">{summary}</p>

      {facts && facts.length > 0 && (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="rounded-xl border border-border bg-income-card/80 px-3.5 py-2.5"
            >
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                {fact.label}
              </dt>
              <dd className="mt-1 text-sm font-bold text-foreground">{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {(hasVerificationDetails || methodologyHref) && (
        <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3 text-xs text-foreground/70">
          {hasVerificationDetails ? (
            <p>
              <span className="font-semibold text-foreground/85">Histórico de verificação:</span>{' '}
              {verifiedAt ? `conferido em ${verifiedAt}. ` : ''}
              {verificationNotes ?? ''}
            </p>
          ) : (
            <p className="font-semibold text-foreground/85">
              Histórico de verificação editorial contínuo
            </p>
          )}
          {methodologyHref && (
            <Link href={methodologyHref} className="font-bold text-neon hover:underline">
              Ver critérios de verificação
            </Link>
          )}
        </footer>
      )}
    </section>
  );
}
