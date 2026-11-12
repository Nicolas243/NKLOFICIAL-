import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getDismissalExpiry,
  getRifaCampaignUrl,
  isRifaCampaignRoute,
  RIFA_CAMPAIGN_COPY,
  RIFA_CAMPAIGN_URL,
  trackRifaCampaignEvent,
} from './rifa-campaign';

test('defines the canonical raffle URL and transparent copy', () => {
  assert.equal(RIFA_CAMPAIGN_URL, 'https://123rifas.com/acao/os-3-melhores-livros-de-financas-fisicos');
  assert.match(RIFA_CAMPAIGN_COPY.banner.title, /Portal NKL/u);
  assert.match(JSON.stringify(RIFA_CAMPAIGN_COPY), /3 livros físicos/u);
  assert.doesNotMatch(JSON.stringify(RIFA_CAMPAIGN_COPY), /Participar por R\$ 3/u);
  assert.doesNotMatch(JSON.stringify(RIFA_CAMPAIGN_COPY), /123Rifas/u);
  assert.doesNotMatch(JSON.stringify(RIFA_CAMPAIGN_COPY), /doação/u);
});

test('excludes private and transactional routes', () => {
  assert.equal(isRifaCampaignRoute('/programas'), true);
  assert.equal(isRifaCampaignRoute('/'), true);
  for (const pathname of ['/checkout/abc', '/login', '/registro', '/perfil', '/dashboard/aluno', '/admin', '/api/health', '/_not-found']) {
    assert.equal(isRifaCampaignRoute(pathname), false, pathname);
  }
});

test('builds a surface-specific URL with safe UTM parameters', () => {
  assert.equal(
    getRifaCampaignUrl('banner'),
    `${RIFA_CAMPAIGN_URL}?utm_source=portal-nkl&utm_medium=referral&utm_campaign=rifa-livros&utm_content=banner`,
  );
});

test('expires banner dismissal after seven days', () => {
  const now = 1_700_000_000_000;
  assert.equal(getDismissalExpiry(now), now + 7 * 24 * 60 * 60 * 1000);
});

test('does not throw when aggregate event tracking fails', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('offline');
  };
  await assert.doesNotReject(() => trackRifaCampaignEvent({
    surface: 'banner',
    action: 'impression',
  }));
  globalThis.fetch = originalFetch;
});

test('normalizes campaign actions to the offer-events contract', async () => {
  const originalFetch = globalThis.fetch;
  let payload: Record<string, string> | undefined;
  globalThis.fetch = async (_input, init) => {
    payload = JSON.parse(String(init?.body)) as Record<string, string>;
    return new Response(null, { status: 201 });
  };
  await trackRifaCampaignEvent({ surface: 'card', action: 'participate' });
  assert.equal(payload?.experiment, 'rifa-livros');
  assert.equal(payload?.variant, 'card');
  assert.equal(payload?.eventType, 'click');
  globalThis.fetch = originalFetch;
});
