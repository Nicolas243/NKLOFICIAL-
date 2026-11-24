import { and, desc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { isValidProductSlug, type ProductSlug } from '@/config/products';
import { userEntitlements } from '@/db/schema';

export type EntitlementStatus = 'active' | 'revoked' | 'expired';

export type EntitlementRecord = {
  id?: string;
  userId: string;
  productSlug: string;
  status: EntitlementStatus;
  orderReference?: string;
  grantedAt?: Date;
  expiresAt: Date | null;
};

export type GrantEntitlementInput = {
  userId: string;
  productSlug: ProductSlug;
  orderReference: string;
  expiresAt?: Date | null;
};

export type RevokeEntitlementInput = {
  userId: string;
  productSlug: ProductSlug;
  nextStatus?: 'revoked' | 'expired';
};

const grantEntitlementSchema = z.object({
  userId: z.string().trim().min(1).max(120),
  productSlug: z.custom<ProductSlug>((value) => isValidProductSlug(value), {
    message: 'Produto inválido para liberação.',
  }),
  orderReference: z.string().trim().min(1).max(255),
  expiresAt: z.date().nullable().optional(),
});

const revokeEntitlementSchema = z.object({
  userId: z.string().trim().min(1).max(120),
  productSlug: z.custom<ProductSlug>((value) => isValidProductSlug(value), {
    message: 'Produto inválido para revogação.',
  }),
  nextStatus: z.enum(['revoked', 'expired']).default('revoked'),
});

let loggedMissingTableWarning = false;

async function getDb() {
  const { db } = await import('@/db');
  return db;
}

async function getSupabaseServerClient() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
}

/**
 * Detecta erro PostgreSQL 42P01 (tabela ausente) na cadeia de causas.
 */
export function isUndefinedTableError(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 3; depth += 1) {
    if (typeof current !== 'object' || current === null) return false;
    const candidate = current as { code?: unknown; cause?: unknown };
    if (candidate.code === '42P01') return true;
    current = candidate.cause;
  }
  return false;
}

function logMissingTableOnce(context: string): void {
  if (loggedMissingTableWarning) return;
  loggedMissingTableWarning = true;
  console.warn(
    `[ENTITLEMENTS] Tabela user_entitlements indisponível (42P01) em ${context}; bloqueando acesso por segurança.`,
  );
}

/**
 * Avalia de forma pura se um registro de acesso individual está ativo para o SKU informado.
 */
export function isEntitlementActiveRecord(
  record: EntitlementRecord | null | undefined,
  productSlug: ProductSlug,
  now: Date = new Date(),
): boolean {
  if (!record) return false;
  if (!isValidProductSlug(productSlug)) return false;
  if (typeof record.userId !== 'string' || record.userId.trim().length === 0) return false;
  if (record.productSlug !== productSlug) return false;
  if (record.status !== 'active') return false;
  if (record.expiresAt === null) return true;
  const expiresMs = record.expiresAt.getTime();
  const nowMs = now.getTime();
  if (Number.isNaN(expiresMs) || Number.isNaN(nowMs)) return false;
  return expiresMs > nowMs;
}

/**
 * Verifica de forma pura se um usuário possui acesso ativo a um SKU específico em uma lista.
 */
export function hasEntitlementInList(
  records: readonly EntitlementRecord[],
  userId: string,
  productSlug: ProductSlug,
  now: Date = new Date(),
): boolean {
  if (typeof userId !== 'string' || userId.trim().length === 0) return false;
  if (!isValidProductSlug(productSlug)) return false;
  return records.some(
    (record) =>
      record.userId === userId && isEntitlementActiveRecord(record, productSlug, now),
  );
}

/**
 * Consulta o banco e confirma se o usuário possui direito ativo ao SKU isolado.
 */
export async function hasProductEntitlement(
  userId: string,
  productSlug: ProductSlug,
): Promise<boolean> {
  const normalizedUserId = typeof userId === 'string' ? userId.trim() : '';
  if (!normalizedUserId || !isValidProductSlug(productSlug)) {
    return false;
  }

  try {
    const db = await getDb();
    const [record] = await db
      .select({
        id: userEntitlements.id,
        userId: userEntitlements.userId,
        productSlug: userEntitlements.productSlug,
        status: userEntitlements.status,
        orderReference: userEntitlements.orderReference,
        grantedAt: userEntitlements.grantedAt,
        expiresAt: userEntitlements.expiresAt,
      })
      .from(userEntitlements)
      .where(
        and(
          eq(userEntitlements.userId, normalizedUserId),
          eq(userEntitlements.productSlug, productSlug),
        ),
      )
      .limit(1);

    if (!record || record.userId !== normalizedUserId) {
      return false;
    }

    return isEntitlementActiveRecord(record, productSlug);
  } catch (error) {
    if (isUndefinedTableError(error)) {
      logMissingTableOnce('hasProductEntitlement');
      return false;
    }
    throw error;
  }
}

