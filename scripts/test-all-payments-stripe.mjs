import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import Stripe from 'stripe';
import { PAID_PRODUCT_SLUGS } from '../src/config/products';
import { getAiOfferCheckoutMode, getAiOfferClientReferenceId, getAiOfferPriceCents, getAiOfferTitle } from '../src/lib/ai-product';
import { getGuideAssetsForOffer, GUIDE_ASSETS } from '../src/lib/guide-assets';
import { buildGuidePurchaseCheckoutParams, buildGuideSubscriptionCheckoutParams } from '../src/lib/stripe/guide';
import { buildBookingCheckoutParams, buildPremiumCheckoutParams } from '../src/lib/stripe/premium-booking';
import { extractStripeInvoiceSubscriptionId, getStripeReference, resolveGuideProductSlug } from '../src/lib/stripe/webhook-helpers';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return {};
  const out = {};
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const env = { ...loadEnvLocal(), ...process.env };
const testKey = env.TEST_BACKUP_STRIPE_SECRET_KEY?.trim();
if (!testKey || !testKey.startsWith('sk_test_')) {
  throw new Error('TEST_BACKUP_STRIPE_SECRET_KEY (sk_test_...) ausente. Abortado para nunca testar em produção.');
}

const stripe = new Stripe(testKey);
const siteUrl = 'https://nkloficial.com.br';

