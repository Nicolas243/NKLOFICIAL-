import { ClipboardCopy } from '@/components/ui/clipboard-copy';
import { getFirstWithdrawalGuide } from '@/lib/program-first-withdrawal';

type Props = {
  slug: string;
  programName: string;
  defaultOpen?: boolean;
};

export function ProgramFirstWithdrawal({ slug, programName, defaultOpen = false }: Props) {
  const guide = getFirstWithdrawalGuide(slug);
  const textToCopy = slug === 'utest'
    ? 'Nicolas da Costa Santos\nUTest ID: 2535825\nhttps://www.utest.com/ref2535825'
    : [
      `Passo a passo para o primeiro saque em ${programName}`,
      ...guide.steps.map((step, index) => `${index + 1}. ${step}`),
      `Observação: ${guide.note}`,
    ].join('\n');

  return (
    <section className="mt-6 rounded-xl border border-orange/30 bg-orange/5 p-4 md:p-5">
      <details open={defaultOpen}>
        <summary className="cursor-pointer list-none text-base font-bold text-orange">
          <span className="mr-2 inline-block rounded-full border border-orange/40 px-2 py-0.5 text-[0.68rem] uppercase tracking-[0.14em]">Guia prático</span>
          Como funciona e como chegar ao primeiro saque
        </summary>
        <div className="mt-4 border-t border-orange/15 pt-4">
          <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed opacity-85">
            {guide.steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <p className="mt-4 text-xs leading-relaxed opacity-65">{guide.note}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <ClipboardCopy textToCopy={textToCopy} />
            <span className="text-xs opacity-60">{slug === 'utest' ? 'Copie seus dados de indicação sem compartilhar seu e-mail pessoal.' : 'Copie para acompanhar sem esquecer uma etapa.'}</span>
          </div>
        </div>
      </details>
    </section>
  );
}
