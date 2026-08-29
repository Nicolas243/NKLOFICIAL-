/**
 * Seed script: lê banco-cordas.js + links-afiliados.js do legado
 * e insere no strings_catalog via Drizzle.
 *
 * Uso: npx tsx src/scripts/seed-catalog.ts
 */
import 'dotenv/config'
import path from 'path'
import fs from 'fs'
import vm from 'vm'
import { pathToFileURL } from 'url'
import { db } from '../db'
import { stringsCatalog } from '../db/schema'

// ---- Carrega arrays legados via sandbox VM -----
function loadLegacyModule<T>(filePath: string, varName: string): T {
  const raw = fs.readFileSync(filePath, 'utf8')
  const sandbox: Record<string, unknown> = { console, globalThis: {}, module: { exports: {} } }
  vm.createContext(sandbox)
  new vm.Script(raw + `; globalThis.__EXTRACTED__ = ${varName};`).runInContext(sandbox)
  const extracted = (sandbox as { globalThis: { __EXTRACTED__?: T } }).globalThis.__EXTRACTED__
  if (!extracted) throw new Error(`Failed to extract ${varName} from ${filePath}`)
  return extracted
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CordaRecord = Record<string, any>

export function loadAndMapRows() {
  const baseDir = path.resolve(process.cwd(), 'AntigoNKL')

  const cordas: CordaRecord[] = loadLegacyModule(path.join(baseDir, 'banco-cordas.js'), 'db')
  const links: Record<string, Record<string, string>> = loadLegacyModule(
    path.join(baseDir, 'links-afiliados.js'),
    'linksAfiliados'
  )

  return cordas.map((c) => {
    const l = links[c.nome] ?? {}
    return {
      name: c.nome,
      projection: c.projecao ?? '',
      soundColor: c.cor ?? '',
      coreMaterial: c.nucleo ?? '',
      priceMin: String(c.preco_min ?? 0),
      priceMax: String(c.preco_max ?? 0),
      realPrice: String(c.preco_min ?? 0),
      responseSpeed: c.resposta ?? '',
      environment: c.ambiente ?? '',
      qualityLevel: c.qualidade ?? '',
      communityScore: String(c.nota ?? '0'),
      durability: c.durabilidade ?? '',
      climateSensitivity: c.clima ?? '',
      coating: c.revestimento ?? '',
      fixation: c.fixacao ?? '',
      arcTolerance: c.tolerancia ?? '',
      affiliateLinks: l && Object.keys(l).length > 0 ? l : null,
    }
  })
}

async function main() {
  const rows = loadAndMapRows()

  console.log(`Inserindo ${rows.length} cordas no strings_catalog...`)
  for (const row of rows) {
    await db.insert(stringsCatalog).values(row).onConflictDoUpdate({
      target: stringsCatalog.name,
      set: row,
    })
  }
  console.log('Seed concluido com sucesso!')
}

// Executa apenas quando invocado diretamente (não quando importado como módulo)
const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (invokedDirectly) {
  main().catch((err) => {
    console.error('Falha no seed:', err)
    process.exit(1)
  })
}