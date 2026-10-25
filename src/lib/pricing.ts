export const STUDENT_FEE_RATE = 0.05;
export const TEACHER_FEE_RATE = 0.05;
export const DEFAULT_CLASS_PRICE_CENTS = 15000;
export const CENTS_PER_UNIT = 100;
export const MP_AFFILIATE_SIGNUP_URL = 'https://mpago.li/2h3xfGP';
export const SINGLE_PLAN_CLASSES = 1;
export const MONTHLY_PLAN_CLASSES = 4;
export const SEMIANNUAL_PLAN_CLASSES = 24;
export const ANNUAL_PLAN_CLASSES = 48;
export const MIN_CLASS_PRICE_CENTS = 3000;
export const MAX_PLAN_PRICE_CENTS = 5000000;
export const SINGLE_MAX_INSTALLMENTS = 1;
export const MONTHLY_MAX_INSTALLMENTS = 3;
export const SEMIANNUAL_MAX_INSTALLMENTS = 6;
export const ANNUAL_MAX_INSTALLMENTS = 12;

export type ClassPlanModality = 'single' | 'monthly' | 'semiannual' | 'annual';

type ModalityMetadata = {
  label: string;
  includedClasses: number;
  validityDays: number;
  maxInstallments: number;
};

const MODALITY_METADATA: Record<ClassPlanModality, ModalityMetadata> = {
  single: { label: 'Aula Avulsa', includedClasses: SINGLE_PLAN_CLASSES, validityDays: 30, maxInstallments: SINGLE_MAX_INSTALLMENTS },
  monthly: { label: 'Plano Mensal', includedClasses: MONTHLY_PLAN_CLASSES, validityDays: 35, maxInstallments: MONTHLY_MAX_INSTALLMENTS },
  semiannual: { label: 'Plano Semestral', includedClasses: SEMIANNUAL_PLAN_CLASSES, validityDays: 190, maxInstallments: SEMIANNUAL_MAX_INSTALLMENTS },
  annual: { label: 'Plano Anual', includedClasses: ANNUAL_PLAN_CLASSES, validityDays: 370, maxInstallments: ANNUAL_MAX_INSTALLMENTS },
};

export type ClassPricing = {
  basePriceCents: number;
  studentFeeCents: number;
  teacherFeeCents: number;
  totalStudentPaysCents: number;
  teacherNetReceivesCents: number;
  platformApplicationFeeCents: number;
  includedClasses: number;
  effectivePricePerClassCents: number;
};

export function getModalityMetadata(modality: ClassPlanModality): ModalityMetadata {
  return MODALITY_METADATA[modality];
}

export function calculateClassPricing(
  basePriceCents: number,
  modality: ClassPlanModality = 'single',
): ClassPricing {
  if (!Number.isInteger(basePriceCents) || basePriceCents < MIN_CLASS_PRICE_CENTS || basePriceCents > MAX_PLAN_PRICE_CENTS) {
    throw new Error('O preço deve ser um valor inteiro entre os limites permitidos em centavos.');
  }

  const { includedClasses } = getModalityMetadata(modality);
  const studentFeeCents = Math.round(basePriceCents * STUDENT_FEE_RATE);
  const teacherFeeCents = Math.round(basePriceCents * TEACHER_FEE_RATE);

  return {
    basePriceCents,
    studentFeeCents,
    teacherFeeCents,
    totalStudentPaysCents: basePriceCents + studentFeeCents,
    teacherNetReceivesCents: basePriceCents - teacherFeeCents,
    platformApplicationFeeCents: studentFeeCents + teacherFeeCents,
    includedClasses,
    effectivePricePerClassCents: Math.round(basePriceCents / includedClasses),
  };
}

export function resolveTeacherModalityPrice(
  profile: {
    hourlyRateCents?: number | null;
    singleClassPriceCents?: number | null;
    monthlyPlanPriceCents?: number | null;
    semiannualPlanPriceCents?: number | null;
    annualPlanPriceCents?: number | null;
  },
  modality: ClassPlanModality,
): number {
  const configuredPrice = {
    single: profile.singleClassPriceCents,
    monthly: profile.monthlyPlanPriceCents,
    semiannual: profile.semiannualPlanPriceCents,
    annual: profile.annualPlanPriceCents,
  }[modality];
  return configuredPrice ?? profile.hourlyRateCents ?? DEFAULT_CLASS_PRICE_CENTS;
}
