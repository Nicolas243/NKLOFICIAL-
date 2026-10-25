export const STUDENT_FEE_RATE = 0.05;
export const TEACHER_FEE_RATE = 0.05;
export const DEFAULT_CLASS_PRICE_CENTS = 15000;
export const CENTS_PER_UNIT = 100;

export type ClassPricing = {
  basePriceCents: number;
  studentFeeCents: number;
  teacherFeeCents: number;
  totalStudentPaysCents: number;
  teacherNetReceivesCents: number;
  platformApplicationFeeCents: number;
};

export function calculateClassPricing(basePriceCents: number): ClassPricing {
  if (!Number.isInteger(basePriceCents) || basePriceCents < 0) {
    throw new Error('O preço base deve ser um valor inteiro não negativo em centavos.');
  }

  const studentFeeCents = Math.round(basePriceCents * STUDENT_FEE_RATE);
  const teacherFeeCents = Math.round(basePriceCents * TEACHER_FEE_RATE);

  return {
    basePriceCents,
    studentFeeCents,
    teacherFeeCents,
    totalStudentPaysCents: basePriceCents + studentFeeCents,
    teacherNetReceivesCents: basePriceCents - teacherFeeCents,
    platformApplicationFeeCents: studentFeeCents + teacherFeeCents,
  };
}