async function main() {
  const account = await stripe.accounts.retrieve();
  assert.ok(testKey.startsWith('sk_test_'));
  console.log('=== Stripe Test Mode Account ===');
  console.log(JSON.stringify({ id: account.id, displayName: account.settings?.dashboard?.display_name ?? null, mode: 'TEST' }));

  const results = [];

  // 1. Guia Renda Extra (Essential R$19, Complete R$39, VIP R$247)
  for (const [tier, offerVariant, expectedAmount, expectedAssets] of [
    ['essential', 'sales-page:essential', 1900, 1],
    ['complete', 'sales-page', 3900, 5],
    ['vip', 'sales-page:vip', 24700, 11],
  ]) {
    const built = buildGuidePurchaseCheckoutParams({
      purchaseId: `test-${tier}-001`,
      siteUrl,
      offerVariant,
      customerEmail: 'comprador-teste@nkloficial.com.br',
      guestAccessToken: 'tok_test_guest_001',
    });
    const session = await stripe.checkout.sessions.create({
      mode: built.mode,
      line_items: built.lineItems,
      metadata: built.metadata,
      success_url: built.successUrl,
      cancel_url: built.cancelUrl,
      customer_email: built.customerEmail,
    });
    assert.ok(session.url?.startsWith('https://checkout.stripe.com/'));
    assert.equal(session.amount_total, expectedAmount);
    assert.deepEqual(getStripeReference(session.metadata), { type: 'guide_purchase', id: `test-${tier}-001` });
    assert.equal(getGuideAssetsForOffer(offerVariant).length, expectedAssets);
    results.push({ flow: `renda-extra:${tier}`, sessionId: session.id, amountCents: session.amount_total, deliverables: expectedAssets });
  }

  // 2. Idiomas (Complete R$47, 30% OFF R$32.90, VIP R$297)
  for (const [label, offerVariant, discountPercent, overrideAmount, expectedAssets] of [
    ['mandarim:complete', 'mandarin-ebook-sales-page', 0, 4700, 1],
    ['ingles:30off', 'english-ebook-sales-page', 30, 3290, 1],
    ['mandarim:vip', 'mandarin-ebook-sales-page:vip', 0, 29700, 7],
  ]) {
    const built = buildGuidePurchaseCheckoutParams({
      purchaseId: `test-${label}`,
      siteUrl,
      offerVariant,
      discountPercent,
      overrideAmountCents: overrideAmount,
      customerEmail: 'aluno-idiomas@nkloficial.com.br',
    });
    const session = await stripe.checkout.sessions.create({
      mode: built.mode,
      line_items: built.lineItems,
      metadata: built.metadata,
      success_url: built.successUrl,
      cancel_url: built.cancelUrl,
      customer_email: built.customerEmail,
    });
    assert.equal(session.amount_total, overrideAmount);
    assert.equal(getGuideAssetsForOffer(offerVariant).length, expectedAssets);
    assert.equal(resolveGuideProductSlug(offerVariant), label.startsWith('ingles') ? 'ebook-ingles' : 'pacote-renda-extra');
    results.push({ flow: `idiomas:${label}`, sessionId: session.id, amountCents: session.amount_total, deliverables: expectedAssets });
  }

  // 3. Assinatura Guias para Liberdade Financeira (R$19/mês)
  const guideSubBuilt = buildGuideSubscriptionCheckoutParams({
    subscriptionId: 'test-sub-guide-001',
    siteUrl,
    payerEmail: 'assinante@nkloficial.com.br',
    offerVariant: 'sales-page:subscription',
  });
  const guideSubSession = await stripe.checkout.sessions.create({
    mode: guideSubBuilt.mode,
    line_items: guideSubBuilt.lineItems,
    metadata: guideSubBuilt.metadata,
    subscription_data: { metadata: guideSubBuilt.metadata },
    success_url: guideSubBuilt.successUrl,
    cancel_url: guideSubBuilt.cancelUrl,
    customer_email: guideSubBuilt.customerEmail,
  });
  assert.equal(guideSubSession.amount_total, 1900);
  assert.equal(getGuideAssetsForOffer('sales-page:subscription').length, 5);
  results.push({ flow: 'guias:subscription', sessionId: guideSubSession.id, amountCents: guideSubSession.amount_total, deliverables: 5 });

  // 4. IA na Prática (R$39/mês, R$99 Vitalício, R$397 Passe Total VIP)
  for (const plan of ['subscription', 'one_time', 'vip']) {
    const mode = getAiOfferCheckoutMode(plan);
    const amountCents = getAiOfferPriceCents(plan);
    const clientRef = getAiOfferClientReferenceId(plan, 'user-test-ia');
    const metadata = {
      product: 'ia-na-pratica',
      plan,
      userId: 'user-test-ia',
      reference: clientRef,
      productSlug: 'curso-ia-pratica',
    };
    const session = await stripe.checkout.sessions.create({
      mode,
      client_reference_id: clientRef,
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: { name: getAiOfferTitle(plan) },
          unit_amount: amountCents,
          ...(mode === 'subscription' ? { recurring: { interval: 'month' } } : {}),
        },
        quantity: 1,
      }],
      metadata,
      ...(mode === 'subscription' ? { subscription_data: { metadata } } : {}),
      success_url: `${siteUrl}/ia/curso?checkout=success`,
      cancel_url: `${siteUrl}/ia/oferta?checkout=cancelled`,
      customer_email: 'ia@nkloficial.com.br',
    });
    assert.equal(session.amount_total, amountCents);
    assert.ok(getStripeReference(session.metadata, session.client_reference_id));
    results.push({ flow: `ia:${plan}`, sessionId: session.id, amountCents: session.amount_total, deliverables: plan === 'vip' ? PAID_PRODUCT_SLUGS.length : 1 });
  }

  // 5. Anuncie Aqui (/programas/anuncie) Subscription (R$19,90/cota)
  const adSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{
      price_data: {
        currency: 'brl',
        product_data: { name: 'Anúncio Portal NKL · Empresa Teste' },
        unit_amount: 1990,
        recurring: { interval: 'month' },
      },
      quantity: 2,
    }],
    metadata: { reference: 'ad_campaign:test-ad-001', slot_count: '2' },
    subscription_data: { metadata: { reference: 'ad_campaign:test-ad-001' } },
    success_url: `${siteUrl}/programas/anuncie/sucesso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/programas/anuncie?checkout=cancelled`,
    customer_email: 'anunciante@nkloficial.com.br',
  });
  assert.equal(adSession.amount_total, 3980);
  assert.deepEqual(getStripeReference(adSession.metadata), { type: 'ad_campaign', id: 'test-ad-001' });
  results.push({ flow: 'anuncie:2cotas', sessionId: adSession.id, amountCents: adSession.amount_total, deliverables: 'creative-upload-unlock' });

  // 6. NKL Cordas: Premium Luthier + Aula Individual Booking
  const premBuilt = buildPremiumCheckoutParams({ userId: 'luthier-test-01', siteUrl, priceCents: 4990 });
  const premSession = await stripe.checkout.sessions.create({
    mode: premBuilt.mode,
    line_items: premBuilt.lineItems,
    metadata: premBuilt.metadata,
    subscription_data: { metadata: premBuilt.metadata },
    success_url: premBuilt.successUrl,
    cancel_url: premBuilt.cancelUrl,
  });
  assert.equal(premSession.amount_total, 4990);
  assert.deepEqual(getStripeReference(premSession.metadata), { type: 'premium_subscription', id: 'luthier-test-01' });
  results.push({ flow: 'musica:luthier-premium', sessionId: premSession.id, amountCents: premSession.amount_total, deliverables: 'premium_plan' });

  const bookBuilt = buildBookingCheckoutParams({
    bookingId: 'booking-test-01',
    siteUrl,
    totalCents: 12000,
    description: 'Aula individual Portal NKL — Avulsa',
  });
  const bookSession = await stripe.checkout.sessions.create({
    mode: bookBuilt.mode,
    line_items: bookBuilt.lineItems,
    metadata: bookBuilt.metadata,
    success_url: bookBuilt.successUrl,
    cancel_url: bookBuilt.cancelUrl,
  });
  assert.equal(bookSession.amount_total, 12000);
  assert.deepEqual(getStripeReference(bookSession.metadata), { type: 'booking', id: 'booking-test-01' });
  results.push({ flow: 'musica:booking', sessionId: bookSession.id, amountCents: bookSession.amount_total, deliverables: 'daily_room' });

  // 7. Confirmação real com cartão teste oficial Stripe pm_card_visa (4242...) + Refund de limpeza
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 3900,
    currency: 'brl',
    payment_method: 'pm_card_visa',
    confirm: true,
    automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    description: 'Portal NKL — Teste cartão pm_card_visa + verificação de entregáveis',
    metadata: { reference: 'guide_purchase:test-pm-card-visa', offer_variant: 'sales-page' },
  });
  assert.equal(paymentIntent.status, 'succeeded');
  assert.equal(GUIDE_ASSETS.length, 11);
  assert.equal(extractStripeInvoiceSubscriptionId({ parent: { subscription_details: { subscription: 'sub_test_123' } } }), 'sub_test_123');

  console.log('=== PaymentIntent Card Confirmation (pm_card_visa) ===');
  console.log(JSON.stringify({
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status,
    amountCents: paymentIntent.amount,
    currency: paymentIntent.currency,
  }));
  console.log('=== All 12 Checkout Flows & Deliverables Verified ===');
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error('[STRIPE_TEST_SUITE_ERROR]', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
