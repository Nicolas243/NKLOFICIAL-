'use server';

import { db } from '@/db';
import { stringsCatalog } from '@/db/schema';
import { asc, ilike } from 'drizzle-orm';

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