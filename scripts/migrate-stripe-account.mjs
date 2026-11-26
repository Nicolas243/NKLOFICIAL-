import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import Stripe from 'stripe';

const WEBHOOK_URL = 'https://nkloficial.com.br/api/payments/stripe-webhook';
const WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'charge.refunded',
  'charge.dispute.created',
  'radar.early_fraud_warning.created',
];

const LANGUAGE_PRODUCTS = [
  { key: 'ebook-ingles', name: 'E-book Inglês para ganhar dinheiro | Portal NKL', description: '100 lições coloridas, método de IA por faixa etária e planner de 90 dias em inglês.' },
  { key: 'ebook-italiano', name: 'E-book Italiano para ganhar possibilidades | Portal NKL', description: '100 lições coloridas, guia de IA por idade e planner de 90 dias em italiano.' },
  { key: 'ebook-frances', name: 'E-book Francês para ganhar possibilidades | Portal NKL', description: '100 lições coloridas, guia de IA por idade e planner de 90 dias em francês.' },
  { key: 'ebook-alemao', name: 'E-book Alemão para ganhar possibilidades | Portal NKL', description: '100 lições coloridas, guia de IA por idade e planner de 90 dias em alemão.' },
  { key: 'ebook-espanhol', name: 'E-book Espanhol para ganhar possibilidades | Portal NKL', description: '100 lições coloridas, guia de IA por idade e planner de 90 dias em espanhol.' },
  { key: 'ebook-mandarim', name: 'E-book Mandarim para ganhar possibilidades | Portal NKL', description: '100 lições com pinyin, guia de IA por idade e planner de 90 dias em mandarim.' },
];

export const STRIPE_CATALOG_SPEC = [
  {
    key: 'ia-na-pratica',
    name: 'IA na Prática NKL',
    description: 'Curso prático, laboratório de prompts e Estúdio IA do Portal NKL.',
    prices: [
      { priceKey: 'ia:subscription', envName: 'AI_SUBSCRIPTION_STRIPE_PRICE_ID', unitAmount: 3900, recurring: { interval: 'month' }, nickname: 'IA na Prática — Assinatura Mensal' },
      { priceKey: 'ia:one_time', envName: 'AI_ONE_TIME_STRIPE_PRICE_ID', unitAmount: 9900, recurring: null, nickname: 'IA na Prática — Acesso Completo Vitalício' },
      { priceKey: 'ia:vip', envName: 'AI_VIP_STRIPE_PRICE_ID', unitAmount: 39700, recurring: null, nickname: 'IA na Prática — Passe Total Portal NKL' },
    ],
  },
  {
    key: 'guia-renda-extra',
    name: 'Guia Essencial Renda Extra 2027 | Portal NKL',
    description: 'Guias práticos e planilhas Raio-X Financeiro para renda extra online.',
    prices: [
      { priceKey: 'renda-extra:essential', unitAmount: 1900, recurring: null, nickname: 'Guia Renda Extra — Edição Essencial (1 PDF)' },
      { priceKey: 'renda-extra:complete', unitAmount: 3900, recurring: null, nickname: 'Guia Renda Extra — Pacote Completo (5 arquivos)' },
      { priceKey: 'renda-extra:vip', unitAmount: 24700, recurring: null, nickname: 'Acervo Total NKL (11 Materiais: Renda Extra + 6 Idiomas)' },
    ],
  },
  {
    key: 'guias-assinatura',
    name: 'Guias para Liberdade Financeira NKL',
    description: 'Assinatura mensal contínua dos guias e atualizações financeiras NKL.',
    prices: [
      { priceKey: 'guias-assinatura:monthly', unitAmount: 1900, recurring: { interval: 'month' }, nickname: 'Guias para Liberdade Financeira — Mensal' },
    ],
  },
  {
    key: 'bussola-negocios',
    name: 'Bússola de Negócios NKL',
    description: 'Diagnóstico interativo e roteiros de execução para o negócio dos seus sonhos.',
    prices: [
      { priceKey: 'bussola:essential', unitAmount: 1900, recurring: null, nickname: 'Bússola de Negócios — Edição Essencial' },
      { priceKey: 'bussola:complete', unitAmount: 3900, recurring: null, nickname: 'Bússola de Negócios — Pacote Completo + App' },
      { priceKey: 'bussola:vip', unitAmount: 24700, recurring: null, nickname: 'Bússola + Acervo Total NKL (11 Materiais)' },
    ],
  },
  ...LANGUAGE_PRODUCTS.map((lang) => ({
    key: lang.key,
    name: lang.name,
    description: lang.description,
    prices: [
      { priceKey: `${lang.key}:essential`, unitAmount: 2700, recurring: null, nickname: `${lang.name} — Só E-book` },
      { priceKey: `${lang.key}:complete`, unitAmount: 4700, recurring: null, nickname: `${lang.name} — Pacote Completo + IA & Planner` },
      { priceKey: `${lang.key}:vip`, unitAmount: 29700, recurring: null, nickname: `${lang.name} — Passaporte 6 Idiomas + Renda Extra` },
    ],
  })),
  {
    key: 'anuncie-portal',
    name: 'Anuncie no Portal NKL (Mural de Parceiros)',
    description: 'Reservas mensais de cotas na faixa publicitária editorial do Portal NKL.',
    prices: [
      { priceKey: 'anuncie:1-cota', unitAmount: 1990, recurring: { interval: 'month' }, nickname: 'Anúncio Portal NKL — 1 Cota Mensal' },
      { priceKey: 'anuncie:3-cotas', unitAmount: 5970, recurring: { interval: 'month' }, nickname: 'Anúncio Portal NKL — 3 Cotas Combinadas' },
      { priceKey: 'anuncie:10-cotas', unitAmount: 19900, recurring: { interval: 'month' }, nickname: 'Anúncio Portal NKL — Domínio Total (10 Cotas)' },
    ],
  },
  {
    key: 'luthier-premium',
    name: 'Plano Premium para Luthiers Portal NKL',
    description: 'Vitrine destacada, portfólio ilimitado e métricas de conversão para luthiers.',
    prices: [
      { priceKey: 'luthier:monthly', unitAmount: 4990, recurring: { interval: 'month' }, nickname: 'Plano Premium Luthier — Mensal' },
      { priceKey: 'luthier:annual', unitAmount: 47900, recurring: { interval: 'year' }, nickname: 'Mestre Luthier — Anual (20% OFF)' },
    ],
  },
];

