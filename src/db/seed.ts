import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { stringsCatalog } from './schema';

dotenv.config({ path: '.env.local' });

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

const initialStrings = [
  {
    name: 'Alice A703',
    projection: 'Forte',
    soundColor: 'W: 30% | F: 70%',
    coreMaterial: 'Aço (Sólido)',
    priceMin: '37',
    priceMax: '58',
    realPrice: '47',
    responseSpeed: 'Rápida',
    environment: 'Ambos',
    qualityLevel: 'C-',
    communityScore: '5.5',
    durability: 'Longa (6+ meses)',
    climateSensitivity: 'Baixa (Estável)',
    coating: 'Ligas / Níquel',
    fixation: 'Ball-end',
    arcTolerance: 'Média',
  },
  // Nota: O array completo deve ser importado do legado banco-cordas.js
];

async function main() {
  console.log('Iniciando seed de dados...');
  try {
    await db.insert(stringsCatalog).values(initialStrings).onConflictDoNothing();
    console.log('Seed concluído com sucesso.');
  } catch (error) {
    console.error('Erro na execução do seed:', error);
  } finally {
    await client.end();
  }
}

main();