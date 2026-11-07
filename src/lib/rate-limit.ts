import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { passwordChangeAttempts } from '@/db/schema';
import { enforcePublicRateLimit } from '@/lib/upstash/ratelimit';

/**
 * Rate limiter DISTRIBUÍDO para troca de senha.
 *
 * Diferente do RateLimiter em memória (Map), este persiste o estado no
 * Postgres via Drizzle — unico store compartilhado entre todas as instancias
 * do servidor. A regra de negocio:
 *
 * - 1 alteracao de senha bem-sucedida a cada 12 horas.
 * - Tentativas excessivas dentro da janela ativam exponential backoff
 *   (12h * 2^(excessos)), com teto de 7 dias.
 *
 * Padrao de inversion: o INCREMENTO de tentativas ocorre ANTES da verificacao,
 * de modo que tentativas bloqueadas continuam alimentando o contador e o
 * backoff cresce mesmo sob abuso.
 */

const WINDOW_MS = 12 * 60 * 60 * 1000; // 12 horas
const MAX_ATTEMPTS_PER_WINDOW = 3;
const BACKOFF_BASE_MS = 12 * 60 * 60 * 1000; // 12 horas (base exponencial)
const BACKOFF_CAP_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export type PasswordChangeGuard =
  | { ok: true }
  | { ok: false; reason: 'cooldown' | 'backoff'; retryAfterMs: number };

export async function guardPasswordChange(userId: string): Promise<PasswordChangeGuard> {
  const now = Date.now();

  const [row] = await db
    .select({
      attemptCount: passwordChangeAttempts.attemptCount,
      lastAttemptAt: passwordChangeAttempts.lastAttemptAt,
      lastSuccessAt: passwordChangeAttempts.lastSuccessAt,
    })
    .from(passwordChangeAttempts)
    .where(eq(passwordChangeAttempts.userId, userId))
    .limit(1);

  // INCREMENTO ANTES DA VERIFICACAO (anti-bypass): cada chamada conta, mesmo
  // quando o resultado final for um bloqueio. Update atomico via SQL.
  await db
    .insert(passwordChangeAttempts)
    .values({
      userId,
      attemptCount: 1,
      lastAttemptAt: new Date(now),
    })
    .onConflictDoUpdate({
      target: passwordChangeAttempts.userId,
      set: {
        attemptCount: sql`${passwordChangeAttempts.attemptCount} + 1`,
        lastAttemptAt: new Date(now),
      },
    });

  // Primeira tentativa do usuario: sempre permitida.
  if (!row) return { ok: true };

  // 1. Cooldown apos sucesso: 12h.
  if (row.lastSuccessAt) {
    const cooldownEnd = row.lastSuccessAt.getTime() + WINDOW_MS;
    if (now < cooldownEnd) {
      return { ok: false, reason: 'cooldown', retryAfterMs: cooldownEnd - now };
    }
  }

  // 2. Backoff exponencial por excesso de tentativas na janela.
  const windowStart = row.lastAttemptAt.getTime();
  if (
    row.attemptCount >= MAX_ATTEMPTS_PER_WINDOW &&
    now - windowStart < WINDOW_MS
  ) {
    const excessFactor = row.attemptCount - MAX_ATTEMPTS_PER_WINDOW + 1;
    const backoffMs = Math.min(BACKOFF_BASE_MS * 2 ** excessFactor, BACKOFF_CAP_MS);
    return { ok: false, reason: 'backoff', retryAfterMs: backoffMs };
  }

  return { ok: true };
}

/** Registra uma troca de senha bem-sucedida (zera o contador e abre cooldown). */
export async function recordSuccessfulPasswordChange(userId: string): Promise<void> {
  const now = new Date();
  await db
    .insert(passwordChangeAttempts)
    .values({
      userId,
      attemptCount: 0,
      lastAttemptAt: now,
      lastSuccessAt: now,
    })
    .onConflictDoUpdate({
      target: passwordChangeAttempts.userId,
      set: {
        attemptCount: 0,
        lastAttemptAt: now,
        lastSuccessAt: now,
      },
    });
}

export async function enforceGuideDownloadRateLimit(identifier: string): Promise<void> {
    await enforcePublicRateLimit('guide-download', identifier);
}