const REQUIRED_COUPONS = [
  { id: 'nkl_idioma_30', name: 'Portal NKL · 2º Idioma (30% OFF)', percent_off: 30, duration: 'once' },
  { id: 'nkl_idioma_50', name: 'Portal NKL · 3º+ Idioma (50% OFF)', percent_off: 50, duration: 'once' },
];

export function parseEnvFile(rawText) {
  const out = {};
  for (const line of rawText.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

export function assertLiveProductionSafety({ secretKey, publishableKey, account, allowTestInProd }) {
  if (allowTestInProd) return;
  if (!secretKey || !secretKey.startsWith('sk_live_')) {
    throw new Error('Abortado: --sync-vercel-prod exige STRIPE_SECRET_KEY live (sk_live_...). Use --allow-test-in-prod somente para testes explícitos.');
  }
  if (publishableKey && !publishableKey.startsWith('pk_live_')) {
    throw new Error('Abortado: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY precisa iniciar com pk_live_ ao sincronizar produção.');
  }
  if (!account?.charges_enabled) {
    throw new Error(`Abortado: a conta Stripe ${account?.id ?? 'desconhecida'} ainda não está com charges_enabled=true.`);
  }
}

function getArgValue(args, flag, fallback) {
  const idx = args.indexOf(flag);
  if (idx >= 0 && args[idx + 1] && !args[idx + 1].startsWith('--')) {
    return args[idx + 1];
  }
  return fallback;
}

export function upsertEnvLines(rawText, updates) {
  const remaining = new Map(Object.entries(updates));
  const lines = rawText.split(/\r?\n/u);
  const out = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const key = trimmed.slice(0, trimmed.indexOf('=')).trim();
      if (remaining.has(key)) {
        out.push(`${key}=${remaining.get(key)}`);
        remaining.delete(key);
        continue;
      }
    }
    if (trimmed.startsWith('# 4. Stripe') && remaining.size > 0) {
      for (const [key, val] of remaining.entries()) {
        out.push(`${key}=${val}`);
      }
      remaining.clear();
      out.push('');
    }
    out.push(line);
  }

  for (const [key, val] of remaining.entries()) {
    out.push(`${key}=${val}`);
  }
  return out.join('\n');
}

function upsertEnvLocalVars(envLocalPath, updates) {
  const raw = existsSync(envLocalPath) ? readFileSync(envLocalPath, 'utf8') : '';
  writeFileSync(envLocalPath, upsertEnvLines(raw, updates), 'utf8');
}

function upsertVercelProductionEnv(name, value) {
  const vercelCmd = process.platform === 'win32' ? 'cmd.exe' : 'vercel';
  const vercelArgs = process.platform === 'win32'
    ? ['/d', '/s', '/c', 'vercel', 'env', 'add', name, 'production', '--force']
    : ['env', 'add', name, 'production', '--force'];

  execFileSync(vercelCmd, vercelArgs, {
    input: value,
    stdio: ['pipe', 'inherit', 'inherit'],
    encoding: 'utf8',
  });
}

