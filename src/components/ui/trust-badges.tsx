import { CircleDollarSign, ShieldCheck } from 'lucide-react';

type Props = {
  isZeroInvestment: boolean;
  tags: string[];
  requirements: string[];
  paymentMethods: string[];
};

export function TrustBadges({ isZeroInvestment, tags, requirements, paymentMethods }: Props) {
  const risk = tags.some((tag) => tag.toLocaleLowerCase().includes('cripto') || tag.toLocaleLowerCase().includes('invest'))
    ? 'Confirme riscos e taxas antes de movimentar dinheiro.'
    : 'Não há promessa de renda ou aprovação.';
  const withdrawal = requirements.find((item) => /retirada|saque|mínim/iu.test(item)) ?? 'Confira a retirada mínima na plataforma.';
  const payment = paymentMethods[0] ?? 'Método definido pela plataforma.';

  return (
    <section className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 shadow-sm" aria-label="Selos de confiança">
      {isZeroInvestment && (
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-300" size={22} aria-hidden="true" />
          <div>
            <h2 className="font-bold text-emerald-800 dark:text-emerald-200">100% gratuito</h2>
            <p className="mt-1 text-sm leading-relaxed text-emerald-950/80 dark:text-emerald-100/80">Zero necessidade de investimento inicial.</p>
          </div>
        </div>
      )}
      <ul className="mt-4 space-y-2 border-t border-emerald-500/20 pt-3 text-sm leading-relaxed">
        <li className="flex gap-2"><CircleDollarSign size={17} className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-300" aria-hidden="true" /><span><strong>Retirada mínima:</strong> {withdrawal}</span></li>
        <li className="flex gap-2"><CircleDollarSign size={17} className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-300" aria-hidden="true" /><span><strong>Método de pagamento:</strong> {payment}</span></li>
        <li className="flex gap-2"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-300" aria-hidden="true" /><span><strong>Risco:</strong> {risk}</span></li>
      </ul>
    </section>
  );
}
