/**
 * Emissor de SQL para o seed do strings_catalog.
 * Gera um dump idempotente (INSERT ... ON CONFLICT DO UPDATE) a partir
 * dos dados legados, permitindo popular o Supabase sem conexão direta
 * via DATABASE_URL (ex.: executando o SQL pelo dashboard/MCP).
 *
 * Uso: npx tsx src/scripts/seed-catalog-sql.ts
 * Saída: seed-output.sql (raiz do projeto)
 */
import fs from 'fs'
import path from 'path'
import { loadAndMapRows } from './seed-catalog'

type Row = Record<string, unknown>

function toSnake(key: string): string {
  return key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
}

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'object') {
    // jsonb — serializa e escapa aspas simples
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`
  }
  return `'${String(value).replace(/'/g, "''")}'`
}

function main() {
  const rows = loadAndMapRows() as Row[]
  if (rows.length === 0) throw new Error('Nenhuma corda mapeada — verifique os arquivos legados.')

  const columns = Object.keys(rows[0]).map(toSnake)
  const colList = columns.join(', ')

  const statements = rows.map((row) => {
    const values = Object.keys(row).map((k) => sqlLiteral(row[k])).join(', ')
    const updates = columns.map((c) => `${c} = excluded.${c}`).join(', ')
    return `insert into strings_catalog (${colList}) values (${values}) on conflict (name) do update set ${updates};`
  })

  const out = [
    '-- Gerado por src/scripts/seed-catalog-sql.ts — NÃO editar manualmente.',
    `-- Fonte: AntigoNKL/banco-cordas.js + links-afiliados.js (${rows.length} registros)`,
    '',
    ...statements,
    '',
  ].join('\n')

  const outPath = path.resolve(process.cwd(), 'seed-output.sql')
  fs.writeFileSync(outPath, out, 'utf8')
  console.log(`SQL gerado: ${outPath} (${rows.length} statements)`)
}

main()