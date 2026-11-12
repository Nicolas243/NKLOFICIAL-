import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { isValidCpf, normalizeCpf } from '@/lib/guide-personalization';

const ACCESS_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY_LENGTH = 32;
const ENCRYPTION_VERSION = 'v1';

const guestCheckoutSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320),
  cpf: z.string().trim().min(11).max(18),
  cpfConsentConfirmed: z.literal(true),
  consentVersion: z.string().trim().min(1).max(40),
});

export type GuestCheckoutInput = {
  fullName: string;
  email: string;
  cpf: string;
  cpfConsentConfirmed: true;
  consentVersion: string;
};

function getEncryptionKey(): Buffer {
  const configuredKey = process.env.GUEST_CHECKOUT_ENCRYPTION_KEY;
  if (!configuredKey) {
    throw new Error('GUEST_CHECKOUT_ENCRYPTION_KEY is required for guest CPF encryption.');
  }
  return createHash('sha256')
    .update(configuredKey, 'utf8')
    .digest()
    .subarray(0, ENCRYPTION_KEY_LENGTH);
}

export function normalizeGuestCheckoutInput(input: unknown): GuestCheckoutInput {
  const parsed = guestCheckoutSchema.parse(input);
  const cpf = normalizeCpf(parsed.cpf);
  if (!isValidCpf(cpf)) {
    throw new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        path: ['cpf'],
        message: 'CPF inválido.',
      },
    ]);
  }

  return {
    fullName: parsed.fullName.replace(/\s+/g, ' '),
    email: parsed.email.toLowerCase(),
    cpf,
    cpfConsentConfirmed: true,
    consentVersion: parsed.consentVersion,
  };
}

export function createGuestAccessToken(now = new Date()): {
  token: string;
  tokenHash: string;
  expiresAt: Date;
} {
  const token = randomBytes(32).toString('base64url');
  return {
    token,
    tokenHash: hashGuestAccessToken(token),
    expiresAt: new Date(now.getTime() + ACCESS_TOKEN_TTL_MS),
  };
}

export function hashGuestAccessToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function isGuestAccessTokenValid(expiresAt: Date, now = new Date()): boolean {
  return expiresAt.getTime() > now.getTime();
}

export function encryptGuestCpf(cpf: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(normalizeCpf(cpf), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [
    ENCRYPTION_VERSION,
    iv.toString('base64url'),
    authTag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join('.');
}

export function decryptGuestCpf(value: string): string {
  const [version, ivValue, authTagValue, ciphertextValue] = value.split('.');
  if (version !== ENCRYPTION_VERSION || !ivValue || !authTagValue || !ciphertextValue) {
    throw new Error('Invalid encrypted guest CPF.');
  }

  const decipher = createDecipheriv(
    ENCRYPTION_ALGORITHM,
    getEncryptionKey(),
    Buffer.from(ivValue, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(authTagValue, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
