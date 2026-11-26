import assert from 'node:assert/strict';
import test from 'node:test';
import { CONSENT_STORAGE_KEY } from '@/components/privacy-scripts';
import {
  getPortalAnalyticsArea,
  trackBeginCheckout,
  trackOfferFunnelEvent,
  trackPortalFunnelEvent,
  trackPricingTierSelected,
  trackPurchaseCompleted,
} from '@/lib/analytics';
import { createPageViewEvent } from '@/lib/analytics-pageview';

test('creates a Google Analytics page_view event for the current route', () => {
  assert.deepEqual(
    createPageViewEvent('/programas/celular'),
    { eventName: 'page_view', params: { page_path: '/programas/celular' } },
  );
});

test('tracks Guide CTA attribution through analytics and the offer events API', async () => {
  const events: Array<{ name: string; params: Record<string, string | number | boolean> | undefined }> = [];
  const requests: Array<{ url: string; body: string }> = [];
  const localStorage = {
    getItem: (key: string) => key === CONSENT_STORAGE_KEY ? 'accepted' : null,
  };

  Object.assign(globalThis, {
    window: {
      localStorage,
      gtag: (_command: 'event', name: string, params?: Record<string, string | number | boolean>) => {
        events.push({ name, params });
      },
    },
    fetch: async (url: string, init?: RequestInit) => {
      requests.push({ url, body: String(init?.body) });
      return new Response(null, { status: 204 });
    },
  });

  trackOfferFunnelEvent('guide-page-cta:0', 'click');
  await new Promise<void>((resolve) => setImmediate(resolve));

  assert.deepEqual(events, [{
    name: 'guide_page_cta_click',
    params: { variant: '0' },
  }]);
  assert.deepEqual(requests, [{
    url: '/api/sales/offer-events',
    body: JSON.stringify({
      experiment: 'guide-page-cta',
      variant: '0',
      eventType: 'click',
    }),
  }]);
});

test('keeps program secondary CTA attribution unchanged', async () => {
  const events: Array<{ name: string; params: Record<string, string | number | boolean> | undefined }> = [];
  const requests: Array<{ body: string }> = [];

  Object.assign(globalThis, {
    window: {
      localStorage: {
        getItem: (key: string) => key === CONSENT_STORAGE_KEY ? 'accepted' : null,
      },
      gtag: (_command: 'event', name: string, params?: Record<string, string | number | boolean>) => {
        events.push({ name, params });
      },
    },
    fetch: async (_url: string, init?: RequestInit) => {
      requests.push({ body: String(init?.body) });
      return new Response(null, { status: 204 });
    },
  });

  trackOfferFunnelEvent('program-secondary-cta:2', 'checkout');
  await new Promise<void>((resolve) => setImmediate(resolve));

  assert.deepEqual(events, [{
    name: 'program_secondary_cta_checkout',
    params: { variant: '2' },
  }]);
  assert.deepEqual(requests, [{
    body: JSON.stringify({
      experiment: 'program-secondary-cta',
      variant: '2',
      eventType: 'checkout',
    }),
  }]);
});

test('blocks trackPortalFunnelEvent emission when LGPD consent is absent or rejected', () => {
  const gtagCalls: Array<{ name: string; params?: Record<string, string | number | boolean> }> = [];
  const vaCalls: Array<{ event: string; payload?: unknown }> = [];

  for (const storedConsent of [null, 'rejected']) {
    Object.assign(globalThis, {
      window: {
        localStorage: {
          getItem: (key: string) => (key === CONSENT_STORAGE_KEY ? storedConsent : null),
        },
        gtag: (_command: 'event', name: string, params?: Record<string, string | number | boolean>) => {
          gtagCalls.push({ name, params });
        },
        va: (event: 'beforeSend' | 'event' | 'pageview', payload?: unknown) => {
          vaCalls.push({ event, payload });
        },
      },
    });

    trackPortalFunnelEvent('track_select', { track_id: 'renda-extra', source: 'home_selector' });
    trackPortalFunnelEvent('offer_cta_click', { product_slug: 'ferramenta-ia', track_id: 'ia-completa' });
  }

  assert.equal(gtagCalls.length, 0);
  assert.equal(vaCalls.length, 0);
});

