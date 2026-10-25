'use client';

import type { ClassPlanModality } from '@/lib/pricing';
import { calculateClassPricing, getModalityMetadata, CENTS_PER_UNIT } from '@/lib/pricing';

type PlanModalitySelectorProps = {
  prices: Record<ClassPlanModality, number>;
  selectedModality: ClassPlanModality;
  onSelectModality: (modality: ClassPlanModality) => void;
};

const modalities: ClassPlanModality[] = ['single', 'monthly', 'semiannual', 'annual'];

export function PlanModalitySelector({ prices, selectedModality, onSelectModality }: PlanModalitySelectorProps) {
  const singlePrice = prices.single;
  return (
    <div role="radiogroup" aria-label="Modalidade da aula" className="grid gap-3 sm:grid-cols-2">
      {modalities.map((modality) => {
        const metadata = getModalityMetadata(modality);
        const pricing = calculateClassPricing(prices[modality], modality);
        const savings = Math.max(0, Math.round((1 - prices[modality] / (singlePrice * metadata.includedClasses)) * 100));
        return (
          <button
            key={modality}
            type="button"
            role="radio"
            aria-checked={selectedModality === modality}
            onClick={() => onSelectModality(modality)}
            className={`rounded-xl border p-4 text-left transition-colors ${selectedModality === modality ? 'border-neon bg-neon/10' : 'border-border hover:border-neon/60'}`}
          >
            <strong className="block">{metadata.label}</strong>
            <span className="mt-1 block text-xs opacity-70">{metadata.includedClasses} aula{metadata.includedClasses > 1 ? 's' : ''} · R$ {(prices[modality] / CENTS_PER_UNIT).toFixed(2)}</span>
            <span className="mt-2 block text-xs opacity-70">R$ {(pricing.effectivePricePerClassCents / CENTS_PER_UNIT).toFixed(2)}/aula · economia de {savings}%</span>
            <span className="mt-1 block text-xs text-neon">Aluno paga +5%: R$ {(pricing.totalStudentPaysCents / CENTS_PER_UNIT).toFixed(2)}</span>
          </button>
        );
      })}
    </div>
  );
}