async function listAllActiveProducts(stripe) {
  const all = [];
  for await (const prod of stripe.products.list({ limit: 100, active: true })) {
    all.push(prod);
  }
  return all;
}

async function ensureFullCatalogAndPrices(stripe) {
  const existingProducts = await listAllActiveProducts(stripe);
  const envPriceMap = {};
  const catalogSummary = [];

  for (const spec of STRIPE_CATALOG_SPEC) {
    let product = existingProducts.find((p) =>
      p.metadata?.portal_catalog_key === spec.key
      || p.name === spec.name,
    );
    let createdProduct = false;

    if (!product) {
      product = await stripe.products.create({
        name: spec.name,
        description: spec.description,
        metadata: { portal_catalog_key: spec.key },
      });
      existingProducts.push(product);
      createdProduct = true;
    } else if (product.metadata?.portal_catalog_key !== spec.key) {
      product = await stripe.products.update(product.id, {
        metadata: { ...(product.metadata ?? {}), portal_catalog_key: spec.key },
      });
    }

    const prices = await stripe.prices.list({ product: product.id, limit: 100, active: true });
    const provisionedPrices = [];

    for (const priceSpec of spec.prices) {
      let price = prices.data.find((p) =>
        p.metadata?.portal_price_key === priceSpec.priceKey
        || (
          p.currency === 'brl'
          && p.unit_amount === priceSpec.unitAmount
          && (priceSpec.recurring
            ? p.recurring?.interval === priceSpec.recurring.interval
            : !p.recurring)
        ),
      );
      let createdPrice = false;

      if (!price) {
        price = await stripe.prices.create({
          product: product.id,
          currency: 'brl',
          unit_amount: priceSpec.unitAmount,
          nickname: priceSpec.nickname,
          metadata: { portal_price_key: priceSpec.priceKey },
          ...(priceSpec.recurring ? { recurring: priceSpec.recurring } : {}),
        });
        prices.data.push(price);
        createdPrice = true;
      }

      if (priceSpec.envName) {
        envPriceMap[priceSpec.envName] = { id: price.id, amount: priceSpec.unitAmount, created: createdPrice };
      }
      provisionedPrices.push({
        key: priceSpec.priceKey,
        id: price.id,
        unitAmount: priceSpec.unitAmount,
        interval: priceSpec.recurring?.interval ?? 'one_time',
        created: createdPrice,
      });
    }

    catalogSummary.push({
      key: spec.key,
      productId: product.id,
      createdProduct,
      prices: provisionedPrices,
    });
  }

  return { envPriceMap, catalogSummary };
}

async function ensureCoupons(stripe) {
  const results = [];
  for (const spec of REQUIRED_COUPONS) {
    try {
      const existing = await stripe.coupons.retrieve(spec.id);
      results.push({ id: existing.id, percent_off: existing.percent_off, created: false });
    } catch {
      const created = await stripe.coupons.create({
        id: spec.id,
        name: spec.name,
        percent_off: spec.percent_off,
        duration: spec.duration,
      });
      results.push({ id: created.id, percent_off: created.percent_off, created: true });
    }
  }
  return results;
}

async function ensureWebhook(stripe, skipWebhook) {
  if (skipWebhook) return { skipped: true };
  const endpoints = await stripe.webhookEndpoints.list({ limit: 20 });
  const existing = endpoints.data.find((w) => w.url === WEBHOOK_URL && w.status === 'enabled');
  if (existing) {
    const missingEvents = WEBHOOK_EVENTS.filter((evt) => !existing.enabled_events.includes(evt));
    if (missingEvents.length > 0 && !existing.enabled_events.includes('*')) {
      await stripe.webhookEndpoints.update(existing.id, { enabled_events: WEBHOOK_EVENTS });
      return { id: existing.id, created: false, updated: true, secret: null };
    }
    return { id: existing.id, created: false, updated: false, secret: null };
  }

  const created = await stripe.webhookEndpoints.create({
    url: WEBHOOK_URL,
    enabled_events: WEBHOOK_EVENTS,
    description: 'Portal NKL Webhook Oficial',
  });
  return { id: created.id, created: true, updated: false, secret: created.secret ?? null };
}

