import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { enforcePublicRateLimit } from '@/lib/upstash/ratelimit';
import {
  EmailDeliveryError,
  sendMaterialDeliveryFailureAlert,
  sendMaterialEmail,
} from '@/lib/email/resend';

const requestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  area: z.enum(['music', 'income']),
  privacyConsent: z.literal(true),
});

const MATERIALS = {
  music: {
    filename: 'Grafico_de_Cordas_Online.pdf',
    source: ['nkl-musical', 'grafico de cordas violino', 'Grafico_de_Cordas_Online.pdf'],
  },
  income: {
    filename: 'Guia Essencial Renda Extra 2027 - Portal NKL.pdf',
    source: ['nkl-blog', 'renda-extra', 'Guia Essencial Renda Extra 2027 - Portal NKL .pdf'],
  },
} as const;

const COOLDOWN_SECONDS = 24 * 60 * 60;

function cooldownCookieName(area: 'music' | 'income'): string {
  return `nkl_material_${area}`;
}

function cooldownValue(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

async function loadMaterial(area: 'music' | 'income'): Promise<Buffer> {
  const material = MATERIALS[area];
  return readFile(path.join(process.cwd(), ...material.source));
}

async function sendWithRetry(input: Parameters<typeof sendMaterialEmail>[0]): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await sendMaterialEmail(input);
      return;
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw lastError instanceof Error ? lastError : new EmailDeliveryError('Falha desconhecida no envio.');
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const cookieName = cooldownCookieName(parsed.data.area);
  const existingCookie = request.headers.get('cookie')?.match(new RegExp(`${cookieName}=([^;]+)`))?.[1];
  if (existingCookie === cooldownValue(email)) {
    return NextResponse.json(
      { error: 'Este material já foi enviado para este e-mail nas últimas 24 horas.' },
      { status: 429 },
    );
  }

  try {
    await enforcePublicRateLimit('material-email', email);
    const content = await loadMaterial(parsed.data.area);
    await sendWithRetry({
      recipientEmail: email,
      recipientName: parsed.data.name,
      area: parsed.data.area,
      attachment: {
        filename: MATERIALS[parsed.data.area].filename,
        content,
      },
    });

    const response = NextResponse.json({ status: 'sent' });
    response.cookies.set(cookieName, cooldownValue(email), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: COOLDOWN_SECONDS,
      path: '/',
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'erro desconhecido';
    try {
      await sendMaterialDeliveryFailureAlert({
        recipientEmail: email,
        area: parsed.data.area,
        errorMessage: message,
      });
    } catch (alertError) {
      console.error('[MATERIALS] Falha ao notificar admin:', alertError);
    }
    console.error('[MATERIALS] Falha no envio:', error);
    return NextResponse.json({ error: 'Não foi possível enviar o material agora.' }, { status: 502 });
  }
}
