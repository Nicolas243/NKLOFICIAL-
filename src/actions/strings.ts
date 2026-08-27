'use server';

import { db } from '@/db';
import { stringsCatalog } from '@/db/schema';
import { asc, eq, ilike } from 'drizzle-orm';
import { isUuid } from '@/lib/uuid';

export async function getStringsCatalog(query?: string) {
  try {
    const conditions = query ? ilike(stringsCatalog.name, `%${query}%`) : undefined;
    
    return await db
      .select()
      .from(stringsCatalog)
      .where(conditions)
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