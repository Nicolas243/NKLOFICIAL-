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

type LegacyRecord = Record<string, unknown>

function readLegacyString(record: LegacyRecord, key: string): string {
  const value = record[key]
  return typeof value === 'string' ? value : ''
}

function readLegacyNumber(record: LegacyRecord, key: string): number {
  return Number(record[key])
}

export function loadAndMapRows() {
  const baseDir = path.resolve(process.cwd(), 'AntigoNKL')

  const cordas: LegacyRecord[] = loadLegacyModule(path.join(baseDir, 'banco-cordas.js'), 'db')
  const links: Record<string, Record<string, string>> = loadLegacyModule(
    path.join(baseDir, 'links-afiliados.js'),
    'linksAfiliados'
  )

  return cordas.map((c) => {
    const name = readLegacyString(c, 'nome')
    const l = links[name] ?? {}
    const minimum = readLegacyNumber(c, 'preco_min')
    const maximum = readLegacyNumber(c, 'preco_max')
    const prices = [minimum, maximum].filter((value) => Number.isFinite(value) && value > 0)
    const searchTerm = encodeURIComponent(`corda violino ${name}`)
    const internationalTerm = encodeURIComponent(`${name} violin strings`)
    const fallbackLinks = {
      mercado_livre: `https://lista.mercadolivre.com.br/${searchTerm}`,
      shopee: `https://shopee.com.br/search?keyword=${searchTerm}`,
      ebay: `https://www.ebay.com/sch/i.html?_nkw=${internationalTerm}`,
      amazon: `https://www.amazon.com.br/s?k=${internationalTerm}`,
    }
    return {
      name,
      projection: readLegacyString(c, 'projecao'),
      soundColor: readLegacyString(c, 'cor'),
      coreMaterial: readLegacyString(c, 'nucleo'),
      priceMin: String(recordValueOrZero(c, 'preco_min')),
      priceMax: String(recordValueOrZero(c, 'preco_max')),
      realPrice: prices.length > 0
        ? (prices.reduce((total, value) => total + value, 0) / prices.length).toFixed(2)
        : null,
      responseSpeed: readLegacyString(c, 'resposta'),
      environment: readLegacyString(c, 'ambiente'),
      qualityLevel: readLegacyString(c, 'qualidade'),
      communityScore: String(recordValueOrZero(c, 'nota')),
      durability: readLegacyString(c, 'durabilidade'),
      climateSensitivity: readLegacyString(c, 'clima'),
      coating: readLegacyString(c, 'revestimento'),
      fixation: readLegacyString(c, 'fixacao'),
      arcTolerance: readLegacyString(c, 'tolerancia'),
      affiliateLinks: l && Object.keys(l).length > 0 ? l : fallbackLinks,
    }

    function recordValueOrZero(record: LegacyRecord, key: string): string | number {
      const value = record[key]
      return value === undefined || value === null ? 0 : String(value)
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