test('emits track_select, install_cta_click, install_prompt_accepted and offer_cta_click to gtag and window.va when consent is accepted', () => {
  const gtagCalls: Array<{ name: string; params?: Record<string, string | number | boolean> }> = [];
  const vaCalls: Array<{ event: string; payload?: unknown }> = [];

  Object.assign(globalThis, {
    window: {
      localStorage: {
        getItem: (key: string) => (key === CONSENT_STORAGE_KEY ? 'accepted' : null),
      },
      gtag: (_command: 'event', name: string, params?: Record<string, string | number | boolean>) => {
        gtagCalls.push({ name, params });
      },
      va: (event: 'beforeSend' | 'event' | 'pageview', payload?: unknown) => {
        vaCalls.push({ event, payload });
      },
    },
  });

  trackPortalFunnelEvent('track_select', { track_id: 'ia-completa', source: 'home_selector' });
  trackPortalFunnelEvent('install_cta_click', { track_id: 'ia-completa', source: 'home_selector', target: 'instalar' });
  trackPortalFunnelEvent('install_prompt_accepted', { track_id: 'ia-completa', platform: 'desktop' });
  trackPortalFunnelEvent('offer_cta_click', { product_slug: 'ferramenta-ia', track_id: 'ia-completa', placement: 'hero' });

  assert.deepEqual(
    gtagCalls.map((call) => call.name),
    ['track_select', 'install_cta_click', 'install_prompt_accepted', 'offer_cta_click'],
  );
  assert.deepEqual(
    vaCalls.map((call) => ({
      event: call.event,
      name: (call.payload as { name?: string })?.name,
      data: (call.payload as { data?: Record<string, unknown> })?.data,
    })),
    [
      {
        event: 'event',
        name: 'track_select',
        data: { track_id: 'ia-completa', source: 'home_selector' },
      },
      {
        event: 'event',
        name: 'install_cta_click',
        data: { track_id: 'ia-completa', source: 'home_selector', target: 'instalar' },
      },
      {
        event: 'event',
        name: 'install_prompt_accepted',
        data: { track_id: 'ia-completa', platform: 'desktop' },
      },
      {
        event: 'event',
        name: 'offer_cta_click',
        data: { product_slug: 'ferramenta-ia', track_id: 'ia-completa', placement: 'hero' },
      },
    ],
  );
});

test('maps every portal route to granular analytics area and tracks pricing/checkout/purchase with Clarity', () => {
  assert.equal(getPortalAnalyticsArea('/'), 'home');
  assert.equal(getPortalAnalyticsArea('/blog/aprender/chines'), 'languages');
  assert.equal(getPortalAnalyticsArea('/guias/ingles'), 'languages');
  assert.equal(getPortalAnalyticsArea('/ia/oferta'), 'ai');
  assert.equal(getPortalAnalyticsArea('/guias/renda-extra'), 'income');
  assert.equal(getPortalAnalyticsArea('/programas/com-ia'), 'income');
  assert.equal(getPortalAnalyticsArea('/mural-de-parceiros'), 'partners');
  assert.equal(getPortalAnalyticsArea('/musica/naipe_cordas'), 'music');

  const gtagCalls: Array<{ name: string; params?: Record<string, string | number | boolean> }> = [];
  const clarityCalls: unknown[][] = [];

  Object.assign(globalThis, {
    window: {
      localStorage: {
        getItem: (key: string) => (key === CONSENT_STORAGE_KEY ? 'accepted' : null),
      },
      gtag: (_command: 'event', name: string, params?: Record<string, string | number | boolean>) => {
        gtagCalls.push({ name, params });
      },
      clarity: (...args: unknown[]) => {
        clarityCalls.push(args);
      },
    },
  });

  trackPricingTierSelected({ funnel: 'language-chines', tier: 'complete', valueBrl: 47, offerVariant: 'mandarin-ebook-sales-page' });
  trackBeginCheckout({ funnel: 'language-chines', tier: 'complete', valueBrl: 47, offerVariant: 'mandarin-ebook-sales-page' });
  trackPurchaseCompleted({ transactionId: 'pi_123', valueBrl: 47, offerVariant: 'mandarin-ebook-sales-page', tier: 'complete' });

  assert.deepEqual(
    gtagCalls.map((call) => call.name),
    ['select_pricing_tier', 'begin_checkout', 'purchase'],
  );
  assert.equal(gtagCalls[2]?.params?.value, 47);
  assert.equal(clarityCalls.some((call) => call[0] === 'event' && call[1] === 'purchase'), true);
});
