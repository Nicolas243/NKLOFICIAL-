import { expect, test } from '@playwright/test';

const TEST_CPF = '529.982.247-25';

test.describe('Oferta /guias/renda-extra (3 precos e checkout unificado)', () => {
  test('exibe exclusivamente os 3 precos com foco na assinatura de R$ 19/mes e alterna opcoes no formulario unico', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/guias/renda-extra');

    await expect(page.getByText('Pacote Completo (Avulso)')).toBeVisible();
    await expect(page.getByText('Assinatura Liberdade Financeira')).toBeVisible();
    await expect(page.getByText('Acervo Total NKL (11 Materiais)')).toBeVisible();

    await expect(page.locator('#discount-simulator-title')).toHaveCount(0);
    await expect(page.locator('#guide-purchase-cpf')).toHaveCount(0);
    await expect(page.locator('#guide-subscription-cpf')).toHaveCount(0);

    const checkoutCard = page.locator('#guide-unified-checkout');
    await expect(checkoutCard).toBeVisible();
    await expect(checkoutCard).toContainText('Guias para Liberdade Financeira');
    await expect(checkoutCard).toContainText('R$ 19/mês');
    await expect(
      checkoutCard.getByRole('button', { name: 'Começar por R$ 19/mês' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Escolher Pacote Único (R$ 39)' }).click();
    await expect(checkoutCard).toContainText('R$ 39,00');
    await expect(
      checkoutCard.getByRole('button', { name: 'Liberar pacote único (R$ 39)' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Escolher Acervo Total (R$ 247)' }).click();
    await expect(checkoutCard).toContainText('R$ 247,00');
    await expect(
      checkoutCard.getByRole('button', { name: 'Liberar Acervo Total (R$ 247)' }),
    ).toBeVisible();
  });

  test('suporta cta_variant 4 e fallback seguro para valores desconhecidos sem quebrar os 3 precos', async ({
    page,
  }) => {
    await page.goto('/guias/renda-extra?cta_variant=4');
    await expect(page.locator('#guide-unified-checkout')).toContainText('R$ 19/mês');
    await expect(page.getByRole('button', { name: 'Começar por R$ 19/mês' })).toBeVisible();

    await page.goto('/guias/renda-extra?cta_variant=99');
    await expect(page.locator('#guide-unified-checkout')).toContainText('R$ 19/mês');
    await page.getByRole('button', { name: 'Escolher Pacote Único (R$ 39)' }).click();
    await expect(page.locator('#guide-unified-checkout')).toContainText('R$ 39,00');
  });

  test('envia atribuicao guide-page-cta para assinatura (R$ 19/mes) e pacote unico (R$ 39) no checkout unificado', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('nkl_privacy_consent', 'accepted');
    });
    await page.route('/api/sales/verify-offer', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ verified: true }),
      });
    });

    const offerEvents: Array<Record<string, unknown>> = [];
    await page.route('/api/sales/offer-events', async (route) => {
      if (route.request().method() === 'POST') {
        offerEvents.push(JSON.parse(route.request().postData() ?? '{}'));
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ received: true }),
        });
        return;
      }
      await route.continue();
    });

    const subscriptionPayloads: Array<Record<string, unknown>> = [];
    await page.route('/api/payments/create-guide-subscription', async (route) => {
      subscriptionPayloads.push(JSON.parse(route.request().postData() ?? '{}'));
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Stripe indisponível no teste.' }),
      });
    });

    const oneTimePayloads: Array<Record<string, unknown>> = [];
    await page.route('/api/payments/create-guide-checkout', async (route) => {
      oneTimePayloads.push(JSON.parse(route.request().postData() ?? '{}'));
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Stripe indisponível no teste.' }),
      });
    });

    await page.goto('/guias/renda-extra?cta_variant=0');

    await page.locator('#guide-checkout-name').fill('Nicolas Santos');
    await page.locator('#guide-checkout-email').fill('buyer@example.com');
    await page.locator('#guide-checkout-cpf').fill(TEST_CPF);
    await page.locator('#guide-unified-checkout input[type="checkbox"]').check();

    await page.getByRole('button', { name: 'Começar por R$ 19/mês' }).click();
    await expect.poll(() => subscriptionPayloads.length).toBe(1);
    expect(subscriptionPayloads[0]).toMatchObject({
      offerVariant: 'guide-page-cta:0',
      cancelPath: '/guias/renda-extra',
      fullName: 'Nicolas Santos',
      email: 'buyer@example.com',
      cpf: TEST_CPF,
      cpfConsentConfirmed: true,
    });

    await page.getByRole('button', { name: 'Escolher Pacote Único (R$ 39)' }).click();
    await page.getByRole('button', { name: 'Liberar pacote único (R$ 39)' }).click();
    await expect.poll(() => oneTimePayloads.length).toBe(1);
    expect(oneTimePayloads[0]).toMatchObject({
      offerVariant: 'guide-page-cta:0',
      tier: 'complete',
      cancelPath: '/guias/renda-extra',
      fullName: 'Nicolas Santos',
      email: 'buyer@example.com',
      cpf: TEST_CPF,
      cpfConsentConfirmed: true,
    });

    await expect(page.locator('#guide-unified-checkout [role="alert"]')).toContainText('Stripe indisponível no teste.');
    await expect
      .poll(() =>
        offerEvents.some(
          (event) =>
            event.experiment === 'guide-page-cta' &&
            event.variant === '0' &&
            event.eventType === 'checkout',
        ),
      )
      .toBe(true);
  });
});
