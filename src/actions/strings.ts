'use server';

import { db } from '@/db';
import { stringsCatalog } from '@/db/schema';
import { and, asc, eq, gte, ilike, lte, count, type SQL } from 'drizzle-orm';
import { isUuid } from '@/lib/uuid';

export interface CatalogFilters {
  query?: string;
  coreMaterial?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export type CatalogPageResult = {
  data: (typeof stringsCatalog.$inferSelect)[];
  totalPages: number;
  currentPage: number;
};

export async function getStringsCatalog(
  filters: CatalogFilters = {}
): Promise<CatalogPageResult> {
  try {
    // Query builder dinâmico: cada condição só entra no array se o filtro
    // existir — o array nunca recebe valores `undefined`.
    const conditions: SQL[] = [];

    if (filters.query && filters.query.trim() !== '') {
      conditions.push(ilike(stringsCatalog.name, `%${filters.query.trim()}%`));
    }

    if (filters.coreMaterial && filters.coreMaterial.trim() !== '') {
      conditions.push(eq(stringsCatalog.coreMaterial, filters.coreMaterial));
    }

    if (typeof filters.minPrice === 'number' && !Number.isNaN(filters.minPrice)) {
      // Coluna numeric do Postgres: comparações recebem string.
      conditions.push(gte(stringsCatalog.realPrice, String(filters.minPrice)));
    }

    if (typeof filters.maxPrice === 'number' && !Number.isNaN(filters.maxPrice)) {
      conditions.push(lte(stringsCatalog.realPrice, String(filters.maxPrice)));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const page = Math.max(1, Number.isInteger(filters.page) ? (filters.page as number) : 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.isInteger(filters.limit) ? (filters.limit as number) : 12)
    );

    // Duas queries paralelas: dados paginados + total para calcular a última
    // página sem carregar o acervo inteiro (previne OOM).
    const [rows, totalRow] = await Promise.all([
      db
        .select()
        .from(stringsCatalog)
        .where(where)
        .orderBy(asc(stringsCatalog.name))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ value: count() }).from(stringsCatalog).where(where),
    ]);

    const total = totalRow?.[0]?.value ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return { data: rows, totalPages, currentPage: page };
  } catch (error) {
    console.error('Falha na consulta ao catálogo:', error);
    throw new Error('Falha na comunicação com o banco de dados.');
  }
}

export async function getStringDetails(id: string) {
  // Fronteira de injeção: UUID malformado nunca deve atingir o Postgres.
  if (!isUuid(id)) return null;

  const [row] = await db
    .select()
    .from(stringsCatalog)
    .where(eq(stringsCatalog.id, id))
    .limit(1);

  return row ?? null;
}