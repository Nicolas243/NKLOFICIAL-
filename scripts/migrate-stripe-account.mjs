import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
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

const AI_PRODUCT_NAME = 'IA na Prática NKL';
const REQUIRED_PRICES = [
  { envName: 'AI_SUBSCRIPTION_STRIPE_PRICE_ID', unitAmount: 3900, recurring: { interval: 'month' }, nickname: 'IA na Prática — Assinatura Mensal' },
  { envName: 'AI_ONE_TIME_STRIPE_PRICE_ID', unitAmount: 9900, recurring: null, nickname: 'IA na Prática — Acesso Completo Vitalício' },
  { envName: 'AI_VIP_STRIPE_PRICE_ID', unitAmount: 39700, recurring: null, nickname: 'IA na Prática — Passe Total Portal NKL' },
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

async function ensureProductAndPrices(stripe) {
  const products = await stripe.products.list({ limit: 50, active: true });
  let product = products.data.find((p) => p.name === AI_PRODUCT_NAME);
  let createdProduct = false;
  if (!product) {
    product = await stripe.products.create({
      name: AI_PRODUCT_NAME,
      description: 'Curso prático, laboratório de prompts e Estúdio IA do Portal NKL.',
    });
    createdProduct = true;
  }

  const prices = await stripe.prices.list({ product: product.id, limit: 50, active: true });
  const priceMap = {};
  for (const spec of REQUIRED_PRICES) {
    let price = prices.data.find((p) =>
      p.currency === 'brl'
      && p.unit_amount === spec.unitAmount
      && (spec.recurring ? p.recurring?.interval === spec.recurring.interval : !p.recurring),
    );
    let created = false;
    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        currency: 'brl',
        unit_amount: spec.unitAmount,
        nickname: spec.nickname,
        ...(spec.recurring ? { recurring: spec.recurring } : {}),
      });
      created = true;
    }
    priceMap[spec.envName] = { id: price.id, amount: spec.unitAmount, created };
  }

  return { productId: product.id, createdProduct, priceMap };
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

  const catalog = await ensureProductAndPrices(stripe);
  const coupons = await ensureCoupons(stripe);
  const webhook = await ensureWebhook(stripe, skipWebhook);

  console.log('=== Provisioned Catalog & Webhook ===');
  console.log(JSON.stringify({
    productId: catalog.productId,
    createdProduct: catalog.createdProduct,
    prices: catalog.priceMap,
    coupons,
    webhook: {
      id: webhook.id ?? null,
      created: Boolean(webhook.created),
      updated: Boolean(webhook.updated),
      skipped: Boolean(webhook.skipped),
      hasNewSecret: Boolean(webhook.secret),
    },
  }));

  if (syncVercelProd) {
    const varsToSync = [
      ['STRIPE_SECRET_KEY', secretKey],
      ...(publishableKey ? [['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', publishableKey]] : []),
      ['AI_SUBSCRIPTION_STRIPE_PRICE_ID', catalog.priceMap.AI_SUBSCRIPTION_STRIPE_PRICE_ID.id],
      ['AI_ONE_TIME_STRIPE_PRICE_ID', catalog.priceMap.AI_ONE_TIME_STRIPE_PRICE_ID.id],
      ['AI_VIP_STRIPE_PRICE_ID', catalog.priceMap.AI_VIP_STRIPE_PRICE_ID.id],
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
