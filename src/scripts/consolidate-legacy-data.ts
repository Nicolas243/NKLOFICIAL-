/**
 * ETL — Consolidação do catálogo legado (AntigoNKL) para o Supabase.
 *
 * ORIGEM: AntigoNKL/banco-cordas.js, links-afiliados.js, links-ver-mais.js, links-*.txt
 * CORRELAÇÃO: slug normalization (lowercase, sem acentos/apóstrofos) — nunca por índice.
 * DESTINO: strings_catalog — UPSERT idempotente por name UNIQUE.
 * Execução: npx tsx src/scripts/consolidate-legacy-data.ts
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import dotenv from 'dotenv'

for (const envPath of ['.env.local', '.env']) {
  if (existsSync(resolve(process.cwd(), envPath))) {
    dotenv.config({ path: resolve(process.cwd(), envPath), override: false })
  }
}

interface LegacyString {
  nome: string
  projecao: string
  cor: string
  nucleo: string
  preco_min: number
  preco_max: number
  resposta: string
  ambiente: string
  qualidade: string
  nota: string
  durabilidade: string
  clima: string
  revestimento: string
  fixacao: string
  tolerancia: string
}

interface ConsolidatedRow {
  name: string
  projection: string
  soundColor: string
  coreMaterial: string
  priceMin: string
  priceMax: string
  realPrice: string
  responseSpeed: string | null
  environment: string | null
  qualityLevel: string
  communityScore: string
  durability: string | null
  climateSensitivity: string | null
  coating: string | null
  fixation: string | null
  arcTolerance: string | null
  affiliateLinks: Record<string, string>
}

function slugify(input: string): string {
  return input
    .replace(/['’`´]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function averagePrice(minimum: number | null | undefined, maximum: number | null | undefined): string {
  const values = [minimum, maximum].filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0)
  if (values.length === 0) return ''
  return (values.reduce((total, value) => total + value, 0) / values.length).toFixed(2)
}

function parseBankObjects(raw: string): LegacyString[] {
  const chunks = raw.match(/\{[^{}]*\}/g) ?? []
  const parsed: LegacyString[] = []
  for (const chunk of chunks) {
    try {
      parsed.push(JSON.parse(chunk) as LegacyString)
    } catch {
      console.warn(`[etl] Objeto ilegível ignorado: ${chunk.slice(0, 60)}…`)
    }
  }
  return parsed
}

function parseNamedObjectMap(raw: string): Map<string, Record<string, string>> {
  const out = new Map<string, Record<string, string>>()
  const entryRe = /"((?:[^"\\]|\\.)+)"\s*:\s*\{([^}]*)\}/g
  const fieldRe = /([A-Za-z_]\w*)\s*:\s*"((?:[^"\\]|\\.)*)"/g
  let entry: RegExpExecArray | null
  while ((entry = entryRe.exec(raw)) !== null) {
    const name = entry[1].trim()
    const fields: Record<string, string> = {}
    let field: RegExpExecArray | null
    while ((field = fieldRe.exec(entry[2])) !== null) {
      fields[field[1].toLowerCase()] = field[2]
    }
    out.set(name, fields)
  }
  return out
}

function parseNamedStringMap(raw: string): Map<string, string> {
  const out = new Map<string, string>()
  const re = /"((?:[^"\\]|\\.)+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(raw)) !== null) out.set(m[1].trim(), m[2])
  return out
}

function readUrlFile(path: string): string[] {
  if (!existsSync(path)) return []
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith('http'))
}

function urlToSlug(url: string): string | null {
  let decoded = url
  try { decoded = decodeURIComponent(url) } catch { /* mantém original */ }
  const patterns = [
    /[?&]k=([^&]+)/,
    /[?&]_nkw=([^&]+)/,
    /mercadolivre\.com\.br\/([^#?]+)/,
    /[?&]keyword=([^&]+)/,
  ]
  for (const re of patterns) {
    const m = decoded.match(re)
    if (m) return slugify(m[1].replace(/\*\*/g, ' ').replace(/\+/g, ' '))
  }
  return null
}

function readTxtSlugs(name: string): { slug: string | null; url: string }[] {
  return readUrlFile(resolve(process.cwd(), 'AntigoNKL', `${name}.txt`)).map((url) => ({
    slug: urlToSlug(url),
    url,
  }))
}

const PLATFORM_KEYS = ['amazon', 'amazon_com', 'shopee', 'ebay', 'mercado_livre', 'ver_mais'] as const

function buildMarketplaceSearchLinks(productName: string): Record<string, string> {
  const searchTerm = encodeURIComponent(`corda violino ${productName}`)
  const internationalTerm = encodeURIComponent(`${productName} violin strings`)
  return {
    mercado_livre: `https://lista.mercadolivre.com.br/${searchTerm}`,
    shopee: `https://shopee.com.br/search?keyword=${searchTerm}`,
    ebay: `https://www.ebay.com/sch/i.html?_nkw=${internationalTerm}`,
    amazon: `https://www.amazon.com.br/s?k=${internationalTerm}`,
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('[etl] DATABASE_URL ausente. Verifique .env.local/.env')
    process.exit(1)
  }

  // ── 1. EXTRAÇÃO ──────────────────────────────────────────────────────────
  const legacyRoot = resolve(process.cwd(), 'AntigoNKL')
  const bank = parseBankObjects(readFileSync(resolve(legacyRoot, 'banco-cordas.js'), 'utf8'))
  const affiliateMap = parseNamedObjectMap(readFileSync(resolve(legacyRoot, 'links-afiliados.js'), 'utf8'))
  const verMaisMap = parseNamedStringMap(readFileSync(resolve(legacyRoot, 'links-ver-mais.js'), 'utf8'))

  const txtSources = ['links-amz-br', 'links-amz-com', 'links-ebay', 'links-ml', 'links-sp']
  const txtEntries = txtSources.flatMap((name) => readTxtSlugs(name))

  console.log(`[etl] Origem: ${bank.length} cordas | ${affiliateMap.size} afiliados | ${verMaisMap.size} ver-mais | ${txtEntries.length} URLs`)

  // ── 2. TRANSFORMAÇÃO + CORRELAÇÃO (Match Engine por slug) ───────────────
  const slugIndex = new Map<string, number>()
  bank.forEach((entry, idx) => {
    const slug = slugify(entry.nome)
    if (!slugIndex.has(slug)) slugIndex.set(slug, idx)
  })

  const linksBySlug = new Map<string, Record<string, string>>()
  let unmatchedUrls = 0
  for (const { slug, url } of txtEntries) {
    if (!slug) { unmatchedUrls++; continue }
    let bucket = linksBySlug.get(slug)
    if (!bucket) {
      bucket = {}
      linksBySlug.set(slug, bucket)
    }
    let platform: string | null = null
    if (/amazon\.com\.br/.test(url)) platform = 'amazon'
    else if (/amazon\.com/.test(url)) platform = 'amazon_com'
    else if (/ebay\./.test(url)) platform = 'ebay'
    else if (/mercadolivre\./.test(url)) platform = 'mercado_livre'
    else if (/shopee\./.test(url)) platform = 'shopee'
    if (!platform) { unmatchedUrls++; continue }
    if (!bucket[platform]) bucket[platform] = url
  }

  // Passada 2 — prefix matching para slugs sem match exato (nomes longos legados).
  // Segurança: só associa quando existe EXATAMENTE 1 candidato (evita falsos positivos).
  let prefixMatched = 0
  const ambiguous: string[] = []
  for (const [urlSlug, bucket] of linksBySlug) {
    if (slugIndex.has(urlSlug)) continue
    const candidates = new Set<string>()
    for (const bankSlug of slugIndex.keys()) {
      if (bankSlug.startsWith(urlSlug) || urlSlug.startsWith(bankSlug)) candidates.add(bankSlug)
    }
    if (candidates.size === 1) {
      const target = [...candidates][0]
      const existing = linksBySlug.get(target) ?? {}
      for (const [k, v] of Object.entries(bucket)) {
        if (!existing[k]) existing[k] = v
      }
      linksBySlug.set(target, existing)
      prefixMatched++
    } else if (candidates.size > 1) {
      ambiguous.push(urlSlug)
    }
  }
  if (prefixMatched || ambiguous.length) {
    console.log(`[etl] Prefix matching: ${prefixMatched} URLs associadas | ${ambiguous.length} ambíguas descartadas`)
    if (ambiguous.length) console.warn(`[etl] Ambíguas: ${ambiguous.slice(0, 6).join(', ')}${ambiguous.length > 6 ? '…' : ''}`)
  }

  const rows: ConsolidatedRow[] = []
  const missingLinks: string[] = []
  for (const entry of bank) {
    if (!entry?.nome) continue
    const slug = slugify(entry.nome)
    const legacy = affiliateMap.get(entry.nome) ?? {}
    const verMais = verMaisMap.get(entry.nome) ?? ''

    const affiliateLinks: Record<string, string> = {}
    const assign = (key: string, value: string | undefined) => {
      if (value && value.trim() !== '') affiliateLinks[key] = value
    }
    assign('mercado_livre', legacy.ml)
    assign('shopee', legacy.shopee)
    assign('amazon', legacy.amazon)
    assign('ebay', legacy.ebay)
    assign('ver_mais', verMais)

    // Enriquecimento: TXTs preenchem plataformas ausentes no JS legado
    const txtBucket = linksBySlug.get(slug) ?? {}
    for (const platform of PLATFORM_KEYS) {
      if (!affiliateLinks[platform] && txtBucket[platform]) {
        affiliateLinks[platform] = txtBucket[platform]
      }
    }
    if (Object.keys(affiliateLinks).length === 0) {
      Object.assign(affiliateLinks, buildMarketplaceSearchLinks(entry.nome))
    }
    if (Object.keys(affiliateLinks).length === 0) missingLinks.push(entry.nome)

    rows.push({
      name: entry.nome,
      projection: entry.projecao || 'Não informado',
      soundColor: entry.cor || 'Não informado',
      coreMaterial: entry.nucleo || 'Não informado',
      priceMin: String(entry.preco_min ?? ''),
      priceMax: String(entry.preco_max ?? ''),
      realPrice: averagePrice(entry.preco_min, entry.preco_max),
      responseSpeed: entry.resposta || null,
      environment: entry.ambiente || null,
      qualityLevel: entry.qualidade || 'N/A',
      communityScore: entry.nota || '0.0',
      durability: entry.durabilidade || null,
      climateSensitivity: entry.clima || null,
      coating: entry.revestimento || null,
      fixation: entry.fixacao || null,
      arcTolerance: entry.tolerancia || null,
      affiliateLinks,
    })
  }

  const withAnyLink = rows.filter((r) => Object.keys(r.affiliateLinks).length > 0).length
  console.log(`[etl] Correlação: ${rows.length} prontos | ${withAnyLink} com link | ${missingLinks.length} sem links | ${unmatchedUrls} URLs sem slug`)
  if (missingLinks.length) console.warn(`[etl] Sem links: ${missingLinks.slice(0, 8).join(', ')}${missingLinks.length > 8 ? '…' : ''}`)

  // ── 3. LOAD — UPSERT transacional e idempotente por name UNIQUE ─────────
  const { db } = await import('../db')
  const { stringsCatalog } = await import('../db/schema')
  const { sql } = await import('drizzle-orm')

  const existing = new Set(
    (await db.select({ name: stringsCatalog.name }).from(stringsCatalog)).map((r) => r.name),
  )
  const toInsert = rows.filter((r) => !existing.has(r.name)).length
  const toUpdate = rows.length - toInsert
  console.log(`[etl] Plano: ${toInsert} inserts | ${toUpdate} updates (UPSERT por name)`)

  const CHUNK = 50
  let processed = 0
  await db.transaction(async (tx) => {
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK)
      await tx
        .insert(stringsCatalog)
        .values(chunk)
        .onConflictDoUpdate({
          target: stringsCatalog.name,
          set: {
            projection: sql`excluded.projection`,
            soundColor: sql`excluded.sound_color`,
            coreMaterial: sql`excluded.core_material`,
            priceMin: sql`excluded.price_min`,
            priceMax: sql`excluded.price_max`,
            realPrice: sql`excluded.real_price`,
            responseSpeed: sql`excluded.response_speed`,
            environment: sql`excluded.environment`,
            qualityLevel: sql`excluded.quality_level`,
            communityScore: sql`excluded.community_score`,
            durability: sql`excluded.durability`,
            climateSensitivity: sql`excluded.climate_sensitivity`,
            coating: sql`excluded.coating`,
            fixation: sql`excluded.fixation`,
            arcTolerance: sql`excluded.arc_tolerance`,
            affiliateLinks: sql`excluded.affiliate_links`,
            updatedAt: new Date(),
          },
        })
      processed += chunk.length
      console.log(`[etl] Upsert progresso: ${processed}/${rows.length}`)
    }
  })

  // ── 4. VALIDAÇÃO ─────────────────────────────────────────────────────────
  const [{ value: totalAfter }] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(stringsCatalog)

  console.log('──────────────────────────────────────────────')
  console.log(`[etl] OK Concluído. Iterados: ${rows.length} | Upserts aplicados: ${processed}`)
  console.log(`[etl] OK Total em strings_catalog: ${totalAfter}`)
  console.log(`[etl] OK Com links de afiliados: ${withAnyLink}/${rows.length}`)
  process.exit(0)
}

main().catch((err) => {
  console.error('[etl] FALHA FATAL:', err)
  process.exit(1)
})
