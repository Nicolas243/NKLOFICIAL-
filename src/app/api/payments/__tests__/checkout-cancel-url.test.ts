import assert from 'node:assert/strict';
import test from 'node:test';
import { getGuideCancelPath } from '@/lib/guide-offer';
import {
  extractSameOriginCancelPath,
  resolveSafeCheckoutCancelUrl,
  sanitizeInternalCancelPath,
} from '@/lib/stripe/checkout';

const SITE_URL = 'https://nkloficial.com.br';

test('resolveSafeCheckoutCancelUrl returns exact /ofertas/[slug]/checkout URL for all 6 products', () => {
  const slugs = [
    'bussola-negocios',
    'ferramenta-ia',
    'pacote-idiomas-ia',
    'pacote-renda-extra',
    'ebook-ingles',
    'curso-ia-pratica',
  ] as const;

  for (const slug of slugs) {
    const withExplicit = resolveSafeCheckoutCancelUrl({
      siteUrl: SITE_URL,
      cancelPath: `/ofertas/${slug}/checkout`,
      productSlug: slug,
      fallbackPath: getGuideCancelPath('sales-page'),
    });
    assert.equal(withExplicit, `${SITE_URL}/ofertas/${slug}/checkout`);

    const byProductSlugOnly = resolveSafeCheckoutCancelUrl({
      siteUrl: SITE_URL,
      productSlug: slug,
      fallbackPath: getGuideCancelPath('sales-page'),
    });
    assert.equal(byProductSlugOnly, `${SITE_URL}/ofertas/${slug}/checkout`);
  }
});

test('resolveSafeCheckoutCancelUrl preserves /guias/[lang] and /ia/oferta origins', () => {
  assert.equal(
    resolveSafeCheckoutCancelUrl({
      siteUrl: `${SITE_URL}/`,
      referer: `${SITE_URL}/guias/italiano`,
      fallbackPath: getGuideCancelPath('italian-ebook-sales-page'),
    }),
    `${SITE_URL}/guias/italiano`,
  );

  assert.equal(
    resolveSafeCheckoutCancelUrl({
      siteUrl: SITE_URL,
      referer: `${SITE_URL}/ia/oferta`,
      fallbackPath: '/ia/oferta?checkout=cancelled',
    }),
    `${SITE_URL}/ia/oferta`,
  );

  assert.equal(
    resolveSafeCheckoutCancelUrl({
      siteUrl: SITE_URL,
      fallbackPath: '/ia/oferta?checkout=cancelled',
    }),
    `${SITE_URL}/ia/oferta?checkout=cancelled`,
  );
});

test('rejects open redirects and cross-origin referers safely', () => {
  assert.equal(sanitizeInternalCancelPath('https://evil.example/phish'), null);
  assert.equal(sanitizeInternalCancelPath('//evil.example/ofertas/bussola-negocios/checkout'), null);
  assert.equal(sanitizeInternalCancelPath('/ofertas\\bussola-negocios'), null);
  assert.equal(sanitizeInternalCancelPath('/admin'), null);

  assert.equal(
    extractSameOriginCancelPath('https://evil.example/ofertas/bussola-negocios/checkout', SITE_URL),
    null,
  );

  assert.equal(
    resolveSafeCheckoutCancelUrl({
      siteUrl: SITE_URL,
      cancelPath: 'https://evil.example/steal',
      referer: 'https://evil.example/guias/ingles',
      fallbackPath: '/guias/renda-extra',
    }),
    `${SITE_URL}/guias/renda-extra`,
  );
});