export async function main() {
  const args = process.argv.slice(2);
  const keyEnv = getArgValue(args, '--key-env', 'STRIPE_SECRET_KEY');
  const pubEnv = getArgValue(args, '--pub-env', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
  const syncVercelProd = args.includes('--sync-vercel-prod');
  const writeEnvLocal = args.includes('--write-env-local');
  const allowTestInProd = args.includes('--allow-test-in-prod');
  const skipWebhook = args.includes('--skip-webhook');

  const envLocalPath = path.join(process.cwd(), '.env.local');
  const fileEnv = existsSync(envLocalPath) ? parseEnvFile(readFileSync(envLocalPath, 'utf8')) : {};
  const mergedEnv = { ...fileEnv, ...process.env };

  const secretKey = mergedEnv[keyEnv]?.trim();
  const publishableKey = mergedEnv[pubEnv]?.trim();
  if (!secretKey) {
    throw new Error(`Chave ${keyEnv} ausente no ambiente ou em .env.local.`);
  }

  const stripe = new Stripe(secretKey);
  const account = await stripe.accounts.retrieve();

  console.log('=== Stripe Account Target ===');
  console.log(JSON.stringify({
    id: account.id,
    displayName: account.settings?.dashboard?.display_name ?? null,
    businessName: account.business_profile?.name ?? null,
    mode: secretKey.startsWith('sk_live_') ? 'LIVE' : secretKey.startsWith('sk_test_') ? 'TEST' : 'OTHER',
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    country: account.country,
  }));

  if (syncVercelProd) {
    assertLiveProductionSafety({ secretKey, publishableKey, account, allowTestInProd });
  }

  const catalog = await ensureFullCatalogAndPrices(stripe);
  const coupons = await ensureCoupons(stripe);
  const webhook = await ensureWebhook(stripe, skipWebhook);

  const totalPrices = catalog.catalogSummary.reduce((acc, item) => acc + item.prices.length, 0);
  const createdProductsCount = catalog.catalogSummary.filter((item) => item.createdProduct).length;
  const createdPricesCount = catalog.catalogSummary.reduce(
    (acc, item) => acc + item.prices.filter((p) => p.created).length,
    0,
  );

  console.log('=== Provisioned Catalog & Webhook ===');
  console.log(JSON.stringify({
    productsTotal: catalog.catalogSummary.length,
    pricesTotal: totalPrices,
    createdProductsCount,
    createdPricesCount,
    envPrices: catalog.envPriceMap,
    coupons,
    webhook: {
      id: webhook.id ?? null,
      created: Boolean(webhook.created),
      updated: Boolean(webhook.updated),
      skipped: Boolean(webhook.skipped),
      hasNewSecret: Boolean(webhook.secret),
    },
    catalog: catalog.catalogSummary.map((c) => ({
      key: c.key,
      productId: c.productId,
      createdProduct: c.createdProduct,
      pricesCount: c.prices.length,
      createdPrices: c.prices.filter((p) => p.created).length,
    })),
  }, null, 2));

  if (writeEnvLocal) {
    const localUpdates = {
      AI_SUBSCRIPTION_STRIPE_PRICE_ID: catalog.envPriceMap.AI_SUBSCRIPTION_STRIPE_PRICE_ID.id,
      AI_ONE_TIME_STRIPE_PRICE_ID: catalog.envPriceMap.AI_ONE_TIME_STRIPE_PRICE_ID.id,
      AI_VIP_STRIPE_PRICE_ID: catalog.envPriceMap.AI_VIP_STRIPE_PRICE_ID.id,
      ...(webhook.secret ? { STRIPE_WEBHOOK_SECRET: webhook.secret } : {}),
    };
    upsertEnvLocalVars(envLocalPath, localUpdates);
    console.log(`[ENV.LOCAL] persisted ${Object.keys(localUpdates).join(', ')}`);
  }

  if (syncVercelProd) {
    const varsToSync = [
      ['STRIPE_SECRET_KEY', secretKey],
      ...(publishableKey ? [['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', publishableKey]] : []),
      ['AI_SUBSCRIPTION_STRIPE_PRICE_ID', catalog.envPriceMap.AI_SUBSCRIPTION_STRIPE_PRICE_ID.id],
      ['AI_ONE_TIME_STRIPE_PRICE_ID', catalog.envPriceMap.AI_ONE_TIME_STRIPE_PRICE_ID.id],
      ['AI_VIP_STRIPE_PRICE_ID', catalog.envPriceMap.AI_VIP_STRIPE_PRICE_ID.id],
      ...(webhook.secret ? [['STRIPE_WEBHOOK_SECRET', webhook.secret]] : []),
    ];

    for (const [name, value] of varsToSync) {
      upsertVercelProductionEnv(name, value);
      console.log(`[VERCEL] synced ${name} -> production`);
    }
    if (!webhook.secret) {
      console.log('[VERCEL] Webhook reutilizado: mantenha ou atualize STRIPE_WEBHOOK_SECRET manualmente se o endpoint mudou.');
    }
  }
}

const isEntrypoint = Boolean(process.argv[1])
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isEntrypoint) {
  main().catch((error) => {
    console.error('[STRIPE_MIGRATE] Erro:', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
