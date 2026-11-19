import { ClipboardCopy } from '@/components/ui/clipboard-copy';
import { OutboundLink } from '@/components/ui/outbound-link';
import { getFirstWithdrawalGuide } from '@/lib/program-first-withdrawal';

type Props = {
  slug: string;
  programName: string;
  description?: string;
  paymentMethods?: string[];
  defaultOpen?: boolean;
};

const UTEST_REFERRAL = {
  name: 'Nicolas da Costa Santos',
  id: '2535825',
  url: 'https://www.utest.com/ref2535825',
};

export function ProgramFirstWithdrawal({ slug, programName, description, paymentMethods = [], defaultOpen = false }: Props) {
  const guide = getFirstWithdrawalGuide(slug);
  const textToCopy = [
    `Passo a passo para ${programName}`,
    ...(description ? [description] : []),
    ...guide.steps.map((step, index) => `${index + 1}. ${step}`),
    ...(slug === 'utest'
      ? [
        `Dados de indicação: ${UTEST_REFERRAL.name}`,
        `uTest ID: ${UTEST_REFERRAL.id}`,
        UTEST_REFERRAL.url,
        'Dica: ao responder formulários de novos projetos, informe quando você foi indicado por uma referência experiente, se isso for verdadeiro e puder ser comprovado.',
      ]
      : []),
    ...(paymentMethods.length > 0 ? ['Como receber:'] : []),
    ...paymentMethods.map((method) => `- ${method}`),
    `Observação: ${guide.note}`,
  ].join('\n');

  return (
    <section className="mt-6 rounded-xl border border-orange/30 bg-orange/5 p-4 md:p-5">
      <details open={defaultOpen}>
        <summary className="cursor-pointer list-none text-base font-bold text-orange">
          <span className="mr-2 inline-block rounded-full border border-orange/40 px-2 py-0.5 text-[0.68rem] uppercase tracking-[0.14em]">Guia prático</span>
          Passo a passo
        </summary>
        <div className="mt-4 border-t border-orange/15 pt-4">
          {description && <p className="mb-4 whitespace-pre-line text-sm leading-relaxed opacity-80">{description}</p>}
          <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed opacity-85">
            {guide.steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
          {slug === 'utest' && (
            <div className="mt-4 rounded-lg border border-orange/25 bg-orange/5 p-3 text-sm leading-relaxed">
              <p className="font-bold">Dados de indicação para o uTest</p>
              <p className="mt-1">Nome: {UTEST_REFERRAL.name}</p>
              <p>ID do uTest: {UTEST_REFERRAL.id}</p>
              <OutboundLink href={UTEST_REFERRAL.url} trackingId="utest-referral" sponsored className="mt-2 inline-block text-orange underline">
                {UTEST_REFERRAL.url}
              </OutboundLink>
              <p className="mt-2 text-xs opacity-70">Use estes dados apenas quando o cadastro solicitar indicação e o preenchimento for verdadeiro.</p>
            </div>
          )}
          {paymentMethods.length > 0 && (
            <div className="mt-4 rounded-lg border border-border bg-background/45 p-3 text-sm leading-relaxed">
              <p className="font-bold">Como receber</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 opacity-80">
                {paymentMethods.map((method) => <li key={method}>{method}</li>)}
              </ul>
            </div>
          )}
          <p className="mt-4 text-xs leading-relaxed opacity-65">{guide.note}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <ClipboardCopy textToCopy={textToCopy} />
            <span className="text-xs opacity-60">Copie para acompanhar sem esquecer uma etapa.</span>
          </div>
        </div>
      </details>
    </section>
  );
}
