'use server';

import { db } from '@/db';
import { stringsCatalog } from '@/db/schema';
import { and, asc, eq, gte, ilike, lte, type SQL } from 'drizzle-orm';
import { isUuid } from '@/lib/uuid';

export interface CatalogFilters {
  query?: string;
  coreMaterial?: string;
  minPrice?: number;
  maxPrice?: number;
}

export async function getStringsCatalog(filters: CatalogFilters = {}) {
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

    return await db
      .select()
      .from(stringsCatalog)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(stringsCatalog.name));
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