/**
 * Retorna apenas os acessos ativos e não expirados do usuário.
 */
export async function getUserActiveEntitlements(
  userId: string,
): Promise<readonly EntitlementRecord[]> {
  const normalizedUserId = typeof userId === 'string' ? userId.trim() : '';
  if (!normalizedUserId) {
    return [];
  }

  try {
    const db = await getDb();
    const rows = await db
      .select({
        id: userEntitlements.id,
        userId: userEntitlements.userId,
        productSlug: userEntitlements.productSlug,
        status: userEntitlements.status,
        orderReference: userEntitlements.orderReference,
        grantedAt: userEntitlements.grantedAt,
        expiresAt: userEntitlements.expiresAt,
      })
      .from(userEntitlements)
      .where(
        and(
          eq(userEntitlements.userId, normalizedUserId),
          eq(userEntitlements.status, 'active'),
        ),
      )
      .orderBy(desc(userEntitlements.grantedAt));

    const now = new Date();
    return rows.filter(
      (row) =>
        row.userId === normalizedUserId &&
        isValidProductSlug(row.productSlug) &&
        isEntitlementActiveRecord(row, row.productSlug, now),
    );
  } catch (error) {
    if (isUndefinedTableError(error)) {
      logMissingTableOnce('getUserActiveEntitlements');
      return [];
    }
    throw error;
  }
}

/**
 * Protege páginas pagas no servidor, redirecionando imediatamente quando não há acesso ao SKU.
 */
export async function requireProductAccess(
  productSlug: ProductSlug,
): Promise<{ userId: string; userEmail: string | null }> {
  if (!isValidProductSlug(productSlug)) {
    redirect('/');
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect(`/ofertas/${productSlug}`);
  }

  const allowed = await hasProductEntitlement(user.id, productSlug);
  if (!allowed) {
    redirect(`/ofertas/${productSlug}`);
  }

  return {
    userId: user.id,
    userEmail: user.email ?? null,
  };
}

/**
 * Libera ou renova um acesso isolado por SKU de forma transacional e idempotente.
 */
export async function grantEntitlementByOrder(
  input: GrantEntitlementInput,
): Promise<EntitlementRecord> {
  const parsed = grantEntitlementSchema.parse(input);
  const db = await getDb();
  const now = new Date();
  const expiresAt = parsed.expiresAt ?? null;

  const [row] = await db.transaction(async (tx) =>
    tx
      .insert(userEntitlements)
      .values({
        userId: parsed.userId,
        productSlug: parsed.productSlug,
        status: 'active',
        orderReference: parsed.orderReference,
        grantedAt: now,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: [userEntitlements.userId, userEntitlements.productSlug],
        set: {
          status: 'active',
          orderReference: parsed.orderReference,
          grantedAt: now,
          expiresAt,
        },
      })
      .returning({
        id: userEntitlements.id,
        userId: userEntitlements.userId,
        productSlug: userEntitlements.productSlug,
        status: userEntitlements.status,
        orderReference: userEntitlements.orderReference,
        grantedAt: userEntitlements.grantedAt,
        expiresAt: userEntitlements.expiresAt,
      }),
  );

  if (!row) {
    throw new Error('Não foi possível registrar o acesso ao produto.');
  }

  return row;
}

/**
 * Atualiza o status de um acesso para revogado ou expirado para o par usuário + SKU.
 */
export async function revokeEntitlementByProduct(
  input: RevokeEntitlementInput,
): Promise<boolean> {
  const parsed = revokeEntitlementSchema.parse(input);
  const db = await getDb();

  const updated = await db.transaction(async (tx) =>
    tx
      .update(userEntitlements)
      .set({ status: parsed.nextStatus })
      .where(
        and(
          eq(userEntitlements.userId, parsed.userId),
          eq(userEntitlements.productSlug, parsed.productSlug),
        ),
      )
      .returning({ id: userEntitlements.id }),
  );

  return updated.length > 0;
}
