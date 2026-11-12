const CPF_LENGTH = 11;

export type PersonalizationIdentity = {
  fullName: string;
  cpf: string;
  email: string;
  shortId: string;
};

export function normalizeCpf(value: string): string {
  return value.replace(/\D/g, '');
}

export function isValidCpf(value: string): boolean {
  const cpf = normalizeCpf(value);
  if (cpf.length !== CPF_LENGTH || /^(\d)\1{10}$/.test(cpf)) return false;

  let firstDigit = 0;
  for (let index = 0; index < 9; index += 1) {
    firstDigit += Number(cpf[index]) * (10 - index);
  }
  firstDigit = (firstDigit * 10) % 11;
  if (firstDigit === 10) firstDigit = 0;
  if (firstDigit !== Number(cpf[9])) return false;

  let secondDigit = 0;
  for (let index = 0; index < 10; index += 1) {
    secondDigit += Number(cpf[index]) * (11 - index);
  }
  secondDigit = (secondDigit * 10) % 11;
  if (secondDigit === 10) secondDigit = 0;
  return secondDigit === Number(cpf[10]);
}

export function buildPersonalizationLabel(identity: PersonalizationIdentity): string {
  const fullName = identity.fullName.trim().replace(/\s+/g, ' ');
  const email = identity.email.trim().toLowerCase();
  const shortId = identity.shortId.trim().replace(/[^a-zA-Z0-9-]/g, '').slice(0, 16);
  return `${fullName} · ${normalizeCpf(identity.cpf)} · ${email} · NKL-${shortId}`;
}
