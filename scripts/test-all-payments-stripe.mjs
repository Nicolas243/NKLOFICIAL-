import assert from 'node:assert/strict';
import crypto, { randomBytes, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { and, eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import Stripe from 'stripe';

import * as schema from '../src/db/schema';
import { PAID_PRODUCT_SLUGS } from '../src/config/products';
import { calculateClassPricing } from '../src/lib/pricing';
import { createCheckoutSession } from '../src/lib/stripe/checkout';
import { buildPremiumCheckoutParams } from '../src/lib/stripe/premium-booking';

const E2E_PORT = 3199;
const BASE_URL = `http://127.0.0.1:${E2E_PORT}`;
const SANDBOX_ACCOUNT_ID = 'acct_1UbswFItNBn1daZu';
const SANDBOX_AI_PRICES = {
  one_time: 'price_1Ufv9QItNBn1daZusSCzOXNy',
  subscription: 'price_1Ufv9QItNBn1daZun1UZNe6o',
  vip: 'price_1Ufv9RItNBn1daZuoY47Xlep',
};

function loadDotenvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return {};
  return dotenv.parse(readFileSync(envPath, 'utf8'));
}

function generateValidCpf(seedInput) {
  const base = Array.from({ length: 9 }, (_, i) => ((seedInput >> (i * 3)) + i + 1) % 10);
  if (new Set(base).size === 1) base[8] = (base[8] + 1) % 10;
  const calcDigit = (digits) => {
    const sum = digits.reduce((acc, d, idx) => acc + d * (digits.length + 1 - idx), 0);
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };
  const d1 = calcDigit(base);
  const d2 = calcDigit([...base, d1]);
  return [...base, d1, d2].join('');
}

async function waitForServer(url, timeoutMs = 45000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // Server still booting.
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Timed out waiting for local Next.js test server at ${url}`);
}

async function signInUserCookieHeader(supabaseUrl, supabaseAnonKey, email, password) {
  const cookieJar = new Map();
  const client = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return Array.from(cookieJar.entries()).map(([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          if (value === '' || options?.maxAge === 0) {
            cookieJar.delete(name);
          } else {
            cookieJar.set(name, value);
          }
        }
      },
    },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`Failed to sign in temporary E2E user ${email}: ${error?.message ?? 'no session'}`);
  }
  return Array.from(cookieJar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

function assertSandboxSessionUrl(url, label) {
  assert.ok(url && typeof url === 'string', `${label}: checkout URL missing`);
  assert.ok(url.startsWith('https://checkout.stripe.com/'), `${label}: unexpected checkout host`);
  assert.ok(!url.includes('cs_live_'), `${label}: ABORTING — detected cs_live_ URL!`);
  const match = /\/pay\/(cs_test_[A-Za-z0-9]+)/.exec(url);
  assert.ok(match?.[1], `${label}: checkout URL does not contain cs_test_ session ID`);
  return match[1];
}

async function main() {
  const fileEnv = loadDotenvLocal();
  const env = { ...fileEnv, ...process.env };

  const testSecretKey = env.TEST_BACKUP_STRIPE_SECRET_KEY?.trim();
  const testPublishableKey = env.TEST_BACKUP_NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  const databaseUrl = env.DATABASE_URL?.trim();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const dailyApiKey = env.DAILY_API_KEY?.trim();

  assert.ok(testSecretKey?.startsWith('sk_test_'), 'TEST_BACKUP_STRIPE_SECRET_KEY (sk_test_) required');
  assert.ok(testPublishableKey?.startsWith('pk_test_'), 'TEST_BACKUP_NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_test_) required');
  assert.ok(databaseUrl, 'DATABASE_URL required');
  assert.ok(supabaseUrl && supabaseAnonKey && serviceRoleKey, 'Supabase credentials required');
  assert.ok(dailyApiKey, 'DAILY_API_KEY required');

  const ephemeralWebhookSecret = `whsec_test_e2e_${randomBytes(16).toString('hex')}`;
  const ephemeralGatewaySecret = randomBytes(24).toString('hex');
  const guestEncryptionKey = env.GUEST_CHECKOUT_ENCRYPTION_KEY?.trim() || randomBytes(32).toString('hex');

  process.env.STRIPE_SECRET_KEY = testSecretKey;
  process.env.STRIPE_API_KEY = testSecretKey;
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = testPublishableKey;
  process.env.GUEST_CHECKOUT_ENCRYPTION_KEY = guestEncryptionKey;

  const stripe = new Stripe(testSecretKey);
  const account = await stripe.accounts.retrieve();
  assert.equal(account.id, SANDBOX_ACCOUNT_ID, `Expected sandbox account ${SANDBOX_ACCOUNT_ID}, got ${account.id}`);
  console.log(`=== 1. Stripe Sandbox Verified: ${account.id} (${account.settings?.dashboard?.display_name ?? 'NKL Test'}) ===`);

  assert.ok(existsSync(path.join(process.cwd(), '.next', 'BUILD_ID')), '.next build missing — run npm run verify first.');

  const sql = postgres(databaseUrl, { max: 3 });
  const db = drizzle(sql, { schema });
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const runId = randomBytes(4).toString('hex');
  const tempPassword = `NklTest!${runId}#99`;
  const createdAuthIds = [];
  const createdSubscriptionIds = [];
  const createdStripeProductIds = [];
  const createdEventIds = [];
  const createdPurchaseIds = [];
  const createdGuideSubIds = [];
  const createdCampaignIds = [];
  const createdBookingIds = [];
  let sandboxCustomerId = null;
  let serverProcess = null;
  let upstashMockServer = null;
  const serverLogs = [];

  try {
    upstashMockServer = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        res.setHeader('content-type', 'application/json');
        if (req.url?.includes('pipeline')) {
          const cmds = JSON.parse(body || '[]');
          const out = cmds.map((cmd) => {
            const op = Array.isArray(cmd) ? String(cmd[0] ?? '').toLowerCase() : '';
            return { result: op === 'eval' || op === 'evalsha' ? [4, 5] : 1 };
          });
          res.end(JSON.stringify(out));
          return;
        }
        res.end(JSON.stringify({ result: [4, 5] }));
      });
    });
    await new Promise((resolve) => upstashMockServer.listen(0, '127.0.0.1', resolve));
    const mockRedisPort = upstashMockServer.address().port;
    const mockRedisUrl = `http://127.0.0.1:${mockRedisPort}`;

    const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
    serverProcess = spawn(process.execPath, [nextBin, 'start', '-p', String(E2E_PORT), '-H', '127.0.0.1'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: String(E2E_PORT),
        STRIPE_SECRET_KEY: testSecretKey,
        STRIPE_API_KEY: testSecretKey,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: testPublishableKey,
        STRIPE_WEBHOOK_SECRET: ephemeralWebhookSecret,
        WEBHOOK_SECRET: ephemeralGatewaySecret,
        GUEST_CHECKOUT_ENCRYPTION_KEY: guestEncryptionKey,
        UPSTASH_REDIS_REST_URL: mockRedisUrl,
        UPSTASH_REDIS_REST_TOKEN: 'e2e_mock_upstash_token',
        AI_ONE_TIME_STRIPE_PRICE_ID: SANDBOX_AI_PRICES.one_time,
        AI_SUBSCRIPTION_STRIPE_PRICE_ID: SANDBOX_AI_PRICES.subscription,
        AI_VIP_STRIPE_PRICE_ID: SANDBOX_AI_PRICES.vip,
        NEXT_PUBLIC_SITE_URL: BASE_URL,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    serverProcess.stdout?.on('data', (d) => serverLogs.push(d.toString()));
    serverProcess.stderr?.on('data', (d) => serverLogs.push(d.toString()));

    await waitForServer(`${BASE_URL}/api/health/config`);
    console.log(`=== 2. Local Next.js Server Ready at ${BASE_URL} (Stripe Test Mode Override) ===`);

    const makeTempUser = async (tag, role, fullName) => {
      const email = `e2e-${tag}-${runId}@nkloficial.com.br`;
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (error || !data.user) {
        throw new Error(`Failed creating temp user ${email}: ${error?.message}`);
      }
      const userId = data.user.id;
      createdAuthIds.push(userId);

      await db.insert(schema.users).values({
        id: userId,
        email,
        name: fullName,
        role,
      }).onConflictDoUpdate({
        target: schema.users.id,
        set: { email, name: fullName, role },
      });

      await db.insert(schema.userProfiles).values({
        id: userId,
        email,
        role,
        fullName,
        planType: 'free',
        singleClassPriceCents: 15000,
      }).onConflictDoUpdate({
        target: schema.userProfiles.id,
        set: { email, role, fullName, planType: 'free' },
      });

      if (role === 'luthier') {
        await db.insert(schema.businessDirectory).values({
          userId,
          businessName: `Atelier E2E ${runId}`,
          city: 'São Paulo',
          state: 'SP',
          planType: 'free',
        });
      }

      const cookie = await signInUserCookieHeader(supabaseUrl, supabaseAnonKey, email, tempPassword);
      return { id: userId, email, fullName, cookie };
    };

    const buyer = await makeTempUser('buyer', 'user', 'Comprador E2E NKL');
    const teacher = await makeTempUser('teacher', 'professor', 'Professor E2E NKL');
    const luthier = await makeTempUser('luthier', 'luthier', 'Luthier E2E NKL');
    console.log(`=== 3. Temporary Auth & DB Fixtures Ready (buyer/teacher/luthier run=${runId}) ===`);

    const sendSignedStripeWebhook = async (type, dataObject, forcedId) => {
      const eventId = forcedId ?? `evt_e2e_${runId}_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
      if (!createdEventIds.includes(eventId)) createdEventIds.push(eventId);
      const payload = JSON.stringify({
        id: eventId,
        object: 'event',
        api_version: '2026-10-28.endive',
        created: Math.floor(Date.now() / 1000),
        data: { object: dataObject },
        livemode: false,
        pending_webhooks: 1,
        request: { id: null, idempotency_key: null },
        type,
      });
      const signature = stripe.webhooks.generateTestHeaderString({
        payload,
        secret: ephemeralWebhookSecret,
      });
      const res = await fetch(`${BASE_URL}/api/payments/stripe-webhook`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': signature,
        },
        body: payload,
      });
      const json = await res.json().catch(() => ({}));
      assert.equal(res.status, 200, `Webhook ${type} (${eventId}) failed HTTP ${res.status}: ${JSON.stringify(json)}`);
      return eventId;
    };

    // 4. Official Stripe Test Cards Matrix (Approved + Refunded + Declined)
    const cardReport = [];
    for (const [pm, amount, label] of [
      ['pm_card_visa', 3900, 'Visa 4242 Approved'],
      ['pm_card_mastercard', 4700, 'Mastercard 5555 Approved'],
    ]) {
      const pi = await stripe.paymentIntents.create({
        amount,
        currency: 'brl',
        payment_method: pm,
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
        description: `Portal NKL E2E Card Check (${label})`,
      });
      assert.equal(pi.status, 'succeeded', `${label} failed to succeed`);
      const refund = await stripe.refunds.create({ payment_intent: pi.id });
      assert.equal(refund.status, 'succeeded', `${label} refund failed`);
      cardReport.push({ label, pm, paymentIntentId: pi.id, status: pi.status, refundId: refund.id });
    }

    for (const [pm, expectedCode] of [
      ['pm_card_chargeDeclined', 'generic_decline'],
      ['pm_card_chargeDeclinedInsufficientFunds', 'insufficient_funds'],
      ['pm_card_chargeDeclinedExpiredCard', 'expired_card'],
      ['pm_card_chargeDeclinedIncorrectCvc', 'incorrect_cvc'],
    ]) {
      let caughtCode;
      try {
        await stripe.paymentIntents.create({
          amount: 1900,
          currency: 'brl',
          payment_method: pm,
          confirm: true,
          automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
        });
      } catch (err) {
        if (err && typeof err === 'object' && 'decline_code' in err && typeof err.decline_code === 'string') {
          caughtCode = err.decline_code;
        } else if (err && typeof err === 'object' && 'code' in err && typeof err.code === 'string') {
          caughtCode = err.code;
        }
      }
      assert.ok(caughtCode, `Decline test ${pm} did not reject card`);
      assert.ok(
        caughtCode === expectedCode || caughtCode === 'card_declined',
        `Decline ${pm}: expected ${expectedCode}, got ${caughtCode}`,
      );
      cardReport.push({ label: `Decline (${expectedCode})`, pm, outcome: `rejected:${caughtCode}` });
    }

    const customer = await stripe.customers.create({
      email: buyer.email,
      name: buyer.fullName,
      payment_method: 'pm_card_visa',
      invoice_settings: { default_payment_method: 'pm_card_visa' },
    });
    sandboxCustomerId = customer.id;

    const createPaidTestSubscription = async ({ amountCents, priceId, productName, metadata }) => {
      let itemPriceId = priceId;
      if (!itemPriceId) {
        const product = await stripe.products.create({ name: productName ?? 'NKL E2E Test Sub' });
        createdStripeProductIds.push(product.id);
        const price = await stripe.prices.create({
          product: product.id,
          currency: 'brl',
          unit_amount: amountCents ?? 1900,
          recurring: { interval: 'month' },
        });
        itemPriceId = price.id;
      }
      const sub = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: itemPriceId }],
        metadata,
        expand: ['latest_invoice'],
      });
      createdSubscriptionIds.push(sub.id);
      assert.equal(sub.status, 'active', `Sandbox subscription ${sub.id} expected active, got ${sub.status}`);
      return sub;
    };

    console.log('=== 4. Official Stripe Test Cards Matrix Passed (Visa/MC + 4 Declines + Customer Sub Ready) ===');

    const gatewaySummary = [];

    // GATEWAY 0: WEBHOOK SECURITY & LEGACY /api/webhooks/gateway HMAC
    {
      const noSigStripe = await fetch(`${BASE_URL}/api/payments/stripe-webhook`, { method: 'POST', body: '{}' });
      assert.equal(noSigStripe.status, 400);
      const badSigStripe = await fetch(`${BASE_URL}/api/payments/stripe-webhook`, {
        method: 'POST',
        headers: { 'stripe-signature': 't=123,v1=deadbeef' },
        body: '{}',
      });
      assert.equal(badSigStripe.status, 400);

      const noHmac = await fetch(`${BASE_URL}/api/webhooks/gateway`, { method: 'POST', body: '{}' });
      assert.equal(noHmac.status, 401);
      const badHmac = await fetch(`${BASE_URL}/api/webhooks/gateway`, {
        method: 'POST',
        headers: { 'x-webhook-signature': '0'.repeat(64) },
        body: '{}',
      });
      assert.equal(badHmac.status, 401);

      const gwBody = JSON.stringify({
        id: `gw_sub_${runId}`,
        provider: 'stripe',
        status: 'active',
        external_reference: luthier.id,
        current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
      });
      const validHmac = crypto.createHmac('sha256', ephemeralGatewaySecret).update(gwBody, 'utf8').digest('hex');
      const okGw = await fetch(`${BASE_URL}/api/webhooks/gateway`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-webhook-signature': validHmac },
        body: gwBody,
      });
      assert.equal(okGw.status, 200);
      const [subRow] = await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.gatewaySubscriptionId, `gw_sub_${runId}`)).limit(1);
      assert.equal(subRow?.status, 'active');
      const [profRow] = await db.select().from(schema.userProfiles).where(eq(schema.userProfiles.id, luthier.id)).limit(1);
      assert.equal(profRow?.planType, 'premium');

      await db.delete(schema.subscriptions).where(eq(schema.subscriptions.gatewaySubscriptionId, `gw_sub_${runId}`));
      await db.update(schema.userProfiles).set({ planType: 'free' }).where(eq(schema.userProfiles.id, luthier.id));

      gatewaySummary.push({ gateway: '0.webhooks-security-and-hmac', status: 'PASSED', details: 'Stripe sig + HMAC-SHA256 verified' });
    }

    // GATEWAY 1: /api/payments/create-guide-checkout + /api/downloads/guide + /api/payments/guide-status
    {
      const cpfGuest = generateValidCpf(7101);
      const badCpfRes = await fetch(`${BASE_URL}/api/payments/create-guide-checkout`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          offerVariant: 'sales-page',
          fullName: 'Convidado Teste',
          email: `badcpf-${runId}@nkloficial.com.br`,
          cpf: '11111111111',
          cpfConsentConfirmed: true,
        }),
      });
      assert.equal(badCpfRes.status, 400);

      let completeGuestSession = null;
      let completeGuestToken = '';
      for (const [tier, expectedCents] of [
        ['essential', 1900],
        ['complete', 3900],
        ['vip', 24700],
      ]) {
        const res = await fetch(`${BASE_URL}/api/payments/create-guide-checkout`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            offerVariant: 'sales-page',
            tier,
            fullName: 'Convidado E2E Renda',
            email: `guest-${tier}-${runId}@nkloficial.com.br`,
            cpf: cpfGuest,
            cpfConsentConfirmed: true,
          }),
        });
        const payload = await res.json();
        assert.equal(res.status, 200, `Guest guide tier ${tier} failed: ${JSON.stringify(payload)}`);
        const sessionId = assertSandboxSessionUrl(payload.checkoutUrl, `guide:${tier}`);
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        assert.equal(session.amount_total, expectedCents, `Tier ${tier} amount mismatch`);
        const pid = session.metadata?.reference?.replace('guide_purchase:', '');
        if (pid) createdPurchaseIds.push(pid);

        if (tier === 'complete') {
          completeGuestSession = session;
          const successUrl = new URL(session.success_url);
          completeGuestToken = successUrl.searchParams.get('guest_access_token') ?? '';
          assert.ok(completeGuestToken.length >= 20, 'Missing guest_access_token on success_url');
        }
      }

      assert.ok(completeGuestSession);
      const completePurchaseId = completeGuestSession.metadata.reference.replace('guide_purchase:', '');

      const guestEvtId = await sendSignedStripeWebhook('checkout.session.completed', {
        ...completeGuestSession,
        payment_status: 'paid',
        payment_intent: `pi_e2e_guest_${runId}`,
        customer_details: { email: `guest-complete-${runId}@nkloficial.com.br` },
      });
      await sendSignedStripeWebhook('checkout.session.completed', {
        ...completeGuestSession,
        payment_status: 'paid',
        payment_intent: `pi_e2e_guest_${runId}`,
      }, guestEvtId);

      const offerEvents = await db.select().from(schema.guideOfferEvents).where(eq(schema.guideOfferEvents.purchaseId, completePurchaseId));
      assert.equal(offerEvents.length, 0);

      const statusRes = await fetch(
        `${BASE_URL}/api/payments/guide-status?reference=${encodeURIComponent(`guide_purchase:${completePurchaseId}`)}&guest_access_token=${encodeURIComponent(completeGuestToken)}`,
      );
      assert.equal(statusRes.status, 200);
      const statusJson = await statusRes.json();
      assert.equal(statusJson.status, 'approved');
      assert.ok((statusRes.headers.get('set-cookie') ?? '').includes('nkl_guest_access='), 'Missing nkl_guest_access cookie');

      const pdfDl = await fetch(`${BASE_URL}/api/downloads/guide`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ assetId: 'guia-essencial-renda-extra-2027', guestAccessToken: completeGuestToken }),
      });
      assert.equal(pdfDl.status, 200, `PDF download failed: ${await pdfDl.clone().text()}`);
      const pdfBuf = Buffer.from(await pdfDl.arrayBuffer());
      assert.equal(pdfBuf.subarray(0, 5).toString('utf8'), '%PDF-', 'Downloaded guide is not a valid PDF');

      const xlsxDl = await fetch(`${BASE_URL}/api/downloads/guide`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ assetId: 'raiox-financeiro-computador', guestAccessToken: completeGuestToken }),
      });
      assert.equal(xlsxDl.status, 200, `XLSX download failed: ${await xlsxDl.clone().text()}`);
      const xlsxBuf = Buffer.from(await xlsxDl.arrayBuffer());
      assert.equal(xlsxBuf.subarray(0, 2).toString('utf8'), 'PK', 'Downloaded XLSX is not a valid zip archive');

      const forbiddenDl = await fetch(`${BASE_URL}/api/downloads/guide`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ assetId: 'ingles-para-ganhar-dinheiro', guestAccessToken: completeGuestToken }),
      });
      assert.equal(forbiddenDl.status, 403);

      const cpfBuyer = generateValidCpf(8202);
      const buyLoggedGuide = async ({
        offerVariant,
        tier,
        productSlug,
        expectedAmountCents,
        expectedDiscount,
        settle = true,
      }) => {
        const res = await fetch(`${BASE_URL}/api/payments/create-guide-checkout`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: buyer.cookie },
          body: JSON.stringify({
            offerVariant,
            ...(tier ? { tier } : {}),
            ...(productSlug ? { productSlug } : {}),
            fullName: buyer.fullName,
            email: buyer.email,
            cpf: cpfBuyer,
            cpfConsentConfirmed: true,
          }),
        });
        const payload = await res.json();
        assert.equal(res.status, 200, `Logged guide checkout (${offerVariant}) failed: ${JSON.stringify(payload)}`);
        const sessionId = assertSandboxSessionUrl(payload.checkoutUrl, offerVariant);
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        assert.equal(session.amount_total, expectedAmountCents, `${offerVariant} expected ${expectedAmountCents}, got ${session.amount_total}`);
        if (expectedDiscount) {
          assert.equal(session.metadata?.loyaltyDiscountPercent, expectedDiscount);
        }
        const pid = session.metadata?.reference?.replace('guide_purchase:', '');
        if (pid) createdPurchaseIds.push(pid);
        if (settle) {
          await sendSignedStripeWebhook('checkout.session.completed', {
            ...session,
            payment_status: 'paid',
            payment_intent: `pi_e2e_${runId}_${pid}`,
            customer_details: { email: buyer.email },
          });
        }
        return { session, purchaseId: pid };
      };

      await buyLoggedGuide({ offerVariant: 'english-ebook-sales-page', expectedAmountCents: 4700 });
      await buyLoggedGuide({ offerVariant: 'mandarin-ebook-sales-page', expectedAmountCents: 3290, expectedDiscount: '30' });
      await buyLoggedGuide({ offerVariant: 'italian-ebook-sales-page', expectedAmountCents: 2350, expectedDiscount: '50' });
      await buyLoggedGuide({ offerVariant: 'french-ebook-sales-page', tier: 'essential', expectedAmountCents: 1350, expectedDiscount: '50', settle: false });
      await buyLoggedGuide({ offerVariant: 'german-ebook-sales-page', tier: 'complete', expectedAmountCents: 2350, expectedDiscount: '50', settle: false });
      await buyLoggedGuide({ offerVariant: 'spanish-ebook-sales-page', tier: 'vip', expectedAmountCents: 29700, settle: false });

      await buyLoggedGuide({ offerVariant: 'sales-page', tier: 'essential', productSlug: 'bussola-negocios', expectedAmountCents: 1900, settle: false });
      await buyLoggedGuide({ offerVariant: 'sales-page', tier: 'complete', productSlug: 'bussola-negocios', expectedAmountCents: 3900 });
      await buyLoggedGuide({ offerVariant: 'sales-page', tier: 'vip', productSlug: 'bussola-negocios', expectedAmountCents: 24700, settle: false });

      const buyerEntitlements = await db.select().from(schema.userEntitlements).where(eq(schema.userEntitlements.userId, buyer.id));
      const slugSet = new Set(buyerEntitlements.map((e) => e.productSlug));
      assert.ok(slugSet.has('ebook-ingles'), 'Expected ebook-ingles entitlement');
      assert.ok(slugSet.has('pacote-idiomas-ia'), 'Expected pacote-idiomas-ia entitlement for Mandarin/Italian');
      assert.ok(slugSet.has('bussola-negocios'), 'Expected bussola-negocios entitlement');

      for (const langAssetId of ['ingles-para-ganhar-dinheiro', 'mandarim-para-ganhar-possibilidades', 'italiano-para-ganhar-possibilidades']) {
        const dl = await fetch(`${BASE_URL}/api/downloads/guide`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: buyer.cookie },
          body: JSON.stringify({ assetId: langAssetId }),
        });
        assert.equal(dl.status, 200, `Authenticated download ${langAssetId} failed: ${await dl.clone().text()}`);
        const buf = Buffer.from(await dl.arrayBuffer());
        assert.equal(buf.subarray(0, 5).toString('utf8'), '%PDF-', `${langAssetId} is not a PDF`);
      }

      gatewaySummary.push({
        gateway: '1.create-guide-checkout + downloads',
        status: 'PASSED',
        details: 'Renda Extra 3 tiers, 6 Idiomas (0/30/50% OFF), Bússola SKU, Watermarked PDF & XLSX downloads',
      });
    }

    // GATEWAY 2: /api/payments/create-guide-subscription
    {
      const cpfSub = generateValidCpf(9303);
      const res = await fetch(`${BASE_URL}/api/payments/create-guide-subscription`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          offerVariant: 'guide-page-cta:0',
          fullName: 'Assinante E2E Guias',
          email: `gsub-${runId}@nkloficial.com.br`,
          cpf: cpfSub,
          cpfConsentConfirmed: true,
        }),
      });
      const payload = await res.json();
      assert.equal(res.status, 200, `Guide sub failed: ${JSON.stringify(payload)}`);
      const sessionId = assertSandboxSessionUrl(payload.checkoutUrl, 'guide-sub');
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      assert.equal(session.amount_total, 1900);
      const guideSubId = session.metadata?.reference?.replace('guide_subscription:', '') ?? '';
      assert.ok(guideSubId);
      createdGuideSubIds.push(guideSubId);
      const guestToken = new URL(session.success_url).searchParams.get('guest_access_token') ?? '';
      assert.ok(guestToken.length >= 20);

      const realSub = await createPaidTestSubscription({
        amountCents: 1900,
        productName: 'Guias E2E NKL',
        metadata: { reference: `guide_subscription:${guideSubId}`, offer_variant: 'guide-page-cta:0' },
      });

      await sendSignedStripeWebhook('checkout.session.completed', {
        ...session,
        payment_status: 'paid',
        subscription: realSub.id,
      });
      await sendSignedStripeWebhook('invoice.paid', {
        id: `in_e2e_gsub_${runId}`,
        parent: { subscription_details: { subscription: realSub.id } },
      });

      const statusRes = await fetch(
        `${BASE_URL}/api/payments/guide-status?reference=${encodeURIComponent(`guide_subscription:${guideSubId}`)}&guest_access_token=${encodeURIComponent(guestToken)}`,
      );
      assert.equal(statusRes.status, 200);
      const statusJson = await statusRes.json();
      assert.equal(statusJson.status, 'active');

      const dlActive = await fetch(`${BASE_URL}/api/downloads/guide`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ assetId: 'guia-essencial-renda-extra-2027', guestAccessToken: guestToken }),
      });
      assert.equal(dlActive.status, 200);
      assert.equal(Buffer.from(await dlActive.arrayBuffer()).subarray(0, 5).toString('utf8'), '%PDF-');

      const canceledSub = await stripe.subscriptions.cancel(realSub.id);
      await sendSignedStripeWebhook('customer.subscription.deleted', canceledSub);
      const [subRowAfter] = await db.select().from(schema.guideSubscriptions).where(eq(schema.guideSubscriptions.id, guideSubId)).limit(1);
      assert.equal(subRowAfter?.status, 'canceled');

      const dlRevoked = await fetch(`${BASE_URL}/api/downloads/guide`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ assetId: 'guia-essencial-renda-extra-2027', guestAccessToken: guestToken }),
      });
      assert.equal(dlRevoked.status, 403);

      gatewaySummary.push({
        gateway: '2.create-guide-subscription',
        status: 'PASSED',
        details: `Real Sandbox sub ${realSub.id}, endive invoice.paid, PDF download active->revoked verified`,
      });
    }

    // GATEWAY 3: /api/payments/create-ai-checkout
    {
      const unauthAi = await fetch(`${BASE_URL}/api/payments/create-ai-checkout`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan: 'one_time' }),
      });
      assert.equal(unauthAi.status, 401);

      const aiSessions = {};
      for (const [plan, productSlug, expectedCents] of [
        ['one_time', 'ferramenta-ia', 9900],
        ['subscription', 'curso-ia-pratica', 3900],
        ['vip', 'curso-ia-pratica', 39700],
      ]) {
        const res = await fetch(`${BASE_URL}/api/payments/create-ai-checkout`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: buyer.cookie },
          body: JSON.stringify({ plan, productSlug }),
        });
        const payload = await res.json();
        assert.equal(res.status, 200, `AI checkout ${plan} failed: ${JSON.stringify(payload)}`);
        const sessionId = assertSandboxSessionUrl(payload.url, `ai:${plan}`);
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        assert.equal(session.amount_total, expectedCents);
        aiSessions[plan] = session;
      }

      await sendSignedStripeWebhook('checkout.session.completed', {
        ...aiSessions.one_time,
        payment_status: 'paid',
        payment_intent: `pi_e2e_ai_ot_${runId}`,
      });
      const [grantOneTime] = await db.select().from(schema.aiAccessGrants).where(eq(schema.aiAccessGrants.userId, buyer.id)).limit(1);
      assert.equal(grantOneTime?.status, 'active');

      const aiSub = await createPaidTestSubscription({
        priceId: SANDBOX_AI_PRICES.subscription,
        metadata: {
          product: 'ia-na-pratica',
          plan: 'subscription',
          userId: buyer.id,
          reference: `ai_subscription:${buyer.id}`,
          productSlug: 'curso-ia-pratica',
        },
      });
      await sendSignedStripeWebhook('checkout.session.completed', {
        ...aiSessions.subscription,
        subscription: aiSub.id,
        payment_status: 'paid',
      });
      await sendSignedStripeWebhook('invoice.payment_failed', {
        id: `in_e2e_aifail_${runId}`,
        parent: { subscription_details: { subscription: aiSub.id } },
      });
      const [pastDueGrant] = await db.select().from(schema.aiAccessGrants).where(eq(schema.aiAccessGrants.userId, buyer.id)).limit(1);
      assert.equal(pastDueGrant?.status, 'past_due');

      await sendSignedStripeWebhook('invoice.paid', {
        id: `in_e2e_aiok_${runId}`,
        parent: { subscription_details: { subscription: aiSub.id } },
      });
      const [recoveredGrant] = await db.select().from(schema.aiAccessGrants).where(eq(schema.aiAccessGrants.userId, buyer.id)).limit(1);
      assert.equal(recoveredGrant?.status, 'active');

      const canceledAiSub = await stripe.subscriptions.cancel(aiSub.id);
      await sendSignedStripeWebhook('customer.subscription.deleted', canceledAiSub);
      const [revokedEnt] = await db.select().from(schema.userEntitlements).where(
        and(eq(schema.userEntitlements.userId, buyer.id), eq(schema.userEntitlements.productSlug, 'curso-ia-pratica')),
      ).limit(1);
      assert.equal(revokedEnt?.status, 'revoked');

      await sendSignedStripeWebhook('checkout.session.completed', {
        ...aiSessions.vip,
        payment_status: 'paid',
        payment_intent: `pi_e2e_ai_vip_${runId}`,
      });
      const vipEntitlements = await db.select().from(schema.userEntitlements).where(eq(schema.userEntitlements.userId, buyer.id));
      for (const expectedSlug of PAID_PRODUCT_SLUGS) {
        const match = vipEntitlements.find((e) => e.productSlug === expectedSlug);
        assert.equal(match?.status, 'active', `VIP should activate ${expectedSlug}`);
      }

      gatewaySummary.push({
        gateway: '3.create-ai-checkout',
        status: 'PASSED',
        details: `3 plans (R$39/mês, R$99, R$397 Passe Total -> all ${PAID_PRODUCT_SLUGS.length} SKUs active) + past_due/recovery/cancel`,
      });
    }

    // GATEWAY 4: /api/payments/create-ad-subscription
    {
      const unauthAd = await fetch(`${BASE_URL}/api/payments/create-ad-subscription`, { method: 'POST' });
      assert.equal(unauthAd.status, 401);

      const fd = new FormData();
      fd.set('businessName', `Loja Teste ${runId}`);
      fd.set('responsibleName', buyer.fullName);
      fd.set('whatsapp', '11999998888');
      fd.set('businessCategory', 'Tecnologia e IA');
      fd.set('offerDescription', 'Curso prático e ferramentas digitais para pequenos empreendedores.');
      fd.set('campaignObjective', 'Gerar cliques no site');
      fd.set('targetAudience', 'PMEs e autônomos');
      fd.set('socialUrl', '@lojasteste');
      fd.set('destinationUrl', 'minhaloja-teste.com.br');
      fd.set('assetAltText', '');
      fd.set('slotCount', '2');
      fd.set('contractAccepted', 'true');

      const adRes = await fetch(`${BASE_URL}/api/payments/create-ad-subscription`, {
        method: 'POST',
        headers: { cookie: buyer.cookie },
        body: fd,
      });
      const adPayload = await adRes.json();
      assert.equal(adRes.status, 200, `Ad subscription failed: ${JSON.stringify(adPayload)}`);
      const sessionId = assertSandboxSessionUrl(adPayload.checkoutUrl, 'ad-subscription');
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      assert.equal(session.amount_total, 3980);
      const campaignId = session.metadata?.reference?.replace('ad_campaign:', '') ?? '';
      assert.ok(campaignId);
      createdCampaignIds.push(campaignId);

      const [campRow] = await db.select().from(schema.adCampaigns).where(eq(schema.adCampaigns.id, campaignId)).limit(1);
      assert.equal(campRow?.destinationUrl, 'https://minhaloja-teste.com.br/');
      assert.ok(campRow?.assetAltText.startsWith('Anúncio '));

      const adSub = await createPaidTestSubscription({
        amountCents: 3980,
        productName: `Anúncio NKL E2E ${runId}`,
        metadata: { reference: `ad_campaign:${campaignId}` },
      });
      await sendSignedStripeWebhook('checkout.session.completed', {
        ...session,
        subscription: adSub.id,
        payment_status: 'paid',
      });
      const [activeCamp] = await db.select().from(schema.adCampaigns).where(eq(schema.adCampaigns.id, campaignId)).limit(1);
      assert.equal(activeCamp?.billingStatus, 'active');
      assert.equal(activeCamp?.status, 'pending_review');

      await sendSignedStripeWebhook('charge.refunded', {
        id: `ch_e2e_ad_${runId}`,
        metadata: { reference: `ad_campaign:${campaignId}` },
      });
      const [refundedCamp] = await db.select().from(schema.adCampaigns).where(eq(schema.adCampaigns.id, campaignId)).limit(1);
      assert.equal(refundedCamp?.billingStatus, 'refunded');

      const canceledAdSub = await stripe.subscriptions.cancel(adSub.id);
      await sendSignedStripeWebhook('customer.subscription.deleted', canceledAdSub);
      const [cancelledCamp] = await db.select().from(schema.adCampaigns).where(eq(schema.adCampaigns.id, campaignId)).limit(1);
      assert.equal(cancelledCamp?.status, 'cancelled');

      // Test remaining preset packages (1 cota = R$19,90; 3 cotas = R$59,70; 10 cotas = R$199,00) sequentially
      // releasing slot reservations right after creating each Checkout Session.
      for (const [presetSlots, expectedPresetCents] of [[1, 1990], [3, 5970], [10, 19900]]) {
        const presetFd = new FormData();
        presetFd.set('businessName', `Preset ${presetSlots} Cotas ${runId}`);
        presetFd.set('responsibleName', buyer.fullName);
        presetFd.set('whatsapp', '11999998888');
        presetFd.set('businessCategory', 'Tecnologia e IA');
        presetFd.set('offerDescription', 'Teste automático de pacote de cotas publicitárias.');
        presetFd.set('campaignObjective', 'Gerar cliques no site');
        presetFd.set('destinationUrl', 'minhaloja-teste.com.br');
        presetFd.set('slotCount', String(presetSlots));
        presetFd.set('contractAccepted', 'true');

        const presetRes = await fetch(`${BASE_URL}/api/payments/create-ad-subscription`, {
          method: 'POST',
          headers: { cookie: buyer.cookie },
          body: presetFd,
        });
        const presetPayload = await presetRes.json();
        assert.equal(presetRes.status, 200, `Ad preset ${presetSlots} failed: ${JSON.stringify(presetPayload)}`);
        const presetSid = assertSandboxSessionUrl(presetPayload.checkoutUrl, `ad-preset:${presetSlots}`);
        const presetSess = await stripe.checkout.sessions.retrieve(presetSid);
        assert.equal(presetSess.amount_total, expectedPresetCents);
        const presetCid = presetSess.metadata?.reference?.replace('ad_campaign:', '');
        if (presetCid) {
          createdCampaignIds.push(presetCid);
          await db.update(schema.adCampaigns).set({ status: 'cancelled' }).where(eq(schema.adCampaigns.id, presetCid));
        }
      }

      gatewaySummary.push({
        gateway: '4.create-ad-subscription',
        status: 'PASSED',
        details: `3 presets (1/3/10 cotas = R$19,90/R$59,70/R$199) + 2 cotas R$39,80 (${adSub.id}), pending_review -> charge.refunded -> cancelled`,
      });
    }

    // GATEWAY 5: LUTHIER PREMIUM (Mensal R$49,90 + Anual R$479)
    {
      const premAnnualSession = await createCheckoutSession(buildPremiumCheckoutParams({
        userId: luthier.id,
        siteUrl: BASE_URL,
        priceCents: 47900,
        interval: 'year',
      }));
      assertSandboxSessionUrl(premAnnualSession.url, 'luthier-premium-annual');
      assert.equal(premAnnualSession.amount_total, 47900);

      const premSession = await createCheckoutSession(buildPremiumCheckoutParams({
        userId: luthier.id,
        siteUrl: BASE_URL,
        priceCents: 4990,
        interval: 'month',
      }));
      assertSandboxSessionUrl(premSession.url, 'luthier-premium');
      assert.equal(premSession.amount_total, 4990);

      const premSub = await createPaidTestSubscription({
        amountCents: 4990,
        productName: 'Premium Luthier NKL E2E',
        metadata: { reference: `premium_subscription:${luthier.id}` },
      });
      await sendSignedStripeWebhook('checkout.session.completed', {
        ...premSession,
        subscription: premSub.id,
        payment_status: 'paid',
      });

      const [profPrem] = await db.select().from(schema.userProfiles).where(eq(schema.userProfiles.id, luthier.id)).limit(1);
      const [dirPrem] = await db.select().from(schema.businessDirectory).where(eq(schema.businessDirectory.userId, luthier.id)).limit(1);
      assert.equal(profPrem?.planType, 'premium');
      assert.equal(dirPrem?.planType, 'premium');

      const canceledPremSub = await stripe.subscriptions.cancel(premSub.id);
      await sendSignedStripeWebhook('customer.subscription.deleted', canceledPremSub);

      const [profFree] = await db.select().from(schema.userProfiles).where(eq(schema.userProfiles.id, luthier.id)).limit(1);
      const [dirFree] = await db.select().from(schema.businessDirectory).where(eq(schema.businessDirectory.userId, luthier.id)).limit(1);
      assert.equal(profFree?.planType, 'free');
      assert.equal(dirFree?.planType, 'free');

      gatewaySummary.push({
        gateway: '5.luthier-premium-checkout',
        status: 'PASSED',
        details: `createCheckoutSession (${premSession.id}, integration_identifier OK) + ${premSub.id} upgrade/downgrade`,
      });
    }

    // GATEWAY 6: /api/payments/create-booking-payment (NKL Cordas + Daily.co)
    {
      const unauthBook = await fetch(`${BASE_URL}/api/payments/create-booking-payment`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ bookingId: randomUUID() }),
      });
      assert.equal(unauthBook.status, 401);

      const pricing = calculateClassPricing(15000, 'single');
      const [booking] = await db.insert(schema.classBookings).values({
        studentId: buyer.id,
        teacherId: teacher.id,
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'pending',
        paymentStatus: 'pending',
        priceCents: pricing.basePriceCents,
        platformFeeCents: pricing.platformApplicationFeeCents,
        planModality: 'single',
        teacherNetCents: pricing.teacherNetReceivesCents,
      }).returning({ id: schema.classBookings.id });
      assert.ok(booking?.id);
      createdBookingIds.push(booking.id);

      const bookRes = await fetch(`${BASE_URL}/api/payments/create-booking-payment`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: buyer.cookie },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const bookPayload = await bookRes.json();
      assert.equal(bookRes.status, 200, `Booking checkout failed: ${JSON.stringify(bookPayload)}`);
      const sessionId = assertSandboxSessionUrl(bookPayload.checkoutUrl, 'booking');
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      assert.equal(session.amount_total, pricing.totalStudentPaysCents);

      await sendSignedStripeWebhook('checkout.session.completed', {
        ...session,
        payment_status: 'paid',
        payment_intent: `pi_e2e_booking_${runId}`,
      });

      const [confirmed] = await db.select().from(schema.classBookings).where(eq(schema.classBookings.id, booking.id)).limit(1);
      assert.equal(confirmed?.paymentStatus, 'paid');
      assert.equal(confirmed?.status, 'confirmed');
      assert.ok(confirmed?.meetingUrl?.startsWith('https://'), `Expected Daily.co room URL, got ${confirmed?.meetingUrl}`);

      const bookingNotifs = await db.select().from(schema.notifications).where(eq(schema.notifications.relatedId, booking.id));
      assert.equal(bookingNotifs.length, 2, 'Expected notifications for both student and teacher');

      gatewaySummary.push({
        gateway: '6.create-booking-payment + daily.co',
        status: 'PASSED',
        details: `Booking ${booking.id} R$ ${(pricing.totalStudentPaysCents / 100).toFixed(2)}, room=${confirmed.meetingUrl}`,
      });
    }

    console.log('\n=== OFFICIAL STRIPE TEST CARDS RESULT ===');
    console.log(JSON.stringify(cardReport, null, 2));
    console.log('\n=== ALL PAYMENT GATEWAYS E2E RESULT ===');
    console.log(JSON.stringify(gatewaySummary, null, 2));
  } finally {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill();
    }
    if (upstashMockServer) {
      await new Promise((resolve) => upstashMockServer.close(() => resolve()));
    }

    for (const subId of createdSubscriptionIds) {
      await stripe.subscriptions.cancel(subId).catch(() => {});
    }
    if (sandboxCustomerId) {
      await stripe.customers.del(sandboxCustomerId).catch(() => {});
    }
    for (const prodId of createdStripeProductIds) {
      await stripe.products.update(prodId, { active: false }).catch(() => {});
    }

    if (createdEventIds.length > 0) {
      await db.delete(schema.stripeWebhookEvents).where(inArray(schema.stripeWebhookEvents.id, createdEventIds)).catch(() => {});
    }
    const accessKeysToDelete = [
      ...createdPurchaseIds.map((id) => `purchase:${id}`),
      ...createdGuideSubIds.map((id) => `subscription:${id}`),
    ];
    if (accessKeysToDelete.length > 0) {
      await db.delete(schema.guideDownloadAttempts).where(inArray(schema.guideDownloadAttempts.accessKey, accessKeysToDelete)).catch(() => {});
    }
    if (createdPurchaseIds.length > 0) {
      await db.delete(schema.guideOfferEvents).where(inArray(schema.guideOfferEvents.purchaseId, createdPurchaseIds)).catch(() => {});
      await db.delete(schema.guidePurchases).where(inArray(schema.guidePurchases.id, createdPurchaseIds)).catch(() => {});
    }
    if (createdGuideSubIds.length > 0) {
      await db.delete(schema.guideOfferEvents).where(inArray(schema.guideOfferEvents.subscriptionId, createdGuideSubIds)).catch(() => {});
      await db.delete(schema.guideSubscriptions).where(inArray(schema.guideSubscriptions.id, createdGuideSubIds)).catch(() => {});
    }
    if (createdCampaignIds.length > 0) {
      await db.delete(schema.adCampaigns).where(inArray(schema.adCampaigns.id, createdCampaignIds)).catch(() => {});
    }
    if (createdBookingIds.length > 0) {
      await db.delete(schema.notifications).where(inArray(schema.notifications.relatedId, createdBookingIds)).catch(() => {});
      await db.delete(schema.classBookings).where(inArray(schema.classBookings.id, createdBookingIds)).catch(() => {});
    }
    if (createdAuthIds.length > 0) {
      await db.delete(schema.studentPlanEnrollments).where(inArray(schema.studentPlanEnrollments.studentId, createdAuthIds)).catch(() => {});
      await db.delete(schema.aiAccessGrants).where(inArray(schema.aiAccessGrants.userId, createdAuthIds)).catch(() => {});
      await db.delete(schema.userEntitlements).where(inArray(schema.userEntitlements.userId, createdAuthIds)).catch(() => {});
      await db.delete(schema.subscriptions).where(inArray(schema.subscriptions.userId, createdAuthIds)).catch(() => {});
      await db.delete(schema.notifications).where(inArray(schema.notifications.userId, createdAuthIds)).catch(() => {});
      await db.delete(schema.businessDirectory).where(inArray(schema.businessDirectory.userId, createdAuthIds)).catch(() => {});
      await db.delete(schema.userProfiles).where(inArray(schema.userProfiles.id, createdAuthIds)).catch(() => {});
      await db.delete(schema.users).where(inArray(schema.users.id, createdAuthIds)).catch(() => {});
      for (const uid of createdAuthIds) {
        await supabaseAdmin.auth.admin.deleteUser(uid).catch(() => {});
      }
    }
    await sql.end({ timeout: 5 }).catch(() => {});
    console.log('=== Cleanup Complete (Sandbox + Supabase DB + Auth Users + Local Server) ===');
  }
}

main().catch((error) => {
  console.error('[E2E_STRIPE_GATEWAYS_FAILED]', error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
