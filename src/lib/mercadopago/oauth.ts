import crypto from 'node:crypto';
import { z } from 'zod';
import { env } from '@/env';

export const MP_OAUTH_AUTH_URL = 'https://auth.mercadopago.com.br/authorization';
export const MP_OAUTH_TOKEN_URL = 'https://api.mercadopago.com/oauth/token';
export const OAUTH_STATE_TTL_MS = 600000;

const oauthResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  user_id: z.union([z.string(), z.number()]),
  expires_in: z.number().positive(),
});

type OAuthStatePayload = {
  userId: string;
  timestamp: number;
  nonce: string;
};

function sign(value: string): string {
  return crypto.createHmac('sha256', env.MERCADOPAGO_WEBHOOK_SECRET).update(value).digest('hex');
}

export function createSignedOAuthState(userId: string): string {
  const payload: OAuthStatePayload = { userId, timestamp: Date.now(), nonce: crypto.randomBytes(16).toString('hex') };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function verifySignedOAuthState(state: string, userId: string): boolean {
  const [encoded, signature] = state.split('.');
  if (!encoded || !signature || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = sign(encoded);
  const received = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  if (received.length !== expectedBuffer.length || !crypto.timingSafeEqual(received, expectedBuffer)) return false;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as OAuthStatePayload;
    return payload.userId === userId && Date.now() - payload.timestamp <= OAUTH_STATE_TTL_MS;
  } catch {
    return false;
  }
}

export function buildMercadoPagoOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.MERCADOPAGO_CLIENT_ID ?? '',
    response_type: 'code',
    platform_id: 'mp',
    redirect_uri: env.MERCADOPAGO_REDIRECT_URI,
    state,
  });
  return `${MP_OAUTH_AUTH_URL}?${params.toString()}`;
}

export async function exchangeMercadoPagoCode(code: string) {
  if (!env.MERCADOPAGO_CLIENT_ID || !env.MERCADOPAGO_CLIENT_SECRET) {
    throw new Error('Mercado Pago OAuth não configurado.');
  }
  const response = await fetch(MP_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: env.MERCADOPAGO_CLIENT_ID,
      client_secret: env.MERCADOPAGO_CLIENT_SECRET,
      code,
      redirect_uri: env.MERCADOPAGO_REDIRECT_URI,
    }),
  });
  if (!response.ok) throw new Error(`Mercado Pago OAuth recusou a troca: ${response.status}`);
  return oauthResponseSchema.parse(await response.json());
}
