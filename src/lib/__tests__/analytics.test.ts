import assert from 'node:assert/strict';
import test from 'node:test';
import { CONSENT_STORAGE_KEY } from '@/components/privacy-scripts';
import { trackOfferFunnelEvent } from '@/lib/analytics';
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
