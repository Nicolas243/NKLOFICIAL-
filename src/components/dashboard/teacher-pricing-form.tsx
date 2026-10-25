'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateTeacherPricingAction, type TeacherFinanceState } from '@/actions/teacher-finance';
import { calculateClassPricing, CENTS_PER_UNIT } from '@/lib/pricing';

type TeacherPricingFormProps = {
  singleClassPriceCents: number;
  monthlyPlanPriceCents: number;
  semiannualPlanPriceCents: number;
  annualPlanPriceCents: number;
  acceptsNewStudents: boolean;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="rounded-md bg-neon px-4 py-3 font-bold text-black disabled:opacity-50">{pending ? 'Salvando planos...' : 'Salvar planos'}</button>;
}

export function TeacherPricingForm(props: TeacherPricingFormProps) {
  const [state, action] = useActionState<TeacherFinanceState, FormData>(updateTeacherPricingAction, { success: false, message: '' });
  const prices = [
    ['Aula Avulsa', 'singleClassPrice', props.singleClassPriceCents, 1],
    ['Plano Mensal', 'monthlyPlanPrice', props.monthlyPlanPriceCents, 4],
    ['Plano Semestral', 'semiannualPlanPrice', props.semiannualPlanPriceCents, 24],
    ['Plano Anual', 'annualPlanPrice', props.annualPlanPriceCents, 48],
  ] as const;
  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-border bg-surface p-6 md:grid-cols-2">
      <div className="md:col-span-2"><p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Planos</p><h2 className="mt-2 font-playfair text-2xl font-bold">Configure seus valores</h2></div>
      {prices.map(([label, name, cents, classes]) => {
        const pricing = calculateClassPricing(cents, name === 'singleClassPrice' ? 'single' : name === 'monthlyPlanPrice' ? 'monthly' : name === 'semiannualPlanPrice' ? 'semiannual' : 'annual');
        return <label key={name} className="rounded-xl border border-border p-4 text-sm">
          <span className="font-bold">{label} ({classes} aula{classes > 1 ? 's' : ''})</span>
          <input className="mt-2 w-full rounded-md border border-border bg-background p-3" type="number" name={name} min="30" step="0.01" defaultValue={(cents / CENTS_PER_UNIT).toFixed(2)} required />
          <span className="mt-2 block text-xs opacity-70">Aluno paga R$ {(pricing.totalStudentPaysCents / CENTS_PER_UNIT).toFixed(2)} · líquido R$ {(pricing.teacherNetReceivesCents / CENTS_PER_UNIT).toFixed(2)} · R$ {(pricing.effectivePricePerClassCents / CENTS_PER_UNIT).toFixed(2)}/aula</span>
        </label>;
      })}
      <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" name="acceptsNewStudents" defaultChecked={props.acceptsNewStudents} /> Aceitar novos alunos</label>
      <div className="md:col-span-2"><SubmitButton /> {state.message && <span className="ml-3 text-sm text-neon">{state.message}</span>}</div>
    </form>
  );
}
