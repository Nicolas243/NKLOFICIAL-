import type { CalculatedQuizProfile } from '@/db/schema';
import type { BusinessProfile } from './quiz-engine';

export type QuizBusinessResult = {
  name: string;
  actionPlan3Steps: [string, string, string];
};

export type QuizResult = {
  archetype: string;
  analysis: string;
  profile: CalculatedQuizProfile;
  top3Businesses: QuizBusinessResult[];
};

export function buildDeterministicResult(
  profile: CalculatedQuizProfile,
  businesses: BusinessProfile[],
): QuizResult {
  const archetype = profile.capital <= 2 && profile.risk <= 2
    ? 'Construtor prudente'
    : profile.tech >= 4
      ? 'Operador digital'
      : profile.social >= 4
        ? 'Comunicador de oportunidades'
        : 'Explorador estratégico';

  const analysis = `Seu perfil combina disponibilidade de investimento ${profile.capital.toFixed(1)}/5, tempo ${profile.time.toFixed(1)}/5, domínio técnico ${profile.tech.toFixed(1)}/5, tolerância a risco ${profile.risk.toFixed(1)}/5 e interação social ${profile.social.toFixed(1)}/5. Comece pelo primeiro caminho recomendado e valide com um teste pequeno antes de aumentar o compromisso.`;

  return {
    archetype,
    analysis,
    profile,
    top3Businesses: businesses.map((business) => ({
      name: business.name,
      actionPlan3Steps: [
        `Leia as regras e confirme se ${business.name} aceita o seu país e perfil.`,
        'Reserve um teste curto com limite de tempo e investimento definido.',
        'Registre resultado, custos e próximos ajustes antes de continuar.',
      ],
    })),
  };